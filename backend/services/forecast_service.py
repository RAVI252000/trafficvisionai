import os
import json
from datetime import datetime, timedelta
from services.prediction_service import prediction_service

class ForecastService:
    def __init__(self):
        pass

    def get_congestion_forecast_workflow(self, road_name: str, date_str: str = None):
        # Default date to today if not provided
        if not date_str:
            date_str = datetime.now().strftime("%Y-%m-%d")

        # 1. Fetch the 24-hour predictions for this road from the prediction service
        # This reuses the XGBoost model and road metadata loading logic
        forecast_24h_data = prediction_service.predict_hourly_forecast(road_name, date_str)
        forecast_list = forecast_24h_data["forecast"]

        # 2. Get current time details
        now = datetime.now()
        current_hour = now.hour
        current_minute = now.minute

        # Calculate time intervals
        intervals = [
            {"label": "Current Hour", "offset_minutes": 0},
            {"label": "+30 Minutes", "offset_minutes": 30},
            {"label": "+1 Hour", "offset_minutes": 60},
            {"label": "+2 Hours", "offset_minutes": 120},
            {"label": "+3 Hours", "offset_minutes": 180}
        ]

        timeline = []
        
        # Helper to get interpolated metrics at a specific float hour (e.g. 14.5 for 14:30)
        def get_metrics_at_hour(float_hour: float):
            float_hour = float_hour % 24
            lower_hour = int(float_hour)
            upper_hour = (lower_hour + 1) % 24
            fraction = float_hour - lower_hour

            lower_metrics = forecast_list[lower_hour]
            upper_metrics = forecast_list[upper_hour]

            # Linear interpolation for continuous values
            predicted_volume = lower_metrics["predicted_volume"] + fraction * (upper_metrics["predicted_volume"] - lower_metrics["predicted_volume"])
            congestion_index = lower_metrics["congestion_index"] + fraction * (upper_metrics["congestion_index"] - lower_metrics["congestion_index"])
            average_speed = lower_metrics["average_speed"] + fraction * (upper_metrics["average_speed"] - lower_metrics["average_speed"])

            # Round values
            predicted_volume = int(round(predicted_volume))
            congestion_index = int(round(congestion_index))
            average_speed = round(average_speed, 1)

            # Re-determine status based on interpolated congestion percentage
            if congestion_index < 30:
                status = "CLEAR"
            elif congestion_index < 60:
                status = "MODERATE"
            elif congestion_index < 85:
                status = "HEAVY"
            else:
                status = "BLOCKED"

            # Interpolate breakdown counts
            breakdown = {}
            for vehicle_type in ["cars_and_taxis", "lgvs", "all_hgvs", "buses_and_coaches", "pedal_cycles"]:
                low_val = lower_metrics["breakdown"][vehicle_type]
                high_val = upper_metrics["breakdown"][vehicle_type]
                breakdown[vehicle_type] = int(round(low_val + fraction * (high_val - low_val)))

            return {
                "predicted_volume": predicted_volume,
                "congestion_index": congestion_index,
                "congestion_status": status,
                "average_speed": average_speed,
                "breakdown": breakdown
            }

        # Generate timeline metrics
        previous_congestion = None
        
        # Fetch preceding hour's congestion for Current Hour's trend calculation
        preceding_hour = (current_hour - 1) % 24
        preceding_congestion = forecast_list[preceding_hour]["congestion_index"]

        for interval in intervals:
            offset = interval["offset_minutes"]
            target_time = now + timedelta(minutes=offset)
            target_time_str = target_time.strftime("%H:%M")
            
            # Compute target hour as float
            target_float_hour = current_hour + (current_minute + offset) / 60.0
            
            metrics = get_metrics_at_hour(target_float_hour)

            # Determine Trend Indicator (UP, DOWN, STABLE)
            # Compare to preceding interval
            compare_val = preceding_congestion if previous_congestion is None else previous_congestion
            diff = metrics["congestion_index"] - compare_val

            if diff > 1.5:
                trend = "UP"  # Congestion is worsening
            elif diff < -1.5:
                trend = "DOWN"  # Congestion is clearing
            else:
                trend = "STABLE"

            previous_congestion = metrics["congestion_index"]

            # Dynamic confidence score based on forecasting horizon (reduces slightly over time)
            base_confidence = forecast_24h_data["confidence"]
            time_decay = (offset / 60.0) * 0.025  # lose 2.5% confidence per hour forecast horizon
            confidence_score = max(0.70, round(base_confidence - time_decay, 2))

            timeline.append({
                "label": interval["label"],
                "time": target_time_str,
                "predicted_volume": metrics["predicted_volume"],
                "congestion_index": metrics["congestion_index"],
                "congestion_status": metrics["congestion_status"],
                "average_speed": metrics["average_speed"],
                "trend": trend,
                "confidence_score": confidence_score,
                "breakdown": metrics["breakdown"]
            })

        return {
            "road_name": road_name,
            "road_type": forecast_24h_data["road_type"],
            "latitude": forecast_24h_data["latitude"],
            "longitude": forecast_24h_data["longitude"],
            "date": date_str,
            "timeline": timeline
        }

    def get_all_roads_monitoring_status(self):
        metadata = prediction_service.road_metadata
        current_hour = datetime.now().hour
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        status_list = []
        for road_name in metadata.keys():
            try:
                res = prediction_service.predict_hourly_forecast(road_name, current_date)
                active = res["forecast"][current_hour]
                status_list.append({
                    "road_name": road_name,
                    "road_type": res["road_type"],
                    "latitude": res["latitude"],
                    "longitude": res["longitude"],
                    "congestion_index": active["congestion_index"],
                    "congestion_status": active["congestion_status"],
                    "predicted_volume": active["predicted_volume"],
                    "confidence": res["confidence"]
                })
            except Exception as e:
                print(f"Skipping road {road_name} in monitoring status: {e}")
                
        return status_list

forecast_service = ForecastService()
