# lpr_alert.py
import cv2
import pytesseract
import requests

# Optional: Configure pytesseract to point to the Tesseract executable.
# For example, on Windows, it might look like this:
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_license_plate(frame, bbox):
    """
    Crop the frame to the bounding box (assumed to contain the plate)
    and perform OCR using Tesseract.
    
    Parameters:
        frame (numpy.ndarray): The input image frame in BGR format.
        bbox (list or tuple): Bounding box coordinates [xmin, ymin, xmax, ymax].
    
    Returns:
        str: The extracted license plate text.
    """
    x1, y1, x2, y2 = bbox
    # Crop the image to the bounding box
    plate_img = frame[y1:y2, x1:x2]
    # Convert the cropped image to grayscale for better OCR results
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    # Optionally apply thresholding (uncomment if needed)
    # gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    # Use Tesseract to extract text (using page segmentation mode 7 which treats the image as a single text line)
    text = pytesseract.image_to_string(gray, config='--psm 7')
    return text.strip()

def send_alert(location, time_of_incident, plate_numbers):
    """
    Send alert with accident details (this could be an HTTP POST request to HQ).
    
    Parameters:
        location (str): The location of the accident.
        time_of_incident (str): The timestamp of when the accident occurred.
        plate_numbers (list): List of detected license plate texts.
    
    Returns:
        int or None: The HTTP status code if the alert was sent successfully, or None if it failed.
    """
    payload = {
        "location": location,
        "time": time_of_incident,
        "plates": plate_numbers
    }
    # Replace this URL with the actual endpoint of your headquarters server.
    url = "http://your-headquarters-endpoint/alert"
    try:
        response = requests.post(url, json=payload)
        return response.status_code
    except Exception as e:
        print("Failed to send alert:", e)
        return None

# Example integration for testing:
if __name__ == '__main__':
    import video_feed  # Assumes you have a module to provide video frames.
    import object_detector  # Module that provides YOLO-based detection.
    import collision_detection  # Module for checking collisions.
    
    video_source = "path_to_video.mp4"  # Replace with your video file or 0 for webcam.
    
    for frame in video_feed.get_video_frames(video_source):
        detections = object_detector.detect_objects(frame)
        
        # Check if we have detections and if a collision is flagged
        if not detections.empty and collision_detection.check_collision(detections):
            plate_numbers = []
            # For each detection, if the detected object class suggests a license plate,
            # attempt OCR extraction. Adjust the condition as per your model’s labels.
            for idx, row in detections.iterrows():
                if "license" in row['name'].lower():
                    bbox = (int(row['xmin']), int(row['ymin']), int(row['xmax']), int(row['ymax']))
                    plate_text = extract_license_plate(frame, bbox)
                    if plate_text:
                        plate_numbers.append(plate_text)
            
            # For this example, location and time are hard-coded; in a real system, use metadata.
            location = "Intersection XYZ"
            time_of_incident = "2025-03-15 14:30:00"
            status_code = send_alert(location, time_of_incident, plate_numbers)
            print("Alert sent, status code:", status_code)
        
        cv2.imshow("Accident Detection", frame)
        if cv2.waitKey(1) == ord('q'):
            break
    cv2.destroyAllWindows()
