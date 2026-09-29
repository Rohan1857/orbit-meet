import datetime
import secrets
from app.database import Base, SessionLocal, engine
from app.models.meeting import Meeting
from app.models.participant import ParticipantSession


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_count = db.query(Meeting).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} meetings. Skipping seed.")
            return

        now = datetime.datetime.now(datetime.timezone.utc)

        sample_meetings = [
            # Upcoming Meeting 1
            Meeting(
                meeting_code="8492019482",
                title="Design Review — Mobile Meeting Controls",
                description="Reviewing bottom sheet behavior and toolbar touch targets on iOS/Android.",
                host_name="Rohan",
                meeting_type="scheduled",
                scheduled_at=now + datetime.timedelta(days=1, hours=3),
                duration_minutes=45,
                status="scheduled",
                host_control_token=secrets.token_hex(16),
                created_at=now - datetime.timedelta(days=1)
            ),
            # Upcoming Meeting 2
            Meeting(
                meeting_code="5938102941",
                title="Placement Team Weekly Sync",
                description="Status update on upcoming recruiter drives and mock interview scheduling.",
                host_name="Rohan",
                meeting_type="scheduled",
                scheduled_at=now + datetime.timedelta(days=2, hours=5),
                duration_minutes=60,
                status="scheduled",
                host_control_token=secrets.token_hex(16),
                created_at=now - datetime.timedelta(hours=12)
            ),
            # Recent Meeting 1
            Meeting(
                meeting_code="7194028519",
                title="Audio Pipeline Debug Session",
                description="Diagnosing WebRTC STUN/TURN ICE candidate gathering on restrictive NATs.",
                host_name="Rohan",
                meeting_type="instant",
                status="ended",
                host_control_token=secrets.token_hex(16),
                created_at=now - datetime.timedelta(hours=4),
                started_at=now - datetime.timedelta(hours=4),
                ended_at=now - datetime.timedelta(hours=3, minutes=15),
                duration_minutes=45
            ),
            # Recent Meeting 2
            Meeting(
                meeting_code="3829104720",
                title="Research Check-in: Agent Architecture",
                description="Discussion on autonomous task decomposition and evaluation benchmarks.",
                host_name="Rohan",
                meeting_type="scheduled",
                status="ended",
                host_control_token=secrets.token_hex(16),
                created_at=now - datetime.timedelta(days=2),
                started_at=now - datetime.timedelta(days=1, hours=2),
                ended_at=now - datetime.timedelta(days=1, hours=1),
                duration_minutes=60
            )
        ]

        db.add_all(sample_meetings)
        db.commit()
        print(f"Successfully seeded {len(sample_meetings)} realistic meetings into SQLite.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
