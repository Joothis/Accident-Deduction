from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
import threading
import time
import random
import string
import os
import base64
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'accident_detection_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables
connected_clients = 0
accident_detection_enabled = True
system_start_time = time.time()
incidents_today = 0

# Mock database for storing incidents
incidents_db = []

# Pretend we have a model loaded
class MockAccidentDetectionModel:
    def __init__(self):
        logger.info("Loading accident detection model...")
        time.sleep(1)  # Simulate loading time
        logger.info("Accident detection model loaded successfully")
        
    def detect(self, frame):
        # In a real application, this would run inference on the model
        # For demo purposes, we'll return random results occasionally
        if random.random() < 0.01 and accident_detection_enabled:  # 1% chance of detection
            confidence = random.uniform(0.7, 0.95)
            box = [
                random.randint(0, frame.shape[1] - 100),  # x
                random.randint(0, frame.shape[0] - 100),  # y
                random.randint(100, 200),  # width
                random.randint(100, 200)   # height
            ]
            return True, confidence, box
        return False, 0.0, None

# Mock OCR model for license plate detection
class MockLicensePlateOCR:
    def __init__(self):
        logger.info("Loading license plate OCR model...")
        time.sleep(1)  # Simulate loading time
        logger.info("License plate OCR model loaded successfully")
    
    def detect_and_read(self, frame):
        # In a real application, this would detect and read license plates
        # For demo purposes, we'll generate random plates occasionally
        if random.random() < 0.05:  # 5% chance of detection
            # Generate random license plate
            letters = ''.join(random.choices(string.ascii_uppercase, k=3))
            numbers = ''.join(random.choices(string.digits, k=3))
            if random.random() < 0.5:
                plate = f"{letters}{numbers}"
            else:
                plate = f"{numbers}{letters}"
                
            confidence = random.uniform(0.75, 0.98)
            box = [
                random.randint(0, frame.shape[1] - 100),
                random.randint(0, frame.shape[0] - 100),
                random.randint(100, 200),
                random.randint(50, 100)
            ]
            return True, plate, confidence, box
        return False, "", 0.0, None

# Load models
accident_model = MockAccidentDetectionModel()
license_plate_model = MockLicensePlateOCR()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    global connected_clients
    connected_clients += 1
    logger.info(f"Client connected. Total clients: {connected_clients}")
    
    # Send system status
    emit('system_status', {
        'uptime': get_system_uptime(),
        'incidents_today': incidents_today,
        'detection_enabled': accident_detection_enabled
    })

@socketio.on('disconnect')
def handle_disconnect():
    global connected_clients
    connected_clients -= 1
    logger.info(f"Client disconnected. Total clients: {connected_clients}")

@socketio.on('start_camera')
def handle_start_camera(data):
    camera_id = data.get('camera_id', 1)
    logger.info(f"Starting camera {camera_id}")
    
    # In a real application, this would start the camera feed
    # For demo purposes, we'll acknowledge the request
    emit('camera_started', {'camera_id': camera_id, 'status': 'success'})

@socketio.on('stop_camera')
def handle_stop_camera(data):
    camera_id = data.get('camera_id', 1)
    logger.info(f"Stopping camera {camera_id}")
    
    # In a real application, this would stop the camera feed
    # For demo purposes, we'll acknowledge the request
    emit('camera_stopped', {'camera_id': camera_id, 'status': 'success'})

@socketio.on('toggle_detection')
def handle_toggle_detection():
    global accident_detection_enabled
    accident_detection_enabled = not accident_detection_enabled
    logger.info(f"Accident detection {'enabled' if accident_detection_enabled else 'disabled'}")
    
    emit('detection_status', {'enabled': accident_detection_enabled})

