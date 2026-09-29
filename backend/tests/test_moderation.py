import pytest


def test_host_moderation_unauthorized_without_token(client):
    create_res = client.post("/api/meetings/instant", json={"title": "Private Sync"})
    meeting_code = create_res.json()["meeting_code"]

    # Try to end without token
    end_res = client.post(f"/api/meetings/{meeting_code}/end")
    assert end_res.status_code == 422  # Missing header

    # Try to end with wrong token
    end_res_wrong = client.post(
        f"/api/meetings/{meeting_code}/end",
        headers={"x-host-token": "invalid_token_123"}
    )
    assert end_res_wrong.status_code == 403


def test_host_moderation_end_meeting_success(client):
    create_res = client.post("/api/meetings/instant", json={"title": "Weekly All-Hands"})
    meeting_code = create_res.json()["meeting_code"]
    host_token = create_res.json()["host_control_token"]

    end_res = client.post(
        f"/api/meetings/{meeting_code}/end",
        headers={"x-host-token": host_token}
    )
    assert end_res.status_code == 200
    assert end_res.json()["status"] == "ended"

    # Verify meeting status is now ended
    get_res = client.get(f"/api/meetings/{meeting_code}")
    assert get_res.json()["status"] == "ended"


def test_host_remove_participant(client):
    create_res = client.post("/api/meetings/instant", json={"title": "Interactive Workshop"})
    meeting_code = create_res.json()["meeting_code"]
    host_token = create_res.json()["host_control_token"]

    # Participant joins
    join_res = client.post(
        f"/api/meetings/{meeting_code}/join",
        json={"display_name": "Rohan", "role": "participant"}
    )
    participant_identity = join_res.json()["participant_identity"]

    # Host removes participant
    kick_res = client.delete(
        f"/api/meetings/{meeting_code}/participants/{participant_identity}",
        headers={"x-host-token": host_token}
    )
    assert kick_res.status_code == 200
    assert kick_res.json()["status"] == "removed"
