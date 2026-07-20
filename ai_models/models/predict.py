import os
import json
import joblib
import pandas as pd
from datetime import datetime

class TrafficPredictor:
    def __init__(self):
        self.project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.model_path = os.path.join(self.project_root, "ai_models", "saved_models", "traffic_model.joblib")
        self.metadata_path = os.path.join(self.project_root, "ai_models", "saved_models", "road_metadata.json")
        
        self.model = None
        self.road_metadata = {}
        self.load_artifacts()

    def load_artifacts(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            # print("Successfully loaded traffic model.")
        else:
            print(f"Warning: Model not found at {self.model_path}. Please train the model first.")

        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, 'r') as f:
                self.road_metadata = json.load(f)
            # print("Successfully loaded road metadata.")
        else:
            print(f"Warning: Road metadata not found at {self.metadata_path}.")

    def predict_traffic(self, road_name: str, hour: int, day_of_week: int, month: int, direction: str = "E"):
        if self.model is None:
            raise RuntimeError("Model is not loaded. Train the model first.")

        # Default fallback values for unknown roads
        latitude = 51.5074  # London default
        longitude = -0.1278
        road_type_code = 1  # Major default
        capacity = 1500.0   # Default capacity
        road_type = "Major"

        # Lookup road metadata if available
        if road_name in self.road_metadata:
            meta = self.road_metadata[road_name]
            latitude = meta["latitude"]
            longitude = meta["longitude"]
            road_type_code = meta["road_type_code"]
            road_type = meta["road_type"]
            capacity = meta["capacity"]

        is_weekend = 1 if day_of_week in [5, 6] else 0

        # Direction code mapping
        direction_map = {
            "N": 0, "S": 1, "E": 2, "W": 3,
            "NE": 4, "NW": 5, "SE": 6, "SW": 7, "C": 8
        }
        direction_code = direction_map.get(direction.upper(), 2)  # Default to E (2)

        # Create features dataframe matching the training features
        features_df = pd.DataFrame([{
            "hour": hour,
            "day_of_week": day_of_week,
            "month": month,
            "is_weekend": is_weekend,
            "latitude": latitude,
            "longitude": longitude,
            "road_type_code": road_type_code,
            "direction_code": direction_code
        }])

        # Predict total traffic flow volume
        pred_volume = float(self.model.predict(features_df)[0])
        pred_volume = max(0.0, pred_volume)  # Ensure non-negative

        # Calculate congestion percentage (0 - 100%)
        congestion_pct = min(100.0, (pred_volume / capacity) * 100.0)

        # Map to Congestion Status (CLEAR, MODERATE, HEAVY, BLOCKED)
        if congestion_pct < 30.0:
            status = "CLEAR"
        elif congestion_pct < 60.0:
            status = "MODERATE"
        elif congestion_pct < 85.0:
            status = "HEAVY"
        else:
            status = "BLOCKED"

        # Estimate average speed (km/h) based on road type free-flow speed and congestion level
        free_flow_speed = 60.0 if road_type_code == 1 else 40.0
        # Average speed drops as congestion increases
        avg_speed = free_flow_speed * (1.0 - 0.75 * (congestion_pct / 100.0))
        avg_speed = max(5.0, round(avg_speed, 1))

        # Vehicle breakdown (Cars: 76%, LGVs: 13%, HGVs: 6%, Buses: 2%, Cycles: 3%)
        vehicle_count = int(round(pred_volume))
        cars = int(round(vehicle_count * 0.76))
        lgvs = int(round(vehicle_count * 0.13))
        hgvs = int(round(vehicle_count * 0.06))
        buses = int(round(vehicle_count * 0.02))
        cycles = max(0, vehicle_count - (cars + lgvs + hgvs + buses))

        return {
            "road_name": road_name,
            "road_type": road_type,
            "latitude": latitude,
            "longitude": longitude,
            "hour": hour,
            "predicted_volume": vehicle_count,
            "capacity": int(round(capacity)),
            "congestion_index": int(round(congestion_pct)),
            "congestion_status": status,
            "average_speed": avg_speed,
            "breakdown": {
                "cars_and_taxis": cars,
                "lgvs": lgvs,
                "all_hgvs": hgvs,
                "buses_and_coaches": buses,
                "pedal_cycles": cycles
            }
        }

if __name__ == "__main__":
    predictor = TrafficPredictor()
    if predictor.model is not None:
        # Run test prediction
        test_road = list(predictor.road_metadata.keys())[0] if predictor.road_metadata else "A3112"
        res = predictor.predict_traffic(road_name=test_road, hour=17, day_of_week=4, month=9, direction="E")
        print("\n--- SAMPLE PREDICTION TEST ---")
        print(json.dumps(res, indent=4))
        print("------------------------------\n")
    else:
        print("Test failed: Model not trained.")
