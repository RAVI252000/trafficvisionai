import os
import json
import requests
import numpy as np
import pandas as pd
from datetime import datetime
from services.prediction_service import prediction_service

class RoutingService:
    def __init__(self):
        pass

    def estimate_travel_time(
        self,
        distance_km: float,
        avg_congestion: float,
        road_type: str = "Major",
        weather: str = "Clear",
        road_condition: str = "Excellent"
    ):
        # 1. Adjust base free-flow speed based on road type and road condition
        base_speed = 60.0 if road_type.lower() == "major" else 40.0
        
        if road_condition.lower() == "maintenance":
            # Road maintenance reduces speed limit by 25%
            base_speed *= 0.75
        elif road_condition.lower() == "good":
            base_speed *= 0.95

        # Calculate normal travel time in minutes (no traffic)
        normal_time_minutes = (distance_km / max(5.0, base_speed)) * 60.0
        
        # 2. Scale congestion impact depending on weather conditions
        effective_congestion = avg_congestion
        weather_extra_delay_factor = 0.0
        
        if weather.lower() == "rain":
            effective_congestion *= 1.15
            weather_extra_delay_factor = 0.08  # rain adds 8% travel delay independently
        elif weather.lower() == "snow":
            effective_congestion *= 1.35
            weather_extra_delay_factor = 0.25  # snow adds 25% travel delay
        elif weather.lower() == "fog":
            effective_congestion *= 1.25
            weather_extra_delay_factor = 0.18  # fog adds 18% travel delay
            
        effective_congestion = min(100.0, effective_congestion)

        # Calculate delay factor based on effective congestion
        if effective_congestion < 30.0:
            delay_factor = 0.05 * (effective_congestion / 30.0)
        elif effective_congestion < 60.0:
            delay_factor = 0.05 + 0.35 * ((effective_congestion - 30.0) / 30.0)
        else:
            delay_factor = 0.40 + 1.60 * ((effective_congestion - 60.0) / 40.0)

        congestion_delay_minutes = normal_time_minutes * delay_factor
        weather_delay_minutes = normal_time_minutes * weather_extra_delay_factor
        
        total_delay_minutes = congestion_delay_minutes + weather_delay_minutes
        estimated_time_minutes = normal_time_minutes + total_delay_minutes
        
        traffic_impact = (total_delay_minutes / normal_time_minutes) * 100.0 if normal_time_minutes > 0 else 0.0

        # Delay level indicator
        if total_delay_minutes < 3.0:
            delay_level = "LOW"
        elif total_delay_minutes < 8.0:
            delay_level = "MEDIUM"
        else:
            delay_level = "HIGH"

        # 3. Calculate Environmental Impact (Carbon footprint & fuel)
        # Base emission: 0.12 kg CO2 per km for a standard car
        # Congested emission adds 0.11 kg CO2 per minute of delay (representing idling & stop-and-go)
        co2_kg = (distance_km * 0.12) + (total_delay_minutes * 0.11)
        
        # 1 liter of petrol yields ~2.31 kg of CO2
        fuel_liters = co2_kg / 2.31

        return {
            "normal_time": round(normal_time_minutes, 1),
            "estimated_time": round(estimated_time_minutes, 1),
            "delay": round(total_delay_minutes, 1),
            "traffic_impact": round(traffic_impact, 1),
            "delay_level": delay_level,
            "co2_kg": round(co2_kg, 2),
            "fuel_liters": round(fuel_liters, 2)
        }

    def recommend_routes(
        self,
        source_road: str,
        dest_road: str,
        preference: str = "Fastest",
        weather: str = "Clear",
        road_condition: str = "Excellent"
    ):
        # Resolve road coordinates
        metadata = prediction_service.road_metadata
        
        # Fallbacks if roads not found
        lat1, lng1 = 53.627, -1.102  # A1 default
        lat2, lng2 = 53.680, -1.050  # Near default
        
        if source_road in metadata:
            lat1 = metadata[source_road]["latitude"]
            lng1 = metadata[source_road]["longitude"]
            
        if dest_road in metadata:
            lat2 = metadata[dest_road]["latitude"]
            lng2 = metadata[dest_road]["longitude"]

        # Call public OSRM API (lng,lat format)
        url = f"http://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?geometries=geojson&overview=full&alternatives=true"
        
        routes_data = []
        try:
            response = requests.get(url, timeout=5.0)
            if response.status_code == 200:
                osrm_data = response.json()
                routes = osrm_data.get("routes", [])
                
                for idx, r in enumerate(routes):
                    distance_km = r["distance"] / 1000.0
                    
                    # Swap OSRM GeoJSON [lng, lat] coordinates to Leaflet [lat, lng]
                    geometry_coords = r["geometry"]["coordinates"]
                    polyline_coords = [[coord[1], coord[0]] for coord in geometry_coords]
                    
                    # Calculate ML-based congestion index along this specific route path
                    avg_congestion = self._estimate_congestion_along_path(polyline_coords)
                    
                    # Estimate travel times & eco metrics
                    road_type = metadata.get(source_road, {}).get("road_type", "Major")
                    est_data = self.estimate_travel_time(
                        distance_km=distance_km,
                        avg_congestion=avg_congestion,
                        road_type=road_type,
                        weather=weather,
                        road_condition=road_condition
                    )
                    
                    # Label default indices
                    label = "Route Option A" if idx == 0 else (f"Route Option B" if idx == 1 else f"Route Option C")
                    road_status = "Excellent" if idx == 0 else ("Good" if idx == 1 else "Satisfactory")
                    if road_condition.lower() == "maintenance" and idx == 0:
                        road_status = "Maintenance Zones"

                    routes_data.append({
                        "id": idx + 1,
                        "name": label,
                        "distance_km": round(distance_km, 2),
                        "normal_time": est_data["normal_time"],
                        "estimated_time": est_data["estimated_time"],
                        "delay": est_data["delay"],
                        "traffic_impact": est_data["traffic_impact"],
                        "delay_level": est_data["delay_level"],
                        "co2_kg": est_data["co2_kg"],
                        "fuel_liters": est_data["fuel_liters"],
                        "congestion_level": int(round(avg_congestion)),
                        "traffic_status": "CLEAR" if avg_congestion < 30 else ("MODERATE" if avg_congestion < 60 else "HEAVY"),
                        "road_condition": road_status,
                        "path": polyline_coords,
                        "is_fastest": False,
                        "is_shortest": False,
                        "is_eco": False
                    })
        except Exception as e:
            print(f"OSRM Routing failed, falling back to mock route generation: {e}")

        # Fallback to Mock Routes if OSRM failed or returned no routes
        if not routes_data:
            routes_data = self._generate_mock_routes(lat1, lng1, lat2, lng2, source_road, dest_road, weather, road_condition)

        # Apply flags for Fastest, Shortest, and Eco-Friendly routes
        if routes_data:
            # 1. Identify Fastest (Lowest estimated time)
            fastest_idx = int(np.argmin([r["estimated_time"] for r in routes_data]))
            routes_data[fastest_idx]["is_fastest"] = True
            
            # 2. Identify Shortest (Lowest distance)
            shortest_idx = int(np.argmin([r["distance_km"] for r in routes_data]))
            routes_data[shortest_idx]["is_shortest"] = True
            
            # 3. Identify Eco-Friendly (Lowest CO2 emission)
            eco_idx = int(np.argmin([r["co2_kg"] for r in routes_data]))
            routes_data[eco_idx]["is_eco"] = True

            # Re-label names to reflect preferences if selected
            for r in routes_data:
                badges = []
                if r["is_fastest"]:
                    badges.append("Fastest")
                if r["is_shortest"]:
                    badges.append("Shortest")
                if r["is_eco"]:
                    badges.append("Eco-Friendly")
                
                if badges:
                    r["name"] = f"{r['name']} ({' & '.join(badges)})"

            # Sort routes based on user preference
            pref_lower = preference.lower()
            if pref_lower == "shortest":
                routes_data.sort(key=lambda x: x["distance_km"])
            elif pref_lower == "eco":
                routes_data.sort(key=lambda x: x["co2_kg"])
            else:  # fastest / default
                routes_data.sort(key=lambda x: x["estimated_time"])

        return routes_data

    def _estimate_congestion_along_path(self, coords: list):
        if not coords:
            return 30.0
        
        # Sample coordinates at up to 5 segments along the path
        sample_indices = [0, len(coords)//4, len(coords)//2, 3*len(coords)//4, len(coords)-1]
        sample_indices = list(set([idx for idx in sample_indices if idx < len(coords)]))
        
        congestion_sum = 0
        count = 0
        metadata = prediction_service.road_metadata
        model = prediction_service.model

        now = datetime.now()
        hour = now.hour
        day_of_week = now.weekday()
        month = now.month
        is_weekend = 1 if day_of_week in [5, 6] else 0

        # Try to find matching roads near the sampled coordinates and run XGBoost model prediction
        for idx in sample_indices:
            lat, lng = coords[idx]
            closest_road_meta = None
            min_dist = float('inf')
            
            for road, meta in metadata.items():
                dist = (lat - meta["latitude"])**2 + (lng - meta["longitude"])**2
                if dist < min_dist:
                    min_dist = dist
                    closest_road_meta = meta

            # If a matched monitored checkpoint is within 5km squared, run ML prediction
            if closest_road_meta and min_dist < 0.05 and model is not None:
                try:
                    features = {
                        "hour": [hour],
                        "day_of_week": [day_of_week],
                        "month": [month],
                        "is_weekend": [is_weekend],
                        "latitude": [closest_road_meta["latitude"]],
                        "longitude": [closest_road_meta["longitude"]],
                        "road_type_code": [closest_road_meta["road_type_code"]],
                        "direction_code": [2]
                    }
                    df_feats = pd.DataFrame(features)
                    pred_volume = float(max(0.0, model.predict(df_feats)[0]))
                    capacity = closest_road_meta.get("capacity", 1500.0)
                    congestion_pct = (pred_volume / capacity) * 100.0
                    congestion_sum += min(100.0, max(5.0, congestion_pct))
                except Exception:
                    # Fallback if prediction fails
                    congestion_sum += 35.0
            else:
                # Time-of-day simulation fallback
                if 7 <= hour <= 9 or 17 <= hour <= 19:
                    congestion_sum += float(np.random.uniform(55.0, 85.0))
                else:
                    congestion_sum += float(np.random.uniform(15.0, 45.0))
            count += 1

        return congestion_sum / count if count > 0 else 30.0

    def _generate_mock_routes(self, lat1, lng1, lat2, lng2, source_road, dest_road, weather, road_condition):
        routes = []
        
        # Calculate straight-line distance
        straight_dist = ((lat2 - lat1)**2 + (lng2 - lng1)**2)**0.5 * 100.0
        straight_dist = max(1.5, straight_dist)

        # Generate 3 paths
        configs = [
            {"id": 1, "name": "Direct Route", "offset_lat": 0.0, "offset_lng": 0.0, "dist_scale": 1.12, "cong_base": 42.0, "condition": "Excellent"},
            {"id": 2, "name": "Bypass Route", "offset_lat": 0.018, "offset_lng": 0.018, "dist_scale": 1.30, "cong_base": 24.0, "condition": "Good"},
            {"id": 3, "name": "Collector Road", "offset_lat": -0.022, "offset_lng": -0.022, "dist_scale": 1.48, "cong_base": 58.0, "condition": "Minor Delays"}
        ]

        for config in configs:
            dist = straight_dist * config["dist_scale"]
            
            # Interpolate coordinates with curves
            path = []
            num_points = 12
            for i in range(num_points):
                fraction = i / (num_points - 1)
                lat = lat1 + fraction * (lat2 - lat1)
                lng = lng1 + fraction * (lng2 - lng1)
                
                if 0 < i < num_points - 1:
                    offset_factor = np.sin(fraction * np.pi)
                    lat += config["offset_lat"] * offset_factor
                    lng += config["offset_lng"] * offset_factor
                    
                path.append([lat, lng])

            # Get average congestion (randomized base with rush hours)
            hour = datetime.now().hour
            rush_multiplier = 1.35 if (7 <= hour <= 9 or 17 <= hour <= 19) else 0.75
            congestion = min(98.0, config["cong_base"] * rush_multiplier * float(np.random.uniform(0.9, 1.1)))

            # Estimate travel times & eco metrics
            road_type = prediction_service.road_metadata.get(source_road, {}).get("road_type", "Major")
            est = self.estimate_travel_time(
                distance_km=dist,
                avg_congestion=congestion,
                road_type=road_type,
                weather=weather,
                road_condition=road_condition
            )

            routes.append({
                "id": config["id"],
                "name": config["name"],
                "distance_km": round(dist, 2),
                "normal_time": est["normal_time"],
                "estimated_time": est["estimated_time"],
                "delay": est["delay"],
                "traffic_impact": est["traffic_impact"],
                "delay_level": est["delay_level"],
                "co2_kg": est["co2_kg"],
                "fuel_liters": est["fuel_liters"],
                "congestion_level": int(round(congestion)),
                "traffic_status": "CLEAR" if congestion < 30 else ("MODERATE" if congestion < 60 else "HEAVY"),
                "road_condition": config["condition"] if road_condition.lower() != "maintenance" else "Maintenance zones",
                "path": path,
                "is_fastest": False,
                "is_shortest": False,
                "is_eco": False
            })

        return routes

routing_service = RoutingService()
