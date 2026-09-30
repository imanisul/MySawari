import cv2
import numpy as np
from main import vehicle_model, find_bike_plates_opencv

img = cv2.imread('avenis.jpg')
print("Image shape:", img.shape)

# Run vehicle model
vr = vehicle_model.predict(img, conf=0.1, verbose=False)[0]
print("Vehicles found:")
for b in vr.boxes:
    cls = int(b.cls[0])
    conf = float(b.conf[0])
    x1, y1, x2, y2 = map(int, b.xyxy[0])
    print(f"  Class {cls}, Conf {conf:.2f}, Box [{x1}, {y1}, {x2}, {y2}]")
    
    if cls == 3: # motorcycle
        crop = img[y1:y2, x1:x2]
        
        # Test the OpenCV fallback on this crop
        h_roi, w_roi = crop.shape[:2]
        
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        mask_white = cv2.inRange(hsv, np.array([0, 0, 170]), np.array([180, 45, 255]))
        mask_yellow = cv2.inRange(hsv, np.array([18, 80, 130]), np.array([32, 255, 255]))
        mask_green = cv2.inRange(hsv, np.array([40, 50, 80]), np.array([80, 255, 230]))
        mask = cv2.bitwise_or(mask_white, cv2.bitwise_or(mask_yellow, mask_green))
        
        k = cv2.getStructuringElement(cv2.MORPH_RECT, (max(3, int(w_roi * 0.04)), max(2, int(h_roi * 0.03))))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)
        
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        print(f"Found {len(cnts)} raw contours")
        
        for c in cnts:
            x, y, w, h = cv2.boundingRect(c)
            area = w * h
            crop_area = w_roi * h_roi
            frac = area / float(crop_area)
            
            print(f"Contour: w={w}, h={h}, area={area}, frac={frac:.4f}")
            if frac < 0.0005 or frac > 0.20:
                continue
                
            ar = w / float(h)
            if ar < 0.5 or ar > 5.5:
                print(f"Rejected: frac={frac:.3f}, ar={ar:.2f} (w={w}, h={h})")
                continue
                
            solidity = cv2.contourArea(c) / float(area) if area > 0 else 0
            if solidity < 0.15:
                print(f"Rejected: ar={ar:.2f}, solidity={solidity:.3f}")
                continue
                
            roi = crop[y:y+h, x:x+w]
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            std_dev = np.std(gray)
            if std_dev < 30:
                print(f"Rejected: ar={ar:.2f}, std_dev={std_dev:.2f}")
                continue
                
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            minority_ratio = min(np.sum(thresh == 0), np.sum(thresh == 255)) / float(area)
            if minority_ratio < 0.30:
                print(f"Rejected: ar={ar:.2f}, minority={minority_ratio:.3f}")
                continue
                
            print(f"PASSED! w={w}, h={h}, ar={ar:.2f}, std={std_dev:.2f}, min={minority_ratio:.3f}")
            cv2.rectangle(img, (x1+x, y1+y), (x1+x+w, y1+y+h), (0, 255, 0), 2)
            
cv2.imwrite('test_out_avenis.jpg', img)
print("Saved to test_out_avenis.jpg")



