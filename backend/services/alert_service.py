from sqlalchemy.orm import Session
from datetime import datetime
import random
import zlib
from models.alert import Alert, AlertType, AlertSeverity, AlertStatus
from services.prediction_service import prediction_service

class AlertService:
    def __init__(self):
        self.last_generated_time = None

    def get_alerts(self, db: Session, status: str = None, severity: str = None, alert_type: str = None):
        # Only run generation once every 5 minutes (300 seconds)
        now = datetime.now()
        if not self.last_generated_time or (now - self.last_generated_time).total_seconds() > 300:
            self.generate_alerts_from_predictions(db)
            self.last_generated_time = now
        
        query = db.query(Alert)
        if status:
            query = query.filter(Alert.status == status)
        if severity:
            query = query.filter(Alert.severity == severity)
        if alert_type:
            query = query.filter(Alert.alert_type == alert_type)
        return query.order_by(Alert.created_at.desc()).limit(150).all()

    def get_alert_by_id(self, db: Session, alert_id: int):
        return db.query(Alert).filter(Alert.id == alert_id).first()

    def create_manual_alert(self, db: Session, alert_data: any, created_by: int):
        new_alert = Alert(
            title=alert_data.title,
            description=alert_data.description,
            location=alert_data.location,
            road_name=alert_data.road_name,
            alert_type=alert_data.alert_type,
            severity=alert_data.severity,
            status=AlertStatus.ACTIVE,
            prediction_score=alert_data.prediction_score,
            traffic_volume=alert_data.traffic_volume,
            created_by=created_by
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        try:
            from utils.email import send_alert_email
            send_alert_email(new_alert)
        except Exception as e:
            print(f"Error triggering manual alert email: {e}")
        return new_alert

    def acknowledge_alert(self, db: Session, alert_id: int):
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = AlertStatus.ACKNOWLEDGED
        alert.updated_at = datetime.now()
        db.commit()
        db.refresh(alert)
        return alert

    def resolve_alert(self, db: Session, alert_id: int):
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = AlertStatus.RESOLVED
        alert.updated_at = datetime.now()
        db.commit()
        db.refresh(alert)
        return alert

    def delete_alert(self, db: Session, alert_id: int):
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return False
        db.delete(alert)
        db.commit()
        return True

    def generate_alerts_from_predictions(self, db: Session):
        """
        Query current predictions for all roads and automatically create alerts.
        Also simulate some mock incidents (accidents, weather, road closures) randomly.
        Accumulates changes and commits them in a single batch to maximize performance.
        """
        try:
            status_list = prediction_service.get_monitoring_status_batch()
        except Exception as e:
            print(f"Error fetching predictions for alert generation: {e}")
            return

        # Fetch all active and acknowledged alerts once to avoid query-in-loop
        active_alerts = db.query(Alert).filter(Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED])).all()
        active_alerts_map = {(a.road_name, a.alert_type): a for a in active_alerts}

        changes_made = False

        for road_pred in status_list:
            road_name = road_pred.get("road_name")
            congestion_index = road_pred.get("congestion_index", 0)
            predicted_volume = road_pred.get("predicted_volume", 0)
            latitude = road_pred.get("latitude", 51.5074)
            longitude = road_pred.get("longitude", -0.1278)
            location = f"{latitude:.4f}, {longitude:.4f}"
            
            # Prediction score between 0.0 and 1.0
            prediction_score = congestion_index / 100.0

            # Helper to upsert locally
            def upsert_local(title, description, alert_type, severity, score, volume):
                nonlocal changes_made
                key = (road_name, alert_type)
                existing = active_alerts_map.get(key)
                if existing:
                    # Update if metrics changed
                    if existing.prediction_score != score or existing.traffic_volume != volume:
                        existing.prediction_score = score
                        existing.traffic_volume = volume
                        existing.updated_at = datetime.now()
                        changes_made = True
                else:
                    new_alert = Alert(
                        title=title,
                        description=description,
                        location=location,
                        road_name=road_name,
                        alert_type=alert_type,
                        severity=severity,
                        status=AlertStatus.ACTIVE,
                        prediction_score=score,
                        traffic_volume=volume
                    )
                    db.add(new_alert)
                    changes_made = True
                    try:
                        from utils.email import send_alert_email
                        send_alert_email(new_alert)
                    except Exception as e:
                        print(f"Error triggering alert email: {e}")

            # Threshold-based alerts logic
            if prediction_score > 0.90:
                title = f"AI Warning: Critical Congestion Predicted on {road_name}"
                description = (
                    f"AI model predicts critical congestion on {road_name}. "
                    f"Saturation is at {congestion_index}% with an estimated flow rate of {predicted_volume} vehicles/hour."
                )
                upsert_local(
                    title, description, AlertType.AI_PREDICTION, AlertSeverity.CRITICAL,
                    prediction_score, predicted_volume
                )
            elif prediction_score > 0.75:
                title = f"AI Warning: High Congestion Predicted on {road_name}"
                description = (
                    f"AI model predicts high congestion on {road_name}. "
                    f"Saturation is at {congestion_index}% with an estimated flow rate of {predicted_volume} vehicles/hour."
                )
                upsert_local(
                    title, description, AlertType.AI_PREDICTION, AlertSeverity.HIGH,
                    prediction_score, predicted_volume
                )
            
            # Traffic Volume Threshold
            if predicted_volume > 1200:
                title = f"Heavy Traffic Alert: {road_name}"
                description = (
                    f"Heavy traffic volume detected on {road_name}. "
                    f"Predicted volume is {predicted_volume} vehicles/hour, exceeding threshold."
                )
                upsert_local(
                    title, description, AlertType.HEAVY_TRAFFIC, AlertSeverity.MEDIUM,
                    prediction_score, predicted_volume
                )

            # Simulated alerts (Accident, Weather, Road Closure)
            # Use coordinate hash + hour hash for deterministic simulation per hour/road
            # This avoids creating new random alerts every single page refresh, making the system predictable
            now = datetime.now()
            seed_str = f"{road_name}-{now.year}-{now.month}-{now.day}-{now.hour}"
            sim_seed = zlib.adler32(seed_str.encode('utf-8'))
            random.seed(sim_seed)

            # 5% chance of simulated Accident
            if random.random() < 0.05:
                title = f"Accident Alert: {road_name}"
                description = f"Simulated multi-vehicle accident reported on {road_name}. Expect significant delays and lane restrictions."
                upsert_local(
                    title, description, AlertType.ACCIDENT, AlertSeverity.CRITICAL,
                    None, None
                )
            
            # 5% chance of simulated Road Closure
            if random.random() < 0.05:
                title = f"Road Closure: {road_name}"
                description = f"Road maintenance closure simulated on {road_name}. Detours are marked."
                upsert_local(
                    title, description, AlertType.ROAD_CLOSURE, AlertSeverity.HIGH,
                    None, None
                )

            # 8% chance of simulated Weather Impact
            if random.random() < 0.08:
                title = f"Weather Impact: {road_name}"
                description = f"Severe weather conditions simulated on {road_name}. Reduced speed limits and wet surface advisories in effect."
                upsert_local(
                    title, description, AlertType.WEATHER_IMPACT, AlertSeverity.MEDIUM,
                    None, None
                )
            
            # Reset random seed
            random.seed()

        if changes_made:
            db.commit()

alert_service = AlertService()
