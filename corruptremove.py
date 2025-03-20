import os

train_images_path = r"C:\Users\jooth\Desktop\Projects\Accident Deduction\Dataset\train\images"
missing_files = [
    "Young_woman_is_cycling_over_the_bike_path_..."
]

for file in missing_files:
    file_path = os.path.join(train_images_path, file)
    if os.path.exists(file_path):
        os.remove(file_path)