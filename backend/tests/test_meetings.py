import datetime
import pytest


def test_create_instant_meeting(client):
    response = client.post("/api/meetings/instant", json={"host_name": "Dhruv Singh"})
    assert response.status_code == 201
    data = response.json()
    assert len(data["meeting_code"]) == 10
    assert data["meeting_code"].isdigit()
    assert data["status"] == "live"
    assert data["meeting_type"] == "instant"
    assert data["host_name"] == "Dhruv Singh"
    assert "host_control_token" in data
    assert "invite_url" in data


def test_schedule_meeting_success(client):
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)
    payload = {
        "title": "Quarterly Roadmap Review",
        "description": "Discussion on Q4 deliverables",
        "scheduled_at": future.isoformat(),
        "duration_minutes": 60,
        "host_name": "Dhruv Singh"
    }
    response = client.post("/api/meetings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Quarterly Roadmap Review"
    assert data["status"] == "scheduled"
    assert data["meeting_type"] == "scheduled"
    assert len(data["meeting_code"]) == 10


def test_schedule_meeting_rejects_past_date(client):
    past = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    payload = {
        "title": "Past Meeting",
        "scheduled_at": past.isoformat(),
        "duration_minutes": 30
    }
    response = client.post("/api/meetings", json=payload)
    assert response.status_code == 422


def test_get_meeting_by_code(client):
    create_res = client.post("/api/meetings/instant", json={"title": "Team Sync"})
    meeting_code = create_res.json()["meeting_code"]

    # Query with exact digits
    get_res = client.get(f"/api/meetings/{meeting_code}")
    assert get_res.status_code == 200
    assert get_res.json()["meeting_code"] == meeting_code

    # Query with spaces: "XXX XXX XXXX"
    formatted_code = f"{meeting_code[:3]} {meeting_code[3:6]} {meeting_code[6:]}"
    get_res_spaces = client.get(f"/api/meetings/{formatted_code}")
    assert get_res_spaces.status_code == 200
    assert get_res_spaces.json()["meeting_code"] == meeting_code


def test_get_nonexistent_meeting(client):
    response = client.get("/api/meetings/9999999999")
    assert response.status_code == 404


def test_upcoming_and_recent_filters(client):
    # Create 1 upcoming
    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3)
    client.post("/api/meetings", json={
        "title": "Upcoming Standup",
        "scheduled_at": future.isoformat(),
        "duration_minutes": 30
    })

    # Create 1 instant (live/recent)
    client.post("/api/meetings/instant", json={"title": "Instant Live"})

    upcoming = client.get("/api/meetings?filter=upcoming").json()
    assert len(upcoming) >= 1
    assert all(m["status"] == "scheduled" for m in upcoming)

    recent = client.get("/api/meetings?filter=recent").json()
    assert len(recent) >= 1
    assert any(m["title"] == "Instant Live" for m in recent)


def test_join_meeting_and_token_issuance(client):
    create_res = client.post("/api/meetings/instant", json={"title": "Design Discussion"})
    meeting_code = create_res.json()["meeting_code"]

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