@socketio.on('process_frame')
def handle_process_frame(data):
    camera_id = data.get('camera_id', 1)
    frame_data = data.get('frame', '')
    
    # In a real application, this would process the frame
    # For demo purposes, we'll simulate processing
    if frame_data:
        try:
            # Decode base64 image
            frame_bytes = base64.b64decode(frame_data.split(',')[1])
            frame_arr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(frame_arr, cv2.IMREAD_COLOR)
            
            # Process with accident detection model
            if accident_detection_enabled:
                accident_detected, accident_confidence, accident_box = accident_model.detect(frame)
                
                if accident_detected:
                    handle_accident_detection(camera_id, accident_confidence, accident_box, frame)
            
            # Process with license plate OCR
            plate_detected, plate_text, plate_confidence, plate_box = license_plate_model.detect_and_read(frame)
            
            if plate_detected:
                emit('license_plate_detected', {
                    'camera_id': camera_id,
                    'licensePlate': plate_text,
                    'confidence': float(plate_confidence),
                    'vehicleType': random.choice(['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle'])
                })
                
        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
    
    # Acknowledge frame processing
    emit('frame_processed', {'camera_id': camera_id})

def handle_accident_detection(camera_id, confidence, box, frame):
    global incidents_today
    
    # Increment incidents counter
    incidents_today += 1
    
    # Generate incident ID
    incident_id = int(time.time() * 1000)
    
    # Get location based on camera ID
    locations = [
        'Highway 101, Mile 42',
        'Main St & 5th Ave',
        'Highway 280, Mile 15',
        'Bay Bridge, East Span'
    ]
    location = locations[camera_id - 1] if camera_id <= len(locations) else 'Unknown Location'
    
    # Generate random severity
    severity_options = ['high', 'medium', 'low']
    severity_weights = [0.2, 0.5, 0.3]  # 20% high, 50% medium, 30% low
    severity = random.choices(severity_options, severity_weights)[0]
    
    # Generate random license plate
    letters = ''.join(random.choices(string.ascii_uppercase, k=3))
    numbers = ''.join(random.choices(string.digits, k=3))
    license_plate = f"{letters}{numbers}" if random.random() < 0.5 else f"{numbers}{letters}"
    
    # Generate random vehicle type
    vehicle_types = ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bus']
    vehicle_type = random.choice(vehicle_types)
    
    # Create incident data
    incident_data = {
        'id': incident_id,
        'cameraId': camera_id,
        'location': location,
        'timestamp': datetime.now().isoformat(),
        'severity': severity,
        'licensePlate': license_plate,
        'vehicleType': vehicle_type,
        'probability': int(confidence * 100)
    }
    
    # Save to database
    incidents_db.append(incident_data)
    
    # Save frame as image (in a real application)
    # cv2.imwrite(f"static/incidents/{incident_id}.jpg", frame)
    
    # Emit accident alert
    socketio.emit('accident_alert', incident_data)
    
    logger.info(f"Accident detected on camera {camera_id} with {confidence:.2f} confidence")

@socketio.on('get_incidents')
def handle_get_incidents():
    emit('incidents', {'incidents': incidents_db})

@socketio.on('clear_incidents')
def handle_clear_incidents():
    global incidents_db, incidents_today
    incidents_db = []
    incidents_today = 0
    emit('incidents_cleared')

def get_system_uptime():
    uptime_seconds = time.time() - system_start_time
    hours = int(uptime_seconds // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    return f"{hours}h {minutes}m"

# Background task to simulate real-time processing
def background_processing():
    while True:
        # Simulate occasional accident detection
        if connected_clients > 0 and accident_detection_enabled:
            if random.random() < 0.01:  # 1% chance every 5 seconds
                camera_id = random.randint(1, 4)
                
                # Create a dummy frame for processing
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                
                # Simulate accident detection
                confidence = random.uniform(0.7, 0.95)
                box = [
                    random.randint(0, frame.shape[1] - 100),
                    random.randint(0, frame.shape[0] - 100),
                    random.randint(100, 200),
                    random.randint(100, 200)
                ]
                
                handle_accident_detection(camera_id, confidence, box, frame)
        
        time.sleep(5)

if __name__ == '__main__':
    # Create directory for incident images if it doesn't exist
    os.makedirs('static/incidents', exist_ok=True)
    
    # Start background processing thread
    processing_thread = threading.Thread(target=background_processing, daemon=True)
    processing_thread.start()
    
    # Start the Flask app
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)