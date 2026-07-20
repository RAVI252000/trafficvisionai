import os
import json
import pandas as pd
import numpy as np

def run_feature_engineering():
    # Resolve paths relative to project root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    clean_data_path = os.path.join(project_root, "ai_models", "data", "cleaned_traffic.csv")
    output_dir = os.path.join(project_root, "ai_models", "data")
    saved_models_dir = os.path.join(project_root, "ai_models", "saved_models")
    
    os.makedirs(saved_models_dir, exist_ok=True)

    print(f"Reading cleaned data from: {clean_data_path} ...")
    if not os.path.exists(clean_data_path):
        raise FileNotFoundError(f"Cleaned data file not found at {clean_data_path}")

    df = pd.read_csv(clean_data_path)

    # 1. Parse dates and extract time-based features
    print("Extracting time-based features...")
    df['count_date'] = pd.to_datetime(df['count_date'])
    df['day_of_week'] = df['count_date'].dt.dayofweek
    df['month'] = df['count_date'].dt.month
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

    # 2. Encode categorical variables
    print("Encoding categorical columns...")
    # Road type mapping (Major: 1, Minor: 0)
    road_type_map = {"Major": 1, "Minor": 0}
    df['road_type_code'] = df['road_type'].map(road_type_map).fillna(0).astype(int)

    # Direction mapping
    direction_map = {
        "N": 0, "S": 1, "E": 2, "W": 3,
        "NE": 4, "NW": 5, "SE": 6, "SW": 7, "C": 8
    }
    df['direction_code'] = df['direction_of_travel'].map(direction_map).fillna(-1).astype(int)

    # 3. Calculate road metadata & capacity
    # Group by road name and calculate average lat, lng, capacity, road type code
    print("Calculating road capacities and coordinates...")
    # Capacity = 95th percentile of all_motor_vehicles on that road (min capacity of 100 to avoid divide-by-zero or low caps)
    road_groups = df.groupby('road_name')
    
    road_metadata = {}
    for name, group in road_groups:
        # Calculate 95th percentile traffic volume as road capacity proxy
        capacity = float(np.percentile(group['all_motor_vehicles'], 95))
        capacity = max(capacity, 100.0) # threshold minimum capacity

        avg_lat = float(group['latitude'].mean())
        avg_lng = float(group['longitude'].mean())
        road_type = str(group['road_type'].iloc[0])
        road_type_code = int(group['road_type_code'].iloc[0])
        region = str(group['region_name'].iloc[0])

        road_metadata[name] = {
            "latitude": avg_lat,
            "longitude": avg_lng,
            "road_type": road_type,
            "road_type_code": road_type_code,
            "capacity": capacity,
            "region": region
        }

    # Save road metadata map
    metadata_path = os.path.join(saved_models_dir, "road_metadata.json")
    print(f"Saving road metadata (capacities & coordinates) to: {metadata_path}")
    with open(metadata_path, 'w') as f:
        json.dump(road_metadata, f, indent=4)

    # Save processed dataframe for training
    processed_path = os.path.join(output_dir, "processed_traffic.csv")
    print(f"Saving processed dataframe to: {processed_path}")
    df.to_csv(processed_path, index=False)
    print("Feature engineering completed successfully!")

if __name__ == "__main__":
    run_feature_engineering()
