import cv2
import video_feed
import object_detector
import lpr_alert
import collision_detection
import datetime

# Set the video source (use 0 for webcam or a video file path)
video_source = "path_to_video.mp4"  # Replace with 0 for webcam or your video file

def main():
    """
    Main function to process the video feed for accident detection, extract license plates,
    and send alerts in case of an accident.
    """
    for frame in video_feed.get_video_frames(video_source):
        # Perform object detection
        detections = object_detector.detect_objects(frame)

        # Check for collision based on detected objects
        if detections and collision_detection.check_collision(detections):
            print("⚠️ Accident Detected! Processing License Plates...")
            plate_numbers = []

            # Extract license plates from detected vehicles
            for detection in detections:
                if "license" in detection['class'].lower():  # Adjust class name based on your YOLO model
                    bbox = detection['bbox']
                    plate_text = lpr_alert.extract_license_plate(frame, bbox)
                    if plate_text:
                        plate_numbers.append(plate_text)

            # Prepare accident details
            location = "Intersection XYZ"  # Replace with GPS data if available
            time_of_incident = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Send alert with accident details
            status_code = lpr_alert.send_alert(location, time_of_incident, plate_numbers)
            print(f"🚨 Alert Sent! Status Code: {status_code}")

        # Display the processed video
        cv2.imshow("Real-Time Accident Detection", frame)

        # Press 'q' to quit the application
        if cv2.waitKey(1) == ord('q'):
            break

    # Cleanup OpenCV windows
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
