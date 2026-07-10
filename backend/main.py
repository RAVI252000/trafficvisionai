import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.auth import router as auth_router
from api.users import router as users_router
from api.traffic import router as traffic_router
from api.congestion import router as congestion_router

app = FastAPI(
    title="TrafficVision AI Backend",
    description="Enterprise-grade traffic management and congestion prediction API",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "TrafficVision AI API",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
