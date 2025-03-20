# object_detector.py
from ultralytics import YOLO
import cv2
import numpy as np

# Load YOLOv8 pre-trained model (change "yolov8n.pt" to another weight if desired)
model = YOLO("yolov8m.pt")  # You can also use "yolov8s.pt", "yolov8m.pt", etc.

def detect_objects(frame, conf_threshold=0.25):
    """
    Detect objects in the frame using YOLOv8.
    Returns a list of detections with bounding boxes and class labels.
    
    Each detection is represented as a dictionary:
        {
            'class': <class label>,
            'confidence': <confidence score>,
            'bbox': [xmin, ymin, xmax, ymax]
        }
    """
    # Convert the frame from BGR to RGB
    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Run inference on the frame
    results = model(img_rgb)
    
    detections = []
    # YOLOv8 returns a list (one per image, here we have one)
    for box in results[0].boxes:
        # Get bounding box coordinates as a list: [xmin, ymin, xmax, ymax]
        bbox = box.xyxy.cpu().numpy()[0].tolist()
        confidence = float(box.conf.cpu().numpy()[0])
        class_idx = int(box.cls.cpu().numpy()[0])
        class_label = model.model.names[class_idx]  # Get label name
        
        # Only include detections above the confidence threshold
        if confidence >= conf_threshold:
            detections.append({
                'class': class_label,
                'confidence': confidence,
                'bbox': [int(x) for x in bbox]
            })
    return detections

if __name__ == '__main__':
    # Test the object detection on an example image
    test_image_path = r"C:\Users\klshk\OneDrive\Desktop\videoplayback (online-video-cutter.com).mp4"  # replace with your image path
    frame = cv2.imread(test_image_path)
    
    if frame is None:
        print("Error loading image!")
        exit(1)
    
    detections = detect_objects(frame)
    print("Detections:", detections)
    
    # Draw bounding boxes and labels on the frame
    for det in detections:
        x1, y1, x2, y2 = det['bbox']
        label_text = f"{det['class']} {det['confidence']:.2f}"
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, label_text, (x1, y1 - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # Display the frame with detections
    cv2.imshow("YOLOv8 Detections", frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
