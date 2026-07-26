import urllib.request
import urllib.parse
import json
import random
from datetime import datetime
from core.config import settings

class TrafficApiService:
    def __init__(self):
        self.api_key = settings.TOMTOM_API_KEY

    def fetch_live_traffic_flow(self, latitude: float, longitude: float) -> dict:
        # Check if settings has api_key loaded
        api_key = settings.TOMTOM_API_KEY
        if not api_key:
            return self._generate_simulated_flow(latitude, longitude, "Simulated Live Sensor (No API Key)")

        # TomTom Traffic Flow API
        url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/relative-zoom/10/json?point={latitude},{longitude}&unit=KMPH&key={api_key}"
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'TrafficVisionAI/1.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    flow_data = data.get("flowSegmentData", {})
                    if flow_data:
                        current_speed = flow_data.get("currentSpeed", 0)
                        free_flow_speed = flow_data.get("freeFlowSpeed", 50)
                        confidence = flow_data.get("confidence", 1.0)
                        current_travel_time = flow_data.get("currentTravelTime", 0)
                        free_flow_travel_time = flow_data.get("freeFlowTravelTime", 0)
                        
                        # Calculate congestion index based on speed drop
                        if free_flow_speed > 0:
                            congestion_index = max(0, min(100, int((1 - (current_speed / free_flow_speed)) * 100)))
                        else:
                            congestion_index = 0
                            
                        return {
                            "source": "TomTom API Live Feed",
                            "current_speed": current_speed,
                            "free_flow_speed": free_flow_speed,
                            "current_travel_time_sec": current_travel_time,
                            "free_flow_travel_time_sec": free_flow_travel_time,
                            "congestion_index": congestion_index,
                            "confidence": float(confidence)
                        }
                
                # If response status is not 200 or no flow segment data
                return self._generate_simulated_flow(latitude, longitude, f"Simulated Flow (TomTom API Status {response.status})")
                
        except Exception as e:
            print(f"TomTom API Request error: {e}")
            return self._generate_simulated_flow(latitude, longitude, "Simulated Flow (TomTom API Call Failed)")

    def _generate_simulated_flow(self, latitude: float, longitude: float, source_label: str) -> dict:
        # Generate realistic traffic flows that vary depending on coordinate hash and current time
        now = datetime.now()
        hour = now.hour
        day_of_week = now.weekday()
        
        # Base speed limit of the segment (free flow speed) based on coordinates
        coord_hash = int(abs(latitude * 1000 + longitude * 1000))
        random.seed(coord_hash)
        
        free_flow_speed = random.choice([50, 60, 80, 100, 110]) # standard speed limits (km/h)
        
        # Calculate time of day factor (rush hours: 8-9, 17-18)
        if hour in [8, 9, 17, 18]:
            # Peak traffic
            speed_factor = random.uniform(0.3, 0.55)
            confidence = random.uniform(0.7, 0.85)
        elif hour in [7, 10, 16, 19]:
            # Moderate traffic
            speed_factor = random.uniform(0.55, 0.78)
            confidence = random.uniform(0.8, 0.9)
        elif hour >= 22 or hour <= 5:
            # Low night traffic
            speed_factor = random.uniform(0.92, 1.0)
            confidence = random.uniform(0.95, 1.0)
        else:
            # Day normal traffic
            speed_factor = random.uniform(0.75, 0.88)
            confidence = random.uniform(0.85, 0.95)
            
        # Add a tiny bit of random noise for live feeling
        random.seed() # reset seed
        speed_factor = max(0.1, min(1.0, speed_factor + random.uniform(-0.04, 0.04)))
        current_speed = int(round(free_flow_speed * speed_factor))
        
        # Calculate travel times (simulated segment length of 1.5 km)
        segment_len_km = 1.5
        free_flow_time = int(round((segment_len_km / free_flow_speed) * 3600))
        current_time = int(round((segment_len_km / max(5, current_speed)) * 3600))
        
        congestion_index = max(0, min(100, int((1 - (current_speed / free_flow_speed)) * 100)))
        
        return {
            "source": source_label,
            "current_speed": current_speed,
            "free_flow_speed": free_flow_speed,
            "current_travel_time_sec": current_time,
            "free_flow_travel_time_sec": free_flow_time,
            "congestion_index": congestion_index,
            "confidence": round(float(confidence), 2)
        }

traffic_api_service = TrafficApiService()
