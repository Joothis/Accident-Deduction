from ultralytics import YOLO
import torch
device = "cuda" if torch.cuda.is_available() else "cpu"
model = YOLO("yolov8m.pt")  # Use YOLOv8m (medium) or yolov8l (large)

model.train(
    data=r"C:\Users\jooth\Desktop\Projects\Accident Deduction\Dataset\data.yaml",  # Path to dataset config
    epochs=150,  # More epochs improve accuracy
    batch=16,  # Adjust based on GPU
    imgsz=640,  # Increase to 1024 for better accuracy
    optimizer="AdamW",  # Try 'SGD' or 'AdamW'
    lr0=0.001,  # Adjust learning rate
    lrf=0.0001,  # Final learning rate
    momentum=0.937,  # Momentum for SGD
    weight_decay=0.0005,  # Regularization
    iou=0.6,  # Intersection over Union (IoU) threshold
    augment=True,  # Enable data augmentation
    device=device  # Use GPU
    
)
