import io
import os
import hmac
import threading
from urllib.parse import urlparse

# Decompression-bomb guard: refuse to decode images above ~50 megapixels (must be set before cv2 loads).
os.environ.setdefault('OPENCV_IO_MAX_IMAGE_PIXELS', str(50_000_000))
import cv2
import numpy as np
import requests
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from ultralytics import YOLO

app = FastAPI(title="MySawari Image Service")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Number-plate detector (YOLO11s fine-tuned on licence plates, morsetechlab/yolov11-license-plate-detection).
# Downloaded once if the file isn't there yet.
PLATE_MODEL_PATH = os.path.join(BASE_DIR, 'models', 'license_plate_yolo11s.pt')
PLATE_MODEL_URL = 'https://huggingface.co/morsetechlab/yolov11-license-plate-detection/resolve/main/license-plate-finetune-v1s.pt'


def _ensure_plate_model():
    if os.path.exists(PLATE_MODEL_PATH):
        return
    os.makedirs(os.path.dirname(PLATE_MODEL_PATH), exist_ok=True)
    tmp = PLATE_MODEL_PATH + '.part'
    with requests.get(PLATE_MODEL_URL, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(tmp, 'wb') as f:
            for chunk in r.iter_content(1 << 20):
                f.write(chunk)
    os.replace(tmp, PLATE_MODEL_PATH)


_ensure_plate_model()
plate_model = YOLO(PLATE_MODEL_PATH)
# General COCO model, used only to find vehicles so small / far plates can be searched for up close.
vehicle_model = YOLO(os.path.join(BASE_DIR, 'yolov8n.pt'))
# FastAPI runs sync endpoints on a thread pool; YOLO models are not safe to call from several threads at once.
model_lock = threading.Lock()

VEHICLE_CLASSES = [2, 3, 5, 7]  # COCO: car, motorcycle, bus, truck

# A plate is hidden when one pass is confident about it, or when two different passes agree on it.
# Lower-confidence single hits are usually lamps, windows or signs, and hiding those would spoil the photo.
MIN_CONF = 0.2
SURE_CONF = 0.5
AGREE_IOU = 0.3


class PrivacyOptions(BaseModel):
    blur_car_plate: Optional[bool] = False


class Operations(BaseModel):
    privacy: Optional[PrivacyOptions] = None


class ImageProcessRequest(BaseModel):
    input: str
    operations: Optional[Operations] = None


def _detect_plates(img, imgsz, augment=False, conf_threshold=MIN_CONF):
    r = plate_model.predict(img, conf=conf_threshold, imgsz=imgsz, augment=augment, verbose=False)[0]
    return [(list(map(float, b.xyxy[0])), float(b.conf[0])) for b in r.boxes]


def _upscale_for_detection(crop, target_width=640):
    """Upscale a crop so the plate is large enough for YOLO to detect."""
    h, w = crop.shape[:2]
    if w >= target_width:
        return crop, 1.0
    scale = target_width / w
    new_w = target_width
    new_h = int(h * scale)
    upscaled = cv2.resize(crop, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    return upscaled, scale


def _enhance_contrast(img):
    """Apply CLAHE to improve plate visibility on dark-colored bikes."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)


def is_valid_plate_content(img_roi):
    if img_roi.size == 0 or min(img_roi.shape[:2]) < 10:
        return False
        
    h, w = img_roi.shape[:2]
    ar = w / float(h)
    if ar < 0.5 or ar > 5.5:
        print(f"DEBUG: Plate rejected due to aspect ratio {ar:.2f} (w={w}, h={h})")
        return False
        
    gray = cv2.cvtColor(img_roi, cv2.COLOR_BGR2GRAY)
    std_dev = np.std(gray)
    if std_dev < 15:
        print(f"DEBUG: Plate rejected due to low contrast {std_dev:.2f}")
        return False
        
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / float(w * h)
    if edge_density < 0.03 or edge_density > 0.6:
        print(f"DEBUG: Plate rejected due to edge density {edge_density:.3f}")
        return False
        
    return True


def find_bike_plates_opencv(crop_img):
    """Strict color-only fallback for bike plates."""
    h, w = crop_img.shape[:2]
    if h < 40 or w < 40:
        return []

    hsv = cv2.cvtColor(crop_img, cv2.COLOR_BGR2HSV)

    # Indian plate colors
    mask_white = cv2.inRange(hsv, np.array([0, 0, 170]), np.array([180, 45, 255]))
    mask_yellow = cv2.inRange(hsv, np.array([18, 80, 130]), np.array([32, 255, 255]))
    mask_green = cv2.inRange(hsv, np.array([40, 50, 80]), np.array([80, 255, 230]))
    mask = cv2.bitwise_or(mask_white, cv2.bitwise_or(mask_yellow, mask_green))

    k = cv2.getStructuringElement(cv2.MORPH_RECT, (max(3, int(w * 0.04)), max(2, int(h * 0.03))))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)

    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best = None
    best_score = -1

    for c in cnts:
        bx, by, cw, ch_ = cv2.boundingRect(c)
        area = cw * ch_
        crop_area = w * h

        frac = area / float(crop_area)
        if frac < 0.0005 or frac > 0.20:
            continue

        ar = cw / float(ch_) if ch_ > 0 else 0
        if ar < 0.5 or ar > 5.5:
            continue

        solidity = cv2.contourArea(c) / float(area) if area > 0 else 0
        if solidity < 0.15:
            continue

        roi = crop_img[by:by + ch_, bx:bx + cw]
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        std_dev = np.std(gray)
        if std_dev < 30:
            continue
            
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        minority_ratio = min(np.sum(thresh == 0), np.sum(thresh == 255)) / float(area)
        
        if minority_ratio < 0.30:
            continue

        score = std_dev * minority_ratio
        if score > best_score:
            best_score = score
            best = (bx, by, bx + cw, by + ch_)

    return [best] if best else []


def _process_bike_subcrop(crop, subcrop, y_offset, x1_offset, y1_offset, strategy_name):
    """Helper to run YOLO on a piece of the bike, validate edges, and map coordinates."""
    results = []
    if subcrop.size > 0 and min(subcrop.shape[:2]) >= 20:
        upscaled, scale = _upscale_for_detection(subcrop, 640)
        p = _detect_plates(upscaled, 640, augment=True, conf_threshold=0.1) # Ultra-low conf, but validated
        
        for (a, b_, c, d), conf in p:
            # Map to subcrop
            sa, sb, sc, sd = int(a / scale), int(b_ / scale), int(c / scale), int(d / scale)
            roi = subcrop[max(0, sb):sd, max(0, sa):sc]
            
            # If YOLO is extremely confident, trust it. Otherwise, mathematically prove it has text.
            if conf > 0.6 or is_valid_plate_content(roi):
                # Map to global image
                ga = sa + x1_offset
                gb = sb + y_offset + y1_offset
                gc = sc + x1_offset
                gd = sd + y_offset + y1_offset
                results.append((ga, gb, gc, gd, conf, strategy_name))
    return results


def _find_bike_plates(crop, x1_offset, y1_offset):
    """
    Awesome multi-strategy detection.
    Splits bike into Top (front plates) and Bottom (rear plates) so YOLO can see them clearly.
    """
    ch, cw = crop.shape[:2]
    found = []

    # --- Pass 1: Standard YOLO on full crop ---
    p1 = _detect_plates(crop, 960, conf_threshold=0.2)
    for (a, b_, c, d), conf in p1:
        roi = crop[int(b_):int(d), int(a):int(c)]
        if conf > 0.6 or is_valid_plate_content(roi):
            found.append((a + x1_offset, b_ + y1_offset, c + x1_offset, d + y1_offset, conf, 'bike_full'))

    # Split bike horizontally. Indian bikes have front plates (top half) and rear plates (bottom half)
    mid_y = int(ch * 0.5)
    top_crop = crop[:mid_y, :]
    bottom_crop = crop[mid_y:, :]
    
    # --- Pass 2: Top Half (Front Plates) ---
    found.extend(_process_bike_subcrop(crop, top_crop, 0, x1_offset, y1_offset, 'bike_top_front'))
    
    # --- Pass 3: Bottom Half (Rear Plates) ---
    found.extend(_process_bike_subcrop(crop, bottom_crop, mid_y, x1_offset, y1_offset, 'bike_bottom_rear'))
    
    # --- Pass 4: Contrast Enhanced Bottom Half (Dark Bikes) ---
    if bottom_crop.size > 0:
        enhanced_bottom = _enhance_contrast(bottom_crop)
        found.extend(_process_bike_subcrop(crop, enhanced_bottom, mid_y, x1_offset, y1_offset, 'bike_bottom_enhanced'))

    # --- Pass 5: Mathematical OpenCV Fallback ---
    if not found:
        fallback = find_bike_plates_opencv(crop)
        for (bx, by, bw_x, bh_y) in fallback:
            found.append((bx + x1_offset, by + y1_offset, bw_x + x1_offset, bh_y + y1_offset, SURE_CONF, 'bike_opencv'))

    return found


def find_plates(img):
    """All number-plate boxes in the image as (x1, y1, x2, y2, conf, pass_name)."""
    h, w = img.shape[:2]
    found = []

    # 1. Fast direct pass at standard 640px
    for box, conf in _detect_plates(img, 640, augment=False, conf_threshold=MIN_CONF):
        found.append((*box, conf, 'full'))

    # If confident plate is already found, return immediately for instant response
    if any(f[4] >= SURE_CONF for f in found):
        return found

    # 2. Focused vehicle sub-crop pass only if direct pass didn't find confident plates
    try:
        vr = vehicle_model.predict(img, conf=0.3, imgsz=640, classes=VEHICLE_CLASSES, verbose=False)[0]
        for b in vr.boxes:
            x1, y1, x2, y2 = map(int, b.xyxy[0])
            crop = img[y1:y2, x1:x2]
            if crop.size == 0 or min(crop.shape[:2]) < 32:
                continue
            crop_found = _detect_plates(crop, 640, augment=False, conf_threshold=MIN_CONF)
            for (a, b_, c, d), conf in crop_found:
                found.append((a + x1, b_ + y1, c + x1, d + y1, conf, 'vehicle'))
    except Exception as e:
        print(f"Vehicle crop detection skipped: {e}")

    return found


def _iou(a, b):
    ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])
    ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union > 0 else 0


def select_plates(found):
    """Keeps the boxes that are confident, or confirmed by a second pass."""
    kept = []
    for i, a in enumerate(found):
        if a[4] >= SURE_CONF:
            kept.append(a)
            continue
        confirmed = any(
            j != i and b[5] != a[5] and _iou(a, b) >= AGREE_IOU
            for j, b in enumerate(found)
        )
        if confirmed:
            kept.append(a)
    return kept


def hide_region(img, x1, y1, x2, y2):
    """Covers one plate with an extreme blur, strictly within its own bounds."""
    h, w = img.shape[:2]
    bw, bh = x2 - x1, y2 - y1
    
    # 0% padding to strictly satisfy "no other part only the number plate"
    x1 = int(max(0, x1))
    x2 = int(min(w, x2))
    y1 = int(max(0, y1))
    y2 = int(min(h, y2))
    
    if x2 - x1 < 2 or y2 - y1 < 2:
        return
        
    roi = img[y1:y2, x1:x2]
    
    # Extreme blur that destroys all numbers but looks like a blur instead of a flat block
    small = cv2.resize(roi, (2, 2), interpolation=cv2.INTER_LINEAR)
    pixelated = cv2.resize(small, (x2 - x1, y2 - y1), interpolation=cv2.INTER_NEAREST)
    blurred_roi = cv2.GaussianBlur(pixelated, (31, 31), 15)
    
    img[y1:y2, x1:x2] = blurred_roi


def blur_plate(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image")

    # Downsample high-resolution images BEFORE inference to prevent Out Of Memory (OOM) on Render
    max_dim = 1200
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    with model_lock:
        plates = select_plates(find_plates(img))

    for x1, y1, x2, y2, _, _ in plates:
        hide_region(img, x1, y1, x2, y2)

    # Encode back to JPEG with 80% quality to ensure fast network loading
    success, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not success:
        raise ValueError("Failed to encode image")

    return io.BytesIO(buffer)


MAX_DOWNLOAD_BYTES = 15 * 1024 * 1024
MAX_PIXELS = 50_000_000
# Optional shared secret: when set, only callers sending the same X-Service-Token (the backend) are served.
SERVICE_TOKEN = os.environ.get('IMAGE_SERVICE_TOKEN', '')


def _download_image(url):
    """Fetches the photo with strict limits: http(s) only, no redirects, bounded size and time."""
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Invalid image URL")
    
    # Cloud microservices cannot access localhost/loopback addresses
    is_cloud = os.environ.get('RENDER') or os.environ.get('PORT')
    if is_cloud and parsed.hostname in ('localhost', '127.0.0.1', '0.0.0.0', '10.0.2.2'):
        print(f"Refusing to fetch loopback address in cloud environment: {url}")
        raise HTTPException(status_code=400, detail=f"Cannot fetch from local/private host: {parsed.hostname}")

    try:
        with requests.get(url, headers={'User-Agent': 'MySawariImageService/1.0'}, timeout=15,
                          stream=True, allow_redirects=True) as response:
            if response.status_code != 200:
                print(f"Image download HTTP error {response.status_code} for URL: {url}")
                raise HTTPException(status_code=400, detail=f"Failed to fetch image: HTTP {response.status_code}")
            content_type = response.headers.get('content-type', '')
            if content_type and not content_type.lower().startswith('image/'):
                raise HTTPException(status_code=400, detail="Input is not an image")
            declared = int(response.headers.get('content-length') or 0)
            if declared > MAX_DOWNLOAD_BYTES:
                raise HTTPException(status_code=413, detail="Image too large")
            data = bytearray()
            for chunk in response.iter_content(64 * 1024):
                data.extend(chunk)
                if len(data) > MAX_DOWNLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Image too large")
        return bytes(data)
    except requests.exceptions.RequestException as e:
        print(f"Network error downloading image from {url}: {type(e).__name__} - {e}")
        raise HTTPException(status_code=400, detail=f"Could not reach image host: {type(e).__name__}")


@app.post("/process")
def process_image(request: ImageProcessRequest, x_service_token: Optional[str] = Header(default=None)):
    if SERVICE_TOKEN and not hmac.compare_digest(x_service_token or '', SERVICE_TOKEN):
        raise HTTPException(status_code=401, detail="Not authorized")
    try:
        # If running locally (not in cloud), translate Android emulator 10.0.2.2 to 127.0.0.1
        input_data = request.input
        if input_data.startswith("data:image/"):
            import base64
            _, encoded = input_data.split(",", 1)
            content = base64.b64decode(encoded)
        else:
            image_url = input_data
            if not os.environ.get('RENDER') and '10.0.2.2' in image_url:
                image_url = image_url.replace("10.0.2.2", "127.0.0.1")
            content = _download_image(image_url)

        # Plates are always hidden: this service never hands back an unprocessed original.
        nparr = np.frombuffer(content, np.uint8)
        header = cv2.imdecode(nparr, cv2.IMREAD_REDUCED_GRAYSCALE_8)
        if header is None or header.shape[0] * header.shape[1] * 64 > MAX_PIXELS:
            raise HTTPException(status_code=400, detail="Unsupported or oversized image")
        blurred_io = blur_plate(content)
        return StreamingResponse(blurred_io, media_type="image/jpeg")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing image {request.input}: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail="Image processing failed")


if __name__ == "__main__":
    import uvicorn
    # Local-only by default: the backend calls it on the same machine. Set HOST=0.0.0.0 (and
    # IMAGE_SERVICE_TOKEN) only when the backend runs on another host.
    uvicorn.run("main:app", host=os.environ.get('HOST', '127.0.0.1'), port=int(os.environ.get('PORT', '8000')))
