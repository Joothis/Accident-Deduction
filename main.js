// Global variables
let socket;
let cameras = {};
let currentAlerts = [];
let selectedAlertId = null;
let detectionEnabled = true;

// DOM Elements
const cameraGrid = document.getElementById('camera-grid');
const alertContainer = document.getElementById('alert-container');
const detailsContainer = document.getElementById('details-container');
const cameraModal = document.getElementById('camera-modal');
const expandedCamera = document.getElementById('expanded-camera');
const modalCameraTitle = document.getElementById('modal-camera-title');
const notificationToast = document.getElementById('notification-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const licensePlateText = document.getElementById('license-plate-text');
const accidentProbability = document.getElementById('accident-probability');
const vehicleType = document.getElementById('vehicle-type');
const incidentsToday = document.getElementById('incidents-today');
const systemUptime = document.getElementById('system-uptime');
const detectionStatus = document.getElementById('detection-status');
const activeCameras = document.getElementById('active-cameras');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeSocket();
    setupEventListeners();
    updateSystemUptime();
});

// Initialize WebSocket connection
function initializeSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
        requestCameraAccess();
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateCameraStatus(false);
    });

    socket.on('accident_alert', (data) => {
        handleAccidentAlert(data);
    });

    socket.on('license_plate_detected', (data) => {
        updateLicensePlateInfo(data);
    });

    socket.on('detection_result', (data) => {
        updateDetectionResult(data);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Expand camera buttons
    document.querySelectorAll('.btn-expand').forEach((button, index) => {
        button.addEventListener('click', () => {
            openCameraModal(index + 1);
        });
    });

    // Close modal button
    document.querySelector('.close-modal').addEventListener('click', () => {
        closeCameraModal();
    });

    // Emergency call button
    document.getElementById('call-emergency').addEventListener('click', () => {
        simulateEmergencyCall();
    });

    // Notify authorities button
    document.getElementById('notify-authorities').addEventListener('click', () => {
        simulateNotifyAuthorities();
    });

    // Generate report button
    document.getElementById('generate-report').addEventListener('click', () => {
        simulateGenerateReport();
    });

    // Clear alerts button
    document.getElementById('clear-alerts').addEventListener('click', () => {
        clearAllAlerts();
    });

    // Capture snapshot button
    document.getElementById('capture-snapshot').addEventListener('click', () => {
        captureSnapshot();
    });

    // Toggle detection button
    document.getElementById('toggle-detection').addEventListener('click', () => {
        toggleDetection();
    });

    // Toast close button
    document.querySelector('.toast-close').addEventListener('click', () => {
        hideNotification();
    });

    // Layout selector
    document.getElementById('layout-selector').addEventListener('change', (e) => {
        changeLayout(e.target.value);
    });

    // Refresh feeds button
    document.getElementById('refresh-feeds').addEventListener('click', () => {
        refreshCameraFeeds();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === cameraModal) {
            closeCameraModal();
        }
    });
}

// Request access to device cameras
function requestCameraAccess() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Error', 'Camera access is not supported in this browser');
        return;
    }

    // For demo purposes, we'll simulate 4 camera feeds
    simulateCameraFeeds();
}

// Simulate camera feeds (for demo)
function simulateCameraFeeds() {
    // In a real application, you would use actual camera feeds
    // For this demo, we'll use a simulated video feed
    
    // Update camera status
    updateCameraStatus(true);
    
    // Simulate camera feeds with canvas animations
    for (let i = 1; i <= 4; i++) {
        const videoElement = document.getElementById(`camera${i}`);
        simulateVideoFeed(videoElement, i);
    }
}

// Simulate a video feed using canvas
function simulateVideoFeed(videoElement, cameraId) {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    
    // Create a captureStream from the canvas
    const stream = canvas.captureStream(30); // 30 FPS
    videoElement.srcObject = stream;
    
    // Store the camera info
    cameras[cameraId] = {
        element: videoElement,
        canvas: canvas,
        ctx: ctx,
        stream: stream,
        active: true,
        lastFrame: Date.now()
    };
    
    // Start the animation loop
    animateCamera(cameraId);
}

