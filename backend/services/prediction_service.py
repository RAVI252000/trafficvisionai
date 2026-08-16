import os
import json
import joblib
import pandas as pd
from datetime import datetime

class PredictionService:
    def __init__(self):
        # Resolve paths relative to the backend directory
        self.backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.project_root = os.path.dirname(self.backend_dir)
        
        self.model_path = os.path.join(self.project_root, "ai_models", "saved_models", "traffic_model.joblib")
        self.metadata_path = os.path.join(self.project_root, "ai_models", "saved_models", "road_metadata.json")
        
        self.model = None
        self.road_metadata = {}
        self.load_artifacts()

    def load_artifacts(self):
        from core.config import settings
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            print("Backend prediction service successfully loaded traffic model.")
        else:
            print(f"Backend Warning: Model not found at {self.model_path}")

        metadata_file = "road_metadata_bengaluru.json" if settings.USE_INDIAN_DATASET else "road_metadata.json"
        metadata_path = os.path.join(self.project_root, "ai_models", "saved_models", metadata_file)

        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                self.road_metadata = json.load(f)
            print(f"Backend prediction service successfully loaded {len(self.road_metadata)} roads metadata from {metadata_file}.")
        else:
            print(f"Backend Warning: Road metadata not found at {metadata_path}")

    def get_available_roads(self):
        # Reload dynamically if not loaded at startup (e.g. trained later)
        if not self.road_metadata or self.model is None:
            self.load_artifacts()
        # Return sorted list of road names
        return sorted(list(self.road_metadata.keys()))

    def predict_hourly_forecast(self, road_name: str, date_str: str):
        if self.model is None or not self.road_metadata:
            self.load_artifacts()
            
        if self.model is None:
            raise RuntimeError("ML Model not trained or loaded on the backend server.")

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

        # Parse date
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            dt = datetime.now()

        day_of_week = dt.weekday()
        month = dt.month
        is_weekend = 1 if day_of_week in [5, 6] else 0

        # Run prediction for all 24 hours
        forecast = []
        for hour in range(24):
            # Direction code mapping (E = 2)
            direction_code = 2

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

            # Predict total volume
            pred_volume = float(self.model.predict(features_df)[0])
            pred_volume = max(0.0, pred_volume)

            # Congestion level index
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

            # Estimate speed
            free_flow_speed = 60.0 if road_type_code == 1 else 40.0
            avg_speed = free_flow_speed * (1.0 - 0.75 * (congestion_pct / 100.0))
            avg_speed = max(5.0, round(avg_speed, 1))

            # Vehicle breakdown
            vehicle_count = int(round(pred_volume))
            cars = int(round(vehicle_count * 0.76))
            lgvs = int(round(vehicle_count * 0.13))
            hgvs = int(round(vehicle_count * 0.06))
            buses = int(round(vehicle_count * 0.02))
            cycles = max(0, vehicle_count - (cars + lgvs + hgvs + buses))

            time_str = f"{hour:02d}:00"

            forecast.append({
                "time": time_str,
                "predicted_volume": vehicle_count,
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
            })

        # Calculate summary metrics
        peak_hour = "17:00"
        max_congestion = 0
        total_delay = 0

        for f in forecast:
            if f["congestion_index"] > max_congestion:
                max_congestion = f["congestion_index"]
                peak_hour = f["time"]
            # Delay minutes estimation: 0 delay for Clear, up to 15 mins for Blocked
            if f["congestion_index"] > 30:
                total_delay += (f["congestion_index"] - 30) * 0.2

        estimated_delay = int(round(total_delay / 24.0 * 10.0)) # average delay metrics

        return {
            "road_name": road_name,
            "road_type": road_type,
            "latitude": latitude,
            "longitude": longitude,
            "date": date_str,
            "confidence": 0.88,  # model evaluation confidence level proxy
            "peak_hour": peak_hour,
            "max_congestion": max_congestion,
            "estimated_delay_minutes": max(2, estimated_delay),
            "forecast": forecast
        }

    def get_monitoring_status_batch(self):
        from core.config import settings
        if self.model is None or not self.road_metadata:
            self.load_artifacts()
            
        if not self.road_metadata:
            return []

        # If USE_INDIAN_DATASET is True, fetch actual live traffic from the TomTom Traffic API
        if settings.USE_INDIAN_DATASET:
            from services.traffic_api_service import traffic_api_service
            status_list = []
            for road_name, meta in self.road_metadata.items():
                lat = meta.get("latitude", 12.9716)
                lon = meta.get("longitude", 77.5946)
                
                # Fetch actual live flow from TomTom (or coordinates-based simulation fallback if no API key)
                live_flow = traffic_api_service.fetch_live_traffic_flow(lat, lon)
                import time
                time.sleep(0.25)
                
                congestion_pct = live_flow.get("congestion_index", 0)
                current_speed = live_flow.get("current_speed", 40)
                capacity = meta.get("capacity", 2000.0)
                
                # Back-calculate volume based on congestion percentage
                pred_volume = float((congestion_pct / 100.0) * capacity)
                
                if congestion_pct < 30.0:
                    status = "CLEAR"
                elif congestion_pct < 60.0:
                    status = "MODERATE"
                elif congestion_pct < 85.0:
                    status = "HEAVY"
                else:
                    status = "BLOCKED"
                
                status_list.append({
                    "road_name": road_name,
                    "road_type": meta.get("road_type", "Major Road"),
                    "latitude": lat,
                    "longitude": lon,
                    "congestion_index": int(round(congestion_pct)),
                    "congestion_status": status,
                    "predicted_volume": max(100, int(round(pred_volume))),
                    "confidence": live_flow.get("confidence", 0.90)
                })
            return status_list

        now = datetime.now()
        hour = now.hour
        day_of_week = now.weekday()
        month = now.month
        is_weekend = 1 if day_of_week in [5, 6] else 0
        direction_code = 2

        roads = list(self.road_metadata.keys())
        rows = []
        for r in roads:
            meta = self.road_metadata[r]
            rows.append({
                "hour": hour,
                "day_of_week": day_of_week,
                "month": month,
                "is_weekend": is_weekend,
                "latitude": meta.get("latitude", 51.5074),
                "longitude": meta.get("longitude", -0.1278),
                "road_type_code": meta.get("road_type_code", 1),
                "direction_code": direction_code
            })

        batch_df = pd.DataFrame(rows)
        preds = self.model.predict(batch_df)

        status_list = []
        for i, road_name in enumerate(roads):
            meta = self.road_metadata[road_name]
            capacity = meta.get("capacity", 1500.0)
            road_type = meta.get("road_type", "Major")
            pred_volume = float(max(0.0, preds[i]))
            congestion_pct = min(100.0, (pred_volume / capacity) * 100.0)

            if congestion_pct < 30.0:
                status = "CLEAR"
            elif congestion_pct < 60.0:
                status = "MODERATE"
            elif congestion_pct < 85.0:
                status = "HEAVY"
            else:
                status = "BLOCKED"

            status_list.append({
                "road_name": road_name,
                "road_type": road_type,
                "latitude": meta.get("latitude", 51.5074),
                "longitude": meta.get("longitude", -0.1278),
                "congestion_index": int(round(congestion_pct)),
                "congestion_status": status,
                "predicted_volume": int(round(pred_volume)),
                "confidence": 0.88
            })

        return status_list

# Singleton instance
prediction_service = PredictionService()

