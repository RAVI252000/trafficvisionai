import pandas as pd
from datetime import datetime
from services.prediction_service import prediction_service
from core.config import settings

class HeatmapService:
    def get_heatmap_points(self, filters: dict) -> list:
        # Determine target hour
        target_time = filters.get("time")
        now = datetime.now()
        hour = now.hour

        if target_time is not None and target_time != "":
            try:
                # time might be hour number (0-23) or standard format (HH:MM)
                if ":" in str(target_time):
                    hour = int(str(target_time).split(":")[0])
                else:
                    hour = int(target_time)
            except ValueError:
                pass

        status_list = []
        if prediction_service.model is not None and prediction_service.road_metadata:
            day_of_week = now.weekday()
            month = now.month
            is_weekend = 1 if day_of_week in [5, 6] else 0
            direction_code = 2
            
            roads = list(prediction_service.road_metadata.keys())
            rows = []
            for r in roads:
                meta = prediction_service.road_metadata[r]
                model_lat = meta.get("latitude", 51.5074)
                model_lng = meta.get("longitude", -0.1278)
                if settings.USE_INDIAN_DATASET:
                    model_lat = 53.6278
                    model_lng = -1.1029
                rows.append({
                    "hour": hour,
                    "day_of_week": day_of_week,
                    "month": month,
                    "is_weekend": is_weekend,
                    "latitude": model_lat,
                    "longitude": model_lng,
                    "road_type_code": meta.get("road_type_code", 1),
                    "direction_code": direction_code
                })
                
            batch_df = pd.DataFrame(rows)
            preds = prediction_service.model.predict(batch_df)
            
            for i, road_name in enumerate(roads):
                meta = prediction_service.road_metadata[road_name]
                capacity = meta.get("capacity", 1500.0)
                road_type = meta.get("road_type", "Major")
                pred_volume = float(max(0.0, preds[i]))
                congestion_pct = min(100.0, (pred_volume / capacity) * 100.0)
                
                status_list.append({
                    "road_name": road_name,
                    "road_type": road_type,
                    "latitude": meta.get("latitude", 51.5074),
                    "longitude": meta.get("longitude", -0.1278),
                    "congestion_index": int(round(congestion_pct)),
                    "predicted_volume": int(round(pred_volume)),
                    "region": meta.get("region", "All")
                })
        else:
            # Fallback mock status
            status_list = [
                {
                    "road_name": "A1",
                    "road_type": "Major",
                    "latitude": 53.627,
                    "longitude": -1.102,
                    "congestion_index": 72,
                    "predicted_volume": 1250,
                    "region": "Yorkshire and The Humber"
                },
                {
                    "road_name": "A3112",
                    "road_type": "Minor",
                    "latitude": 53.608,
                    "longitude": -1.092,
                    "congestion_index": 35,
                    "predicted_volume": 680,
                    "region": "Yorkshire and The Humber"
                }
            ]

        # Apply filters
        heatmap_points = []
        for item in status_list:
            road_name = item["road_name"]
            lat = item["latitude"]
            lng = item["longitude"]
            congestion_score = item["congestion_index"]
            volume = item["predicted_volume"]
            road_type = item["road_type"]
            region = item["region"]
            
            # Map levels
            if congestion_score < 30:
                level = "Low"
            elif congestion_score < 60:
                level = "Moderate"
            elif congestion_score < 85:
                level = "High"
            else:
                level = "Severe"

            # Filter by Region
            region_filter = filters.get("region")
            if region_filter and region_filter != "All" and region_filter.lower() != region.lower():
                continue

            # Filter by Road Type
            road_type_filter = filters.get("road_type")
            if road_type_filter and road_type_filter != "All" and road_type_filter.lower() != road_type.lower():
                continue

            # Filter by Congestion Level
            cong_level_filter = filters.get("congestion_level")
            if cong_level_filter and cong_level_filter != "All" and cong_level_filter.lower() != level.lower():
                continue

            heatmap_points.append({
                "road_name": road_name,
                "location": f"{lat:.5f}, {lng:.5f}",
                "latitude": lat,
                "longitude": lng,
                "congestion_score": congestion_score,
                "traffic_density": congestion_score,
                "congestion_level": level,
                "vehicle_density": congestion_score,
                "vehicle_count": volume,
                "prediction_score": float(round(congestion_score / 100.0, 2)),
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })

        return heatmap_points

heatmap_service = HeatmapService()
