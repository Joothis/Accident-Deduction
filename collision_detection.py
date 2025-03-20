# collision_detection.py
import numpy as np
import pandas as pd

def check_collision(detections: pd.DataFrame, overlap_threshold: float = 0.1) -> bool:
    """
    Given a DataFrame of detections, check for overlapping bounding boxes.
    Each row in `detections` must contain 'xmin', 'ymin', 'xmax', 'ymax' columns.
    
    The function computes the overlap area between every pair of boxes.
    If the overlapping area is greater than `overlap_threshold` times the area of 
    the smaller box, a collision (or potential collision) is flagged.
    
    Parameters:
        detections (pd.DataFrame): DataFrame with bounding box coordinates.
        overlap_threshold (float): The ratio threshold to consider an overlap as a collision.
        
    Returns:
        bool: True if any two boxes overlap beyond the threshold, False otherwise.
    """
    # Extract bounding boxes from DataFrame
    boxes = detections[['xmin', 'ymin', 'xmax', 'ymax']].values
    num_boxes = len(boxes)
    
    # Compare each pair of boxes
    for i in range(num_boxes):
        for j in range(i + 1, num_boxes):
            box1, box2 = boxes[i], boxes[j]
            # Compute overlap dimensions
            x_overlap = max(0, min(box1[2], box2[2]) - max(box1[0], box2[0]))
            y_overlap = max(0, min(box1[3], box2[3]) - max(box1[1], box2[1]))
            area_overlap = x_overlap * y_overlap

            # Compute individual areas
            area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
            area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
            
            # Skip if any box has zero area
            if area1 == 0 or area2 == 0:
                continue

            # Calculate overlap ratio relative to the smaller box
            overlap_ratio = area_overlap / min(area1, area2)
            if overlap_ratio > overlap_threshold:
                return True  # Collision detected
    return False  # No collision found


# For testing the module directly
if __name__ == '__main__':
    # Create a sample DataFrame with dummy bounding box coordinates.
    # Each detection should have columns: 'xmin', 'ymin', 'xmax', 'ymax'
    data = {
        'xmin': [50, 200],
        'ymin': [50, 200],
        'xmax': [150, 300],
        'ymax': [150, 300]
    }
    detections_df = pd.DataFrame(data)
    collision = check_collision(detections_df, overlap_threshold=0.1)
    print("Collision Detected:", collision)
