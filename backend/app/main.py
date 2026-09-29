import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models.meeting import Meeting
from app.routers.meetings import router as meetings_router
from app.routers.moderation import router as moderation_router
from app.seed import seed_database

# Create DB tables
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Auto-seed if empty
    db = SessionLocal()
    try:
        if db.query(Meeting).count() == 0:
            seed_database()
    finally:
        db.close()
    yield

app = FastAPI(
    title="OrbitMeet API",
    description="Zoom-style Video Conferencing Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
origins = [
    settings.frontend_origin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings_router)
app.include_router(moderation_router)



@app.get("/api/health", tags=["health"])
def health_check():
    return {
        "status": "ok",
        "service": "OrbitMeet API",
        "database": "connected",
        "environment": settings.environment,
        "time": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
