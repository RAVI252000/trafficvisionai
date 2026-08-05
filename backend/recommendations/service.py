import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.recommendation import Recommendation, RecommendationStatus, RecommendationCategory, RecommendationPriority
from models.alert import Alert, AlertType
from services.prediction_service import prediction_service
from services.reports_service import reports_service

class RecommendationService:
    def get_recommendations(
        self,
        db: Session,
        priority: str = None,
        category: str = None,
        status: str = None,
        region: str = None,
        road_name: str = None,
        search: str = None
    ) -> list:
        query = db.query(Recommendation)

        if priority and priority != "All":
            query = query.filter(Recommendation.priority == priority)
        if category and category != "All":
            query = query.filter(Recommendation.category == category)
        if status and status != "All":
            query = query.filter(Recommendation.status == status)
        if region and region != "All":
            query = query.filter(Recommendation.region.ilike(f"%{region}%"))
        if road_name and road_name != "":
            query = query.filter(Recommendation.affected_road.ilike(f"%{road_name}%"))
        if search and search != "":
            query = query.filter(
                or_(
                    Recommendation.title.ilike(f"%{search}%"),
                    Recommendation.description.ilike(f"%{search}%"),
                    Recommendation.reason.ilike(f"%{search}%")
                )
            )

        return query.order_by(Recommendation.created_at.desc()).all()

    def get_recommendation_by_id(self, db: Session, rec_id: int) -> Recommendation:
        return db.query(Recommendation).filter(Recommendation.id == rec_id).first()

    def update_recommendation_status(self, db: Session, rec_id: int, status: RecommendationStatus) -> Recommendation:
        rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
        if not rec:
            return None
        rec.status = status
        db.commit()
        db.refresh(rec)
        return rec

    def get_recommendation_summary(self, db: Session) -> dict:
        total = db.query(Recommendation).count()
        critical = db.query(Recommendation).filter(Recommendation.priority == RecommendationPriority.CRITICAL).count()
        pending = db.query(Recommendation).filter(Recommendation.status == RecommendationStatus.PENDING).count()
        implemented = db.query(Recommendation).filter(Recommendation.status == RecommendationStatus.IMPLEMENTED).count()

        return {
            "total_count": total,
            "critical_count": critical,
            "pending_count": pending,
            "implemented_count": implemented
        }

    def generate_recommendations(self, db: Session) -> int:
        """
        AI rule-based engine that evaluates live predictions, safety alerts,
        and congestion timelines to generate prioritized, actionable recommendations.
        """
        # 1. Fetch current live predictions
        try:
            predictions = prediction_service.get_monitoring_status_batch()
        except Exception as e:
            print(f"Error fetching predictions for AI recommendations: {e}")
            predictions = []

        # 2. Fetch active incident alerts
        active_alerts = db.query(Alert).filter(Alert.status == "Active").all()

        # Keep track of newly created items count
        created_count = 0

        # Helper to avoid duplicates
        def exists_active(road: str, cat: RecommendationCategory) -> bool:
            return db.query(Recommendation).filter(
                Recommendation.affected_road == road,
                Recommendation.category == cat,
                Recommendation.status == RecommendationStatus.PENDING
            ).first() is not None

        # Helper to insert recommendation
        def add_rec(title, desc, cat, priority, road, region, reason, impact, conf):
            nonlocal created_count
            if exists_active(road, cat):
                return
            new_rec = Recommendation(
                title=title,
                description=desc,
                category=cat,
                priority=priority,
                affected_road=road,
                region=region,
                reason=reason,
                expected_impact=impact,
                confidence_score=conf,
                status=RecommendationStatus.PENDING
            )
            db.add(new_rec)
            created_count += 1

        # Rule 1: Evaluate Severe / High Congestion Predictions
        for pred in predictions:
            road = pred.get("road_name")
            congestion_idx = pred.get("congestion_index", 0)
            volume = pred.get("predicted_volume", 0)
            road_type = pred.get("road_type", "Major")
            
            # Lookup region from metadata
            meta = prediction_service.road_metadata.get(road, {})
            region = meta.get("region", "London")

            # Severe Congestion (Index > 80%)
            if congestion_idx >= 80:
                # Suggest Alternate Route
                add_rec(
                    title=f"Activate Alternate Routing on {road}",
                    desc=f"Divert vehicles from {road} to nearby local bypass arterials to relieve traffic congestion.",
                    cat=RecommendationCategory.ROUTE_OPTIMIZATION,
                    priority=RecommendationPriority.CRITICAL,
                    road=road,
                    region=region,
                    reason=f"XGBoost model predicts severe capacity utilization of {congestion_idx}% with traffic flow rates exceeding {volume} vehicles/hour.",
                    impact="Relieve bottleneck density on primary segments by 15-20%.",
                    conf=0.92
                )
                
                # Signal Timing adjustment
                add_rec(
                    title=f"Adjust Traffic Signal Cycles at {road} Junctions",
                    desc=f"Temporarily increase the green-light window duration by +15 seconds along the major inbound corridors.",
                    cat=RecommendationCategory.SIGNAL_OPTIMIZATION,
                    priority=RecommendationPriority.HIGH,
                    road=road,
                    region=region,
                    reason=f"Severe queue forming on {road} with slow flow speed of < 15 km/h.",
                    impact="Reduce average intersection wait times and delay index by 18%.",
                    conf=0.88
                )
            
            # High Traffic Volume on Minor/Local Road
            elif congestion_idx >= 60 and road_type.lower() == "minor":
                # Divert heavy vehicles
                add_rec(
                    title=f"Restrict Heavy Goods Vehicles (HGVs) on {road}",
                    desc=f"Divert logistics vehicles and trucks from the local minor roadway {road} onto major trunk routes.",
                    cat=RecommendationCategory.TRAFFIC_MANAGEMENT,
                    priority=RecommendationPriority.MEDIUM,
                    road=road,
                    region=region,
                    reason=f"Elevated traffic volume ({volume} vehicles/hour) on local road type causing structural and flow capacity constraints.",
                    impact="Improve speed consistency and local road security by 10%.",
                    conf=0.85
                )

        # Rule 2: Evaluate Active Safety Alerts
        for alert in active_alerts:
            road = alert.road_name
            region = "London"
            for k, meta in prediction_service.road_metadata.items():
                if k == road:
                    region = meta.get("region", "London")
                    break

            if alert.alert_type == AlertType.ACCIDENT:
                # Deploy police
                add_rec(
                    title=f"Deploy Traffic Patrol & Emergency Support to {road}",
                    desc=f"Dispatch highway patrol units and emergency vehicle crews to secure lane clearances and control queueing.",
                    cat=RecommendationCategory.EMERGENCY_RESPONSE,
                    priority=RecommendationPriority.CRITICAL,
                    road=road,
                    region=region,
                    reason=f"Active collision reported: '{alert.description}' in incident system logs.",
                    impact="Reduce secondary collision risk by 35% and speed up clearing time by 15 minutes.",
                    conf=0.95
                )
            elif alert.alert_type == AlertType.WEATHER_IMPACT:
                # Public Advisory
                add_rec(
                    title=f"Issue Speed Limit Advisory for {road}",
                    desc=f"Update Variable Message Signs (VMS) to advise speeds of 40 km/h and warn drivers of slippery surface conditions.",
                    cat=RecommendationCategory.PUBLIC_ADVISORY,
                    priority=RecommendationPriority.MEDIUM,
                    road=road,
                    region=region,
                    reason=f"Wet surfaces or severe weather alert: '{alert.description}' flagged on this corridor.",
                    impact="Prevent speed deviations and reduce braking-related queues.",
                    conf=0.89
                )

        # Rule 3: Evaluate Historical Bottlenecks (from 200k dataset)
        if reports_service.df is not None:
            # Let's find top 5 historically congested roads (mean congestion > 65%)
            # We can use reports_service pre-compiled congested list
            df = reports_service.df
            # Vectorized group by once to find congested segments
            congested_list = ["A1", "A3", "FDR Drive"] # default fallbacks
            try:
                # Verify capacity mapping column exists
                if "congestion_index" in df.columns:
                    road_cong = df.groupby("road_name")["congestion_index"].mean()
                    congested_list = list(road_cong[road_cong > 65.0].index[:5])
            except Exception:
                pass

            for road in congested_list:
                meta = prediction_service.road_metadata.get(road, {})
                region = meta.get("region", "London")
                
                # Infrastructure capacity increase
                add_rec(
                    title=f"Propose Carriage Widening / Transit Lane on {road}",
                    desc=f"Add a dedicated bus lane or widen structural lanes at key exit nodes of the corridor.",
                    cat=RecommendationCategory.INFRASTRUCTURE_IMPROVEMENT,
                    priority=RecommendationPriority.MEDIUM,
                    road=road,
                    region=region,
                    reason=f"Historical dataset shows recurring gridlock patterns and structural capacity bottlenecks.",
                    impact="Increase carriage flow rate by 25-30% long term.",
                    conf=0.80
                )
                
                # Safety camera surveillance
                add_rec(
                    title=f"Deploy Traffic Surveillance Enforcement on {road}",
                    desc=f"Install speed cameras and real-time CCTV feeds at congestion junctions to enforce lane compliance.",
                    cat=RecommendationCategory.SAFETY_RECOMMENDATION,
                    priority=RecommendationPriority.LOW,
                    road=road,
                    region=region,
                    reason=f"Recurrent bottlenecking and high vehicle concentration indices observed historically.",
                    impact="Decrease traffic law violations and minor bottleneck queues by 12%.",
                    conf=0.83
                )

        if created_count > 0:
            db.commit()

        return created_count

recommendation_service = RecommendationService()
