# video_feed.py
import cv2

def get_video_frames(source=0):
    """
    Capture video frames from a given source.
    Use 0 for webcam or provide a video file path.
    """
    cap = cv2.VideoCapture(source)
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        yield frame
    cap.release()

if __name__ == '__main__':
    for frame in get_video_frames(r"C:\Users\klshk\OneDrive\Desktop\videoplayback (online-video-cutter.com).mp4"):
        cv2.imshow("Frame", frame)
        if cv2.waitKey(1) == ord('q'):
            break
    cv2.destroyAllWindows()
