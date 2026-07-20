import os
import pandas as pd

def clean_and_sample_data():
    # Resolve paths relative to project root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    raw_data_path = os.path.join(project_root, "datasets", "dft_traffic_counts_raw_counts", "dft_traffic_counts_raw_counts.csv")
    output_dir = os.path.join(project_root, "ai_models", "data")
    output_path = os.path.join(output_dir, "cleaned_traffic.csv")

    print(f"Reading raw data from: {raw_data_path} ...")
    if not os.path.exists(raw_data_path):
        raise FileNotFoundError(f"Raw data file not found at {raw_data_path}")

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Columns of interest
    cols = [
        "count_point_id",
        "direction_of_travel",
        "year",
        "count_date",
        "hour",
        "region_id",
        "region_name",
        "local_authority_id",
        "local_authority_name",
        "road_name",
        "road_type",
        "latitude",
        "longitude",
        "link_length_km",
        "pedal_cycles",
        "two_wheeled_motor_vehicles",
        "cars_and_taxis",
        "buses_and_coaches",
        "lgvs",
        "all_hgvs",
        "all_motor_vehicles"
    ]

    # Read data in chunks to optimize memory usage, or read it directly if memory allows
    # Since we want a random sample, we can read chunks, sample each, and concatenate
    chunk_size = 100000
    samples_per_chunk = 5000
    sampled_dfs = []

    print("Processing file in chunks and sampling...")
    for chunk in pd.read_csv(raw_data_path, usecols=cols, chunksize=chunk_size, low_memory=False):
        # Drop rows with null values in key columns
        clean_chunk = chunk.dropna(subset=["all_motor_vehicles", "latitude", "longitude", "road_name", "count_date", "hour"])
        
        # Sample from chunk if it has enough rows
        if len(clean_chunk) > 0:
            sample_size = min(len(clean_chunk), samples_per_chunk)
            sampled_dfs.append(clean_chunk.sample(n=sample_size, random_state=42))

    # Concatenate all sampled chunks
    df = pd.concat(sampled_dfs, ignore_index=True)
    
    # Final random shuffle and size limit
    df = df.sample(n=min(len(df), 200000), random_state=42).reset_index(drop=True)

    print(f"Finished cleaning and sampling. Final shape: {df.shape}")
    print(f"Saving cleaned dataset to: {output_path}")
    df.to_csv(output_path, index=False)
    print("Data cleaning completed successfully!")

if __name__ == "__main__":
    clean_and_sample_data()
