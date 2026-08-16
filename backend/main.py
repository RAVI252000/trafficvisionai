import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.auth import router as auth_router
from api.users import router as users_router
from api.traffic import router as traffic_router
from api.congestion import router as congestion_router
from api.prediction import router as prediction_router
from api.v1_reports import router as reports_router
from api.v1_forecast import router as forecast_router
from api.v1_routes import router as routes_router
from api.v1_traffic_api import router as traffic_api_router
from api.alerts import router as alerts_router
from analytics.router import router as analytics_router
from heatmap.router import router as heatmap_router
from trends.router import router as trends_router
from recommendations.router import router as recommendations_router
from reports.router import router as reports_router

app = FastAPI(
    title="TrafficVision AI Backend",
    description="Enterprise-grade traffic management and congestion prediction API",
    version="1.0.0"
)

# CORS configuration
origins = [orig.strip() for orig in settings.ALLOWED_ORIGINS.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(traffic_router)
app.include_router(congestion_router)
app.include_router(prediction_router)
app.include_router(reports_router)
app.include_router(forecast_router)
app.include_router(routes_router)
app.include_router(traffic_api_router)
app.include_router(alerts_router)
app.include_router(analytics_router)
app.include_router(heatmap_router)
app.include_router(trends_router)
app.include_router(recommendations_router)
app.include_router(reports_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "TrafficVision AI API",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