// Animate the camera feed
function animateCamera(cameraId) {
    const camera = cameras[cameraId];
    if (!camera || !camera.active) return;
    
    const ctx = camera.ctx;
    const canvas = camera.canvas;
    const now = Date.now();
    const elapsed = now - camera.lastFrame;
    camera.lastFrame = now;
    
    // Clear the canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some simulated traffic
    drawSimulatedTraffic(ctx, canvas.width, canvas.height, cameraId, elapsed);
    
    // Occasionally simulate an accident (very rare)
    if (Math.random() < 0.0001 && detectionEnabled) {
        simulateAccident(cameraId);
    }
    
    // Continue the animation
    requestAnimationFrame(() => animateCamera(cameraId));
}

// Draw simulated traffic on the canvas
function drawSimulatedTraffic(ctx, width, height, cameraId, elapsed) {
    // If this camera doesn't have vehicles yet, initialize them
    if (!cameras[cameraId].vehicles) {
        cameras[cameraId].vehicles = [];
        // Add some random vehicles
        const vehicleCount = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < vehicleCount; i++) {
            cameras[cameraId].vehicles.push({
                x: Math.random() * width,
                y: 100 + Math.random() * (height - 200),
                width: 40 + Math.random() * 30,
                height: 20 + Math.random() * 15,
                speed: 0.05 + Math.random() * 0.1,
                color: getRandomCarColor()
            });
        }
    }
    
    // Draw a road
    ctx.fillStyle = '#555';
    ctx.fillRect(0, height/2 - 50, width, 100);
    
    // Draw lane markings
    ctx.strokeStyle = '#FFF';
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw vehicles
    cameras[cameraId].vehicles.forEach(vehicle => {
        // Move the vehicle
        vehicle.x += vehicle.speed * elapsed;
        if (vehicle.x > width) {
            vehicle.x = -vehicle.width;
            vehicle.y = 100 + Math.random() * (height - 200);
        }
        
        // Draw the vehicle
        ctx.fillStyle = vehicle.color;
        ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height);
        
        // Draw windows
        ctx.fillStyle = '#AADDFF';
        ctx.fillRect(vehicle.x + vehicle.width * 0.7, vehicle.y + 2, vehicle.width * 0.2, vehicle.height * 0.5);
    });
    
    // Add date/time overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 180, 25);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    const dateTime = new Date().toLocaleString();
    ctx.fillText(`Camera ${cameraId} - ${dateTime}`, 15, 25);
}

