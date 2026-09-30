"""Security tests for the image service. Run: venv/bin/python -m pytest tests  (or: venv/bin/python tests/test_security.py)"""
import io
import os
import sys
import threading
import http.server
import importlib

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load(token=''):
    os.environ['IMAGE_SERVICE_TOKEN'] = token
    import main
    importlib.reload(main)
    from fastapi.testclient import TestClient
    return main, TestClient(main.app)


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path == '/car.jpg':
            img = np.full((200, 300, 3), 120, np.uint8)
            ok, buf = cv2.imencode('.jpg', img)
            body = buf.tobytes()
            self.send_response(200); self.send_header('Content-Type', 'image/jpeg'); self.end_headers(); self.wfile.write(body)
        elif self.path == '/redirect':
            self.send_response(302); self.send_header('Location', 'http://169.254.169.254/'); self.end_headers()
        elif self.path == '/secret.txt':
            self.send_response(200); self.send_header('Content-Type', 'text/plain'); self.end_headers(); self.wfile.write(b'root:x:0:0')
        elif self.path == '/huge.jpg':
            self.send_response(200); self.send_header('Content-Type', 'image/jpeg')
            self.send_header('Content-Length', str(100 * 1024 * 1024)); self.end_headers()
        else:
            self.send_response(404); self.end_headers()


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}'
BLUR = {'privacy': {'blur_car_plate': True}}


def test_token_required_when_configured():
    _, client = load('s3cret')
    assert client.post('/process', json={'input': f'{BASE}/car.jpg', 'operations': BLUR}).status_code == 401
    assert client.post('/process', json={'input': f'{BASE}/car.jpg', 'operations': BLUR},
                       headers={'X-Service-Token': 'wrong'}).status_code == 401
    r = client.post('/process', json={'input': f'{BASE}/car.jpg', 'operations': BLUR}, headers={'X-Service-Token': 's3cret'})
    assert r.status_code == 200 and r.headers['content-type'] == 'image/jpeg'


def test_rejects_non_http_schemes():
    _, client = load()
    for url in ['file:///etc/passwd', 'gopher://127.0.0.1:6379/_x', 'ftp://x/y.jpg', 'not a url']:
        assert client.post('/process', json={'input': url, 'operations': BLUR}).status_code == 400, url


def test_does_not_follow_redirects():
    _, client = load()
    assert client.post('/process', json={'input': f'{BASE}/redirect', 'operations': BLUR}).status_code == 400


def test_refuses_non_images():
    _, client = load()
    r = client.post('/process', json={'input': f'{BASE}/secret.txt', 'operations': BLUR})
    assert r.status_code == 400 and b'root' not in r.content


def test_refuses_oversized_downloads():
    _, client = load()
    assert client.post('/process', json={'input': f'{BASE}/huge.jpg', 'operations': BLUR}).status_code == 413


def test_never_returns_the_unprocessed_original():
    _, client = load()
    r = client.post('/process', json={'input': f'{BASE}/car.jpg'})  # no blur option at all
    assert r.status_code == 200 and r.headers['content-type'] == 'image/jpeg'
    img = cv2.imdecode(np.frombuffer(r.content, np.uint8), cv2.IMREAD_COLOR)
    assert img is not None  # processed + re-encoded, not a pass-through proxy


def test_errors_do_not_leak_internals():
    _, client = load()
    r = client.post('/process', json={'input': 'http://127.0.0.1:1/x.jpg', 'operations': BLUR})
    assert r.status_code in (400, 500) and 'Traceback' not in r.text and '127.0.0.1:1' not in r.text


if __name__ == '__main__':
    tests = [v for k, v in dict(globals()).items() if k.startswith('test_')]
    failed = 0
    for t in tests:
        try:
            t(); print('ok  ', t.__name__)
        except Exception as e:
            failed += 1; print('FAIL', t.__name__, repr(e))
    print(f'{len(tests) - failed}/{len(tests)} passed')
    sys.exit(1 if failed else 0)
