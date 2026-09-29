import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models.meeting import Meeting
from app.models.user import User
from app.routers.meetings import router as meetings_router
from app.routers.moderation import router as moderation_router
from app.routers.auth import router as auth_router
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 0. Enforce explicit strong JWT_SECRET in production environment
    if settings.environment.lower() == "production":
        insecure_default = "orbitmeet-secure-default-jwt-secret-key-32chars"
        if not settings.jwt_secret or settings.jwt_secret == insecure_default:
            raise RuntimeError(
                "FATAL: JWT_SECRET must be explicitly configured in production environment! Default fallback is forbidden."
            )

    # 1. Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # 2. Add owner_user_id to meetings if migrating legacy database
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(meetings)"))
            cols = [r[1] for r in res.fetchall()]
            if "owner_user_id" not in cols:
                conn.execute(text("ALTER TABLE meetings ADD COLUMN owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL"))
                conn.commit()
        except Exception as e:
            print(f"Schema column check: {e}")

    # 3. Auto-seed if empty
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

app.include_router(auth_router)
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
