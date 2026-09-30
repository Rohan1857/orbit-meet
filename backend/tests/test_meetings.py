import datetime
import pytest


def test_unauthenticated_requests_return_401(client):
    # Instant meeting requires auth
    res_instant = client.post("/api/meetings/instant", json={"title": "Unauthorized Instant"})
    assert res_instant.status_code == 401

    # Scheduling requires auth
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)
    res_sched = client.post("/api/meetings", json={
        "title": "Unauthorized Schedule",
        "scheduled_at": future.isoformat(),
        "duration_minutes": 30
    })
    assert res_sched.status_code == 401

    # Upcoming list requires auth
    res_upcoming = client.get("/api/meetings?filter=upcoming")
    assert res_upcoming.status_code == 401

    # Recent list requires auth
    res_recent = client.get("/api/meetings?filter=recent")
    assert res_recent.status_code == 401


def test_create_instant_meeting(client, auth_headers):
    response = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Quick Sync"})
    assert response.status_code == 201
    data = response.json()
    assert len(data["meeting_code"]) == 10
    assert data["meeting_code"].isdigit()
    assert data["status"] == "live"
    assert data["meeting_type"] == "instant"
    assert data["host_name"] == "Rohan"
    assert data["owner_user_id"] is not None
    assert "host_control_token" in data
    assert "invite_url" in data


def test_schedule_meeting_success(client, auth_headers):
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)
    payload = {
        "title": "Quarterly Roadmap Review",
        "description": "Discussion on Q4 deliverables",
        "scheduled_at": future.isoformat(),
        "duration_minutes": 60,
    }
    response = client.post("/api/meetings", headers=auth_headers, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Quarterly Roadmap Review"
    assert data["status"] == "scheduled"
    assert data["meeting_type"] == "scheduled"
    assert data["owner_user_id"] is not None
    assert len(data["meeting_code"]) == 10


def test_schedule_meeting_rejects_past_date(client, auth_headers):
    past = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    payload = {
        "title": "Past Meeting",
        "scheduled_at": past.isoformat(),
        "duration_minutes": 30
    }
    response = client.post("/api/meetings", headers=auth_headers, json=payload)
    assert response.status_code == 422


def test_get_meeting_by_code(client, auth_headers):
    create_res = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Team Sync"})
    meeting_code = create_res.json()["meeting_code"]

    # Public/Guest query with exact digits without any auth
    get_res = client.get(f"/api/meetings/{meeting_code}")
    assert get_res.status_code == 200
    assert get_res.json()["meeting_code"] == meeting_code
    assert get_res.json().get("host_control_token") is None

    # Public/Guest query with spaces: "XXX XXX XXXX"
    formatted_code = f"{meeting_code[:3]} {meeting_code[3:6]} {meeting_code[6:]}"
    get_res_spaces = client.get(f"/api/meetings/{formatted_code}")
    assert get_res_spaces.status_code == 200
    assert get_res_spaces.json()["meeting_code"] == meeting_code


def test_get_nonexistent_meeting(client):
    response = client.get("/api/meetings/9999999999")
    assert response.status_code == 404


def test_upcoming_and_recent_filters(client, auth_headers):
    # Create 1 upcoming
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)
    client.post("/api/meetings", headers=auth_headers, json={
        "title": "Upcoming Standup",
        "scheduled_at": future.isoformat(),
        "duration_minutes": 30
    })

    # Create 1 instant (live/recent)
    client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Instant Live"})

    upcoming = client.get("/api/meetings?filter=upcoming", headers=auth_headers).json()
    assert len(upcoming) >= 1
    assert all(m["status"] == "scheduled" for m in upcoming)

    recent = client.get("/api/meetings?filter=recent", headers=auth_headers).json()
    assert len(recent) >= 1
    assert any(m["title"] == "Instant Live" for m in recent)


def test_join_meeting_and_token_issuance(client, auth_headers):
    create_res = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Design Discussion"})
    meeting_code = create_res.json()["meeting_code"]

    # Guest joins without any auth header
    join_res = client.post(
        f"/api/meetings/{meeting_code}/join",
        json={"display_name": "Ayan", "role": "participant"}
    )
    assert join_res.status_code == 200
    data = join_res.json()
    assert data["display_name"] == "Ayan"
    assert data["role"] == "participant"
    assert "token" in data
    assert len(data["token"]) > 20
    assert "livekit_url" in data

    # Leave meeting
    leave_res = client.post(
        f"/api/meetings/{meeting_code}/leave",
        json={"participant_identity": data["participant_identity"]}
    )
    assert leave_res.status_code == 200


def test_meeting_duration_limit_expiry(client, auth_headers, db_session):
    from app.models.meeting import Meeting

    # Create meeting with 2-minute duration
    res = client.post(
        "/api/meetings/instant",
        json={"title": "2 Min Test Meeting"},
        headers=auth_headers
    )
    assert res.status_code == 201
    meeting_code = res.json()["meeting_code"]

    # Manually backdate started_at by 3 minutes and set duration_minutes=2
    meeting = db_session.query(Meeting).filter(Meeting.meeting_code == meeting_code).first()
    assert meeting is not None
    meeting.duration_minutes = 2
    meeting.status = "live"
    meeting.started_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=3)
    db_session.commit()

    # Querying get_meeting should detect expired duration and auto-end meeting
    get_res = client.get(f"/api/meetings/{meeting_code}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "ended"

    # Joining should reject with 400
    join_res = client.post(
        f"/api/meetings/{meeting_code}/join",
        json={"display_name": "Late Joiner", "role": "participant"}
    )
    assert join_res.status_code == 400
    assert "ended" in join_res.json()["detail"].lower()
