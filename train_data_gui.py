import tkinter as tk
from tkinter import filedialog, messagebox
import os
from ultralytics import YOLO

# Function to open file dialog and select dataset folder
def select_dataset():
    folder_selected = filedialog.askdirectory(title="Select Dataset Folder")
    if folder_selected:
        dataset_entry.delete(0, tk.END)  # Clear existing text
        dataset_entry.insert(0, folder_selected)  # Insert new folder path

# Function to start training
def start_training():
    dataset_path = dataset_entry.get()
    class_names = classes_entry.get().split(',')

    if not dataset_path or not class_names:
        messagebox.showerror("Error", "Please provide dataset path and class names!")
        return

    # Create a YAML config file for YOLO training
    yaml_content = f"""
path: {dataset_path}
train: images/train
val: images/val
nc: {len(class_names)}
names: {class_names}
"""
    yaml_path = os.path.join(dataset_path, "custom_dataset.yaml")
    with open(yaml_path, "w") as f:
        f.write(yaml_content)

    messagebox.showinfo("Training", "Training started... Check terminal for progress.")

    # Load YOLO model and start training
    model = YOLO("yolov8m.pt")  # You can change to another model like yolov8s.pt
    model.train(data=yaml_path, epochs=150, imgsz=800, batch=8, augment=True, lr0=0.001,name="Accident_Detection_v1")

    messagebox.showinfo("Training", "Training Completed!")

# Tkinter GUI Window
root = tk.Tk()
root.title("Train YOLOv8 Model")
root.geometry("500x300")

# Dataset Upload Button
tk.Label(root, text="Dataset Path:").pack(pady=5)
dataset_entry = tk.Entry(root, width=50)
dataset_entry.pack()
tk.Button(root, text="Upload Dataset", command=select_dataset).pack(pady=5)

# Class Names Input
tk.Label(root, text="Enter Class Names (comma-separated):").pack(pady=5)
classes_entry = tk.Entry(root, width=50)
classes_entry.pack()

# Start Training Button
tk.Button(root, text="Start Training", command=start_training, bg="green", fg="white").pack(pady=20)

root.mainloop()
