from flask import Flask, render_template, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
import base64

app = Flask(__name__)
model = YOLO(r'D:\DEVANSH COLLEGE\Btech 7th Sem\MAJOR PROJECT\Yolo\best.pt')

def draw_boxes(image, results):
    labels = []
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cls = int(box.cls[0])
            conf = box.conf[0]
            label_text = f"{model.names[cls]} {conf:.2f}"
            labels.append(label_text)
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            (w, h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
            cv2.rectangle(image, (x1, y1 - 20), (x1 + w, y1), (0, 255, 0), -1)
            cv2.putText(image, label_text, (x1, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
    return image, labels

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/people')
def people():
    return render_template('people.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        results = model(img)
        img_with_boxes, labels = draw_boxes(img, results)

        _, buffer = cv2.imencode('.jpg', img_with_boxes)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        return jsonify({'image': img_base64, 'labels': labels})


        # return jsonify({'image': img_base64, 'labels': labels})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/detect-frame', methods=['POST'])
def detect_frame():
    data = request.get_json()
    img_data = data.get('image')
    if not img_data:
        return jsonify({'error': 'No image data'}), 400

    try:
        header, encoded = img_data.split(',', 1)  # data:image/jpeg;base64,...
        img_bytes = base64.b64decode(encoded)
        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        results = model(img)
        img_with_boxes, labels = draw_boxes(img, results)

        _, buffer = cv2.imencode('.jpg', img_with_boxes)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        return jsonify({'image': img_base64, 'labels': labels})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
