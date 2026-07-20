import os
import json
import requests
from datetime import datetime
from services.prediction_service import prediction_service

class RoutingService:
    def __init__(self):
        pass

    def estimate_travel_time(self, distance_km: float, avg_congestion: float, road_type: str = "Major"):
        # Base free-flow speed
        free_flow_speed = 60.0 if road_type.lower() == "major" else 40.0
        
        # Calculate normal travel time in minutes (no traffic)
        normal_time_minutes = (distance_km / free_flow_speed) * 60.0
        
        # Traffic delay increases with congestion level
        # Congestion < 30%: negligible delay
        # Congestion 30-60%: moderate delay (up to 40% slower)
        # Congestion > 60%: heavy delay (up to 200% slower)
        if avg_congestion < 30.0:
            delay_factor = 0.05 * (avg_congestion / 30.0)
        elif avg_congestion < 60.0:
            delay_factor = 0.05 + 0.35 * ((avg_congestion - 30.0) / 30.0)
        else:
            delay_factor = 0.40 + 1.60 * ((avg_congestion - 60.0) / 40.0)

        delay_minutes = normal_time_minutes * delay_factor
        estimated_time_minutes = normal_time_minutes + delay_minutes
        
        traffic_impact = (delay_minutes / normal_time_minutes) * 100.0 if normal_time_minutes > 0 else 0.0

        # Delay level indicator
        if delay_minutes < 3.0:
            delay_level = "LOW"
        elif delay_minutes < 8.0:
            delay_level = "MEDIUM"
        else:
            delay_level = "HIGH"

        return {
            "normal_time": round(normal_time_minutes, 1),
            "estimated_time": round(estimated_time_minutes, 1),
            "delay": round(delay_minutes, 1),
            "traffic_impact": round(traffic_impact, 1),
            "delay_level": delay_level
        }

    def recommend_routes(self, source_road: str, dest_road: str):
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
                    normal_time = r["duration"] / 60.0
                    
                    # Extract GeoJSON coordinates [lng, lat] and swap to [lat, lng] for Leaflet
                    geometry_coords = r["geometry"]["coordinates"]
                    polyline_coords = [[coord[1], coord[0]] for coord in geometry_coords]
                    
                    # Sample average congestion along the route path
                    avg_congestion = self._estimate_congestion_along_path(polyline_coords, source_road, dest_road)
                    
                    # Estimate travel times
                    est_data = self.estimate_travel_time(distance_km, avg_congestion)
                    
                    # Determine route name label
                    if idx == 0:
                        label = "Best Route (OSRM)"
                    else:
                        label = f"Alternate Route {idx} (OSRM)"

                    traffic_status = "CLEAR" if avg_congestion < 30 else ("MODERATE" if avg_congestion < 60 else "HEAVY")
                    road_condition = "Excellent" if idx == 0 else ("Good" if idx == 1 else "Minor Roadworks")

                    routes_data.append({
                        "id": idx + 1,
                        "name": label,
                        "distance_km": round(distance_km, 2),
                        "normal_time": est_data["normal_time"],
                        "estimated_time": est_data["estimated_time"],
                        "delay": est_data["delay"],
                        "traffic_impact": est_data["traffic_impact"],
                        "delay_level": est_data["delay_level"],
                        "congestion_level": int(round(avg_congestion)),
                        "traffic_status": traffic_status,
                        "road_condition": road_condition,
                        "path": polyline_coords
                    })
        except Exception as e:
            print(f"OSRM Routing failed, falling back to mock route generation: {e}")

        # Fallback to Mock Routes if OSRM failed or returned no routes
        if not routes_data:
            routes_data = self._generate_mock_routes(lat1, lng1, lat2, lng2, source_road, dest_road)

        return routes_data

    def _estimate_congestion_along_path(self, coords: list, source_road: str, dest_road: str):
        # Sample coordinates at 5 points along the path
        if not coords:
            return 35.0 # default low-moderate congestion
        
        sample_indices = [0, len(coords)//4, len(coords)//2, 3*len(coords)//4, len(coords)-1]
        sample_indices = [idx for idx in sample_indices if idx < len(coords)]
        
        congestion_sum = 0
        count = 0
        metadata = prediction_service.road_metadata

        # Try to find matching roads near the sampled points
        for idx in sample_indices:
            lat, lng = coords[idx]
            
            # Simple nearest-neighbor search inside our metadata roads
            closest_road_cong = None
            min_dist = float('inf')
            
            for road, meta in metadata.items():
                dist = (lat - meta["latitude"])**2 + (lng - meta["longitude"])**2
                if dist < min_dist:
                    min_dist = dist
                    # Simulate current hour prediction
                    hour = datetime.now().hour
                    closest_road_cong = meta["capacity"] # base factor

            if closest_road_cong and min_dist < 0.05: # threshold distance (~5km squared)
                # Randomize slightly for realistic spatial variation
                congestion_sum += np.random.uniform(20.0, 75.0)
            else:
                # Fallback to time-of-day traffic model
                hour = datetime.now().hour
                if 7 <= hour <= 9 or 17 <= hour <= 19:
                    congestion_sum += np.random.uniform(55.0, 85.0) # peak rush hour
                else:
                    congestion_sum += np.random.uniform(15.0, 45.0) # off-peak
            count += 1

        return congestion_sum / count if count > 0 else 35.0

    def _generate_mock_routes(self, lat1, lng1, lat2, lng2, source_road, dest_road):
        routes = []
        
        # Calculate straight-line distance
        # Simple Euclidean distance scaled to roughly match kilometers in UK latitudes
        straight_dist = ((lat2 - lat1)**2 + (lng2 - lng1)**2)**0.5 * 100.0
        straight_dist = max(1.5, straight_dist)

        # Generate 3 paths
        # Path 1: Direct path (Best Route)
        # Path 2: Curved East/North (Alt 1)
        # Path 3: Curved West/South (Alt 2)
        configs = [
            {"id": 1, "name": "Best Route (Direct)", "offset_lat": 0.0, "offset_lng": 0.0, "dist_scale": 1.12, "cong_base": 34.0, "condition": "Excellent"},
            {"id": 2, "name": "Alternate Route 1 (Via Bypass)", "offset_lat": 0.015, "offset_lng": 0.015, "dist_scale": 1.28, "cong_base": 22.0, "condition": "Good"},
            {"id": 3, "name": "Alternate Route 2 (Scenic)", "offset_lat": -0.02, "offset_lng": -0.02, "dist_scale": 1.45, "cong_base": 55.0, "condition": "Minor Construction"}
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
                
                # Add curve offsets in the middle
                if 0 < i < num_points - 1:
                    # Sine wave offset peaking in the middle
                    offset_factor = np.sin(fraction * np.pi)
                    lat += config["offset_lat"] * offset_factor
                    lng += config["offset_lng"] * offset_factor
                    
                path.append([lat, lng])

            # Get average congestion (randomized base)
            hour = datetime.now().hour
            rush_multiplier = 1.3 if (7 <= hour <= 9 or 17 <= hour <= 19) else 0.8
            congestion = min(98.0, config["cong_base"] * rush_multiplier * np.random.uniform(0.9, 1.1))

            est = self.estimate_travel_time(dist, congestion)
            traffic_status = "CLEAR" if congestion < 30 else ("MODERATE" if congestion < 60 else "HEAVY")

            routes.append({
                "id": config["id"],
                "name": config["name"],
                "distance_km": round(dist, 2),
                "normal_time": est["normal_time"],
                "estimated_time": est["estimated_time"],
                "delay": est["delay"],
                "traffic_impact": est["traffic_impact"],
                "delay_level": est["delay_level"],
                "congestion_level": int(round(congestion)),
                "traffic_status": traffic_status,
                "road_condition": config["condition"],
                "path": path
            })

        return routes

routing_service = RoutingService()