// Get a random car color
function getRandomCarColor() {
    const colors = ['#FF0000', '#0000FF', '#FFFF00', '#00FF00', '#FFFFFF', '#000000', '#AAAAAA', '#555555'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Simulate an accident
function simulateAccident(cameraId) {
    const camera = cameras[cameraId];
    if (!camera || camera.vehicles.length < 2) return;
    
    // Find two vehicles that are close to each other
    let vehicle1, vehicle2;
    for (let i = 0; i < camera.vehicles.length; i++) {
        for (let j = i + 1; j < camera.vehicles.length; j++) {
            const v1 = camera.vehicles[i];
            const v2 = camera.vehicles[j];
            const distance = Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
            if (distance < 100) {
                vehicle1 = v1;
                vehicle2 = v2;
                break;
            }
        }
        if (vehicle1 && vehicle2) break;
    }
    
    if (!vehicle1 || !vehicle2) return;
    
    // Create an accident alert
    const alertData = {
        id: Date.now(),
        cameraId: cameraId,
        location: getCameraLocation(cameraId),
        timestamp: new Date().toISOString(),
        severity: getRandomSeverity(),
        licensePlate: generateRandomLicensePlate(),
        vehicleType: getRandomVehicleType(),
        probability: 75 + Math.floor(Math.random() * 25)
    };
    
    // Send the alert
    handleAccidentAlert(alertData);
    
    // Draw the accident
    const ctx = camera.ctx;
    const x = (vehicle1.x + vehicle2.x) / 2;
    const y = (vehicle1.y + vehicle2.y) / 2;
    
    // Draw explosion effect
    ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw detection box
    const detectionBox = camera.element.parentElement.querySelector('.detection-box');
    if (detectionBox) {
        const rect = camera.element.getBoundingClientRect();
        const canvasRect = {
            x: 0,
            y: 0,
            width: camera.canvas.width,
            height: camera.canvas.height
        };
        
        // Convert canvas coordinates to video element coordinates
        const boxX = (x - 50) / canvasRect.width * rect.width;
        const boxY = (y - 50) / canvasRect.height * rect.height;
        const boxWidth = 100 / canvasRect.width * rect.width;
        const boxHeight = 100 / canvasRect.height * rect.height;
        
        detectionBox.style.left = `${boxX}px`;
        detectionBox.style.top = `${boxY}px`;
        detectionBox.style.width = `${boxWidth}px`;
        detectionBox.style.height = `${boxHeight}px`;
        detectionBox.style.display = 'block';
        
        // Hide the detection box after a few seconds
        setTimeout(() => {
            detectionBox.style.display = 'none';
        }, 5000);
    }
}

// Get camera location
function getCameraLocation(cameraId) {
    const locations = [
        'Highway 101, Mile 42',
        'Main St & 5th Ave',
        'Highway 280, Mile 15',
        'Bay Bridge, East Span'
    ];
    return locations[cameraId - 1] || 'Unknown Location';
}

// Get random severity
function getRandomSeverity() {
    const severities = ['high', 'medium', 'low'];
    const weights = [0.2, 0.5, 0.3]; // 20% high, 50% medium, 30% low
    
    const random = Math.random();
    let sum = 0;
    for (let i = 0; i < severities.length; i++) {
        sum += weights[i];
        if (random < sum) {
            return severities[i];
        }
    }
    return severities[0];
}

// Generate random license plate
function generateRandomLicensePlate() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let plate = '';
    
    // Format: 3 letters + 3 numbers or 3 numbers + 3 letters
    if (Math.random() < 0.5) {
        // 3 letters + 3 numbers
        for (let i = 0; i < 3; i++) {
            plate += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 3; i++) {
            plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
    } else {
        // 3 numbers + 3 letters
        for (let i = 0; i < 3; i++) {
            plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        for (let i = 0; i < 3; i++) {
            plate += letters.charAt(Math.floor(Math.random() * letters.length));
        }
    }
    
    return plate;
}

// Get random vehicle type
function getRandomVehicleType() {
    const types = ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bus'];
    return types[Math.floor(Math.random() * types.length)];
}

// Handle accident alert
function handleAccidentAlert(data) {
    // Add to current alerts
    currentAlerts.push(data);
    
    // Update incidents count
    incidentsToday.textContent = currentAlerts.length;
    
    // Create alert element
    const alertElement = createAlertElement(data);
    
    // Remove "no alerts" message if it exists
    const noAlertsMessage = alertContainer.querySelector('.no-alerts-message');
    if (noAlertsMessage) {
        alertContainer.removeChild(noAlertsMessage);
    }
    
    // Add to container
    alertContainer.prepend(alertElement);
    
    // Show notification
    showNotification('Accident Detected', `Vehicle collision detected on Camera ${data.cameraId} - ${data.location}`);
}

// Create alert element
function createAlertElement(data) {
    const alertElement = document.createElement('div');
    alertElement.className = 'alert-item';
    alertElement.dataset.id = data.id;
    
    const severityClass = data.severity === 'high' ? '' : ` ${data.severity}`;
    
    alertElement.innerHTML = `
        <div class="alert-header">
            <span class="alert-title">Accident Detected</span>
            <span class="alert-time">${formatTimestamp(data.timestamp)}</span>
        </div>
        <div class="alert-location">
            <i class="fas fa-map-marker-alt"></i> ${data.location}
        </div>
        <span class="alert-severity${severityClass}">${data.severity.toUpperCase()}</span>
    `;
    
    // Add click event to show details
    alertElement.addEventListener('click', () => {
        showAlertDetails(data);
    });
    
    return alertElement;
}

// Show alert details
function showAlertDetails(data) {
    // Update selected alert
    selectedAlertId = data.id;
    
    // Update selected class
    document.querySelectorAll('.alert-item').forEach(item => {
        if (item.dataset.id === String(data.id)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // Remove "no details" message
    const noDetailsMessage = detailsContainer.querySelector('.no-details-message');
    if (noDetailsMessage) {
        detailsContainer.removeChild(noDetailsMessage);
    }
    
    // Create or update details content
    let detailsContent = detailsContainer.querySelector('.details-content');
    if (!detailsContent) {
        detailsContent = document.createElement('div');
        detailsContent.className = 'details-content';
        detailsContainer.appendChild(detailsContent);
    }
    
    // Update details content
    detailsContent.innerHTML = `
        <div class="details-header">
            <h3 class="details-title">Accident Details</h3>
            <p class="details-time">${formatTimestamp(data.timestamp)}</p>
        </div>
        <div class="details-info">
            <div class="info-item">
                <p class="info-label">Camera</p>
                <p class="info-value">Camera ${data.cameraId}</p>
            </div>
            <div class="info-item">
                <p class="info-label">Location</p>
                <p class="info-value">${data.location}</p>
            </div>
            <div class="info-item">
                <p class="info-label">Severity</p>
                <p class="info-value">${data.severity.toUpperCase()}</p>
            </div>
            <div class="info-item">
                <p class="info-label">License Plate</p>
                <p class="info-value">${data.licensePlate}</p>
            </div>
            <div class="info-item">
                <p class="info-label">Vehicle Type</p>
                <p class="info-value">${data.vehicleType}</p>
            </div>
            <div class="info-item">
                <p class="info-label">Probability</p>
                <p class="info-value">${data.probability}%</p>
            </div>
        </div>
        <div class="details-map">
            <i class="fas fa-map-marked-alt"></i> Map view not available in demo
        </div>
        <div class="details-actions">
            <button>
                <i class="fas fa-camera"></i> View Snapshot
            </button>
            <button>
                <i class="fas fa-share-alt"></i> Share
            </button>
            <button>
                <i class="fas fa-file-export"></i> Export
            </button>
        </div>
    `;
    
    // Show the details
    detailsContent.style.display = 'block';
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Show notification
function showNotification(title, message) {
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    notificationToast.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Hide notification
function hideNotification() {
    notificationToast.classList.remove('show');
}

// Open camera modal
function openCameraModal(cameraId) {
    modalCameraTitle.textContent = `Camera ${cameraId} - ${getCameraLocation(cameraId)}`;
    
    // Clone the video stream to the modal
    if (cameras[cameraId] && cameras[cameraId].stream) {
        expandedCamera.srcObject = cameras[cameraId].stream;
    }
    
    // Show the modal
    cameraModal.style.display = 'block';
    
    // Reset detection info
    licensePlateText.textContent = 'N/A';
    accidentProbability.style.width = '0%';
    accidentProbability.textContent = '0%';
    vehicleType.textContent = 'N/A';
    
    // Simulate detection after a delay
    setTimeout(() => {
        if (detectionEnabled) {
            simulateDetection(cameraId);
        }
    }, 2000);
}

// Close camera modal
function closeCameraModal() {
    cameraModal.style.display = 'none';
    expandedCamera.srcObject = null;
}

// Simulate detection in the modal
function simulateDetection(cameraId) {
    // Generate random license plate
    const plate = generateRandomLicensePlate();
    licensePlateText.textContent = plate;
    
    // Generate random vehicle type
    const type = getRandomVehicleType();
    vehicleType.textContent = type;
    
    // Generate random probability
    const prob = Math.floor(Math.random() * 30) + 10; // 10-40%
    accidentProbability.style.width = `${prob}%`;
    accidentProbability.textContent = `${prob}%`;
    
    // Show detection box occasionally
    if (Math.random() < 0.3) {
        const detectionBox = expandedCamera.parentElement.querySelector('.detection-box');
        if (detectionBox) {
            const rect = expandedCamera.getBoundingClientRect();
            const x = Math.random() * (rect.width - 100);
            const y = Math.random() * (rect.height - 100);
            
            detectionBox.style.left = `${x}px`;
            detectionBox.style.top = `${y}px`;
            detectionBox.style.width = '100px';
            detectionBox.style.height = '100px';
            detectionBox.style.display = 'block';
            
            // Hide after a few seconds
            setTimeout(() => {
                detectionBox.style.display = 'none';
            }, 3000);
        }
    }
}

// Simulate emergency call
function simulateEmergencyCall() {
    showNotification('Emergency Call', 'Simulating emergency call to services...');
    
    // In a real application, this would make an actual call or API request
    setTimeout(() => {
        showNotification('Call Connected', 'Emergency services have been notified.');
    }, 2000);
}

// Simulate notify authorities
function simulateNotifyAuthorities() {
    showNotification('Notification Sent', 'Traffic authorities have been notified.');
}

// Simulate generate report
function simulateGenerateReport() {
    showNotification('Report Generated', 'Incident report has been generated and saved.');
}

// Clear all alerts
function clearAllAlerts() {
    // Clear alerts array
    currentAlerts = [];
    
    // Update incidents count
    incidentsToday.textContent = '0';
    
    // Clear alert container
    alertContainer.innerHTML = `
        <div class="no-alerts-message">
            <i class="fas fa-check-circle"></i>
            <p>No accidents detected</p>
        </div>
    `;
    
    // Clear details container
    detailsContainer.innerHTML = `
        <div class="no-details-message">
            <i class="fas fa-clipboard"></i>
            <p>Select an incident to view details</p>
        </div>
    `;
}

// Capture snapshot
function captureSnapshot() {
    showNotification('Snapshot Captured', 'Image has been saved to the gallery.');
}

// Toggle detection
function toggleDetection() {
    detectionEnabled = !detectionEnabled;
    
    // Update button text
    const toggleButton = document.getElementById('toggle-detection');
    toggleButton.innerHTML = detectionEnabled ? 
        '<i class="fas fa-eye"></i> Toggle Detection' : 
        '<i class="fas fa-eye-slash"></i> Toggle Detection';
    
    // Update detection status
    detectionStatus.textContent = detectionEnabled ? 'Active' : 'Paused';
    detectionStatus.className = detectionEnabled ? 'status-active' : '';
    
    showNotification('Detection ' + (detectionEnabled ? 'Enabled' : 'Disabled'), 
        'Accident detection has been ' + (detectionEnabled ? 'enabled' : 'disabled'));
}

// Update camera status
function updateCameraStatus(active) {
    // Update active cameras count
    const totalCameras = 4;
    const activeCameraCount = active ? totalCameras : 0;
    activeCameras.textContent = `${activeCameraCount}/${totalCameras}`;
    
    // Update camera status indicators
    document.querySelectorAll('.camera-status i').forEach(icon => {
        icon.style.color = active ? 'var(--accent-color)' : 'var(--gray-color)';
    });
}

// Update system uptime
function updateSystemUptime() {
    // In a real application, this would get the actual system uptime
    // For demo, we'll just increment a counter
    let hours = 0;
    let minutes = 0;
    
    setInterval(() => {
        minutes++;
        if (minutes >= 60) {
            hours++;
            minutes = 0;
        }
        
        systemUptime.textContent = `${hours}h ${minutes}m`;
    }, 60000); // Update every minute
}

// Change layout
function changeLayout(layout) {
    if (layout === 'grid') {
        cameraGrid.className = 'camera-grid';
    } else if (layout === 'single') {
        cameraGrid.className = 'camera-grid single-view';
    }
}

// Refresh camera feeds
function refreshCameraFeeds() {
    showNotification('Refreshing', 'Refreshing camera feeds...');
    
    // Simulate a refresh by briefly showing loading state
    document.querySelectorAll('.camera-feed').forEach(feed => {
        feed.style.opacity = '0.5';
    });
    
    setTimeout(() => {
        document.querySelectorAll('.camera-feed').forEach(feed => {
            feed.style.opacity = '1';
        });
        showNotification('Refreshed', 'Camera feeds have been refreshed');
    }, 1500);
}

// Update license plate info
function updateLicensePlateInfo(data) {
    if (cameraModal.style.display === 'block') {
        licensePlateText.textContent = data.licensePlate;
        vehicleType.textContent = data.vehicleType;
    }
}

// Update detection result
function updateDetectionResult(data) {
    if (cameraModal.style.display === 'block') {
        accidentProbability.style.width = `${data.probability}%`;
        accidentProbability.textContent = `${data.probability}%`;
    }
}