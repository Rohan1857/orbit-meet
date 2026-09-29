import pytest


def test_host_moderation_unauthorized_without_token(client, auth_headers):
    create_res = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Private Sync"})
    meeting_code = create_res.json()["meeting_code"]

    # Try to end without token or auth
    end_res = client.post(f"/api/meetings/{meeting_code}/end")
    assert end_res.status_code == 403  # Missing owner auth / token rejected with 403 Forbidden

    # Try to end with wrong token
    end_res_wrong = client.post(
        f"/api/meetings/{meeting_code}/end",
        headers={"x-host-token": "invalid_token_123"}
    )
    assert end_res_wrong.status_code == 403


def test_host_moderation_end_meeting_success(client, auth_headers):
    create_res = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Weekly All-Hands"})
    meeting_code = create_res.json()["meeting_code"]

    # Authenticated owner ends meeting
    end_res = client.post(
        f"/api/meetings/{meeting_code}/end",
        headers=auth_headers
    )
    assert end_res.status_code == 200
    assert end_res.json()["status"] == "ended"

    # Verify meeting status is now ended
    get_res = client.get(f"/api/meetings/{meeting_code}")
    assert get_res.json()["status"] == "ended"


def test_host_remove_participant(client, auth_headers):
    create_res = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Interactive Workshop"})
    meeting_code = create_res.json()["meeting_code"]

    # Participant joins without auth
    join_res = client.post(
        f"/api/meetings/{meeting_code}/join",
        json={"display_name": "Rohan", "role": "participant"}
    )
    participant_identity = join_res.json()["participant_identity"]

    # Host removes participant using owner auth
    kick_res = client.delete(
        f"/api/meetings/{meeting_code}/participants/{participant_identity}",
        headers=auth_headers
    )
    assert kick_res.status_code == 200
    assert kick_res.json()["status"] == "removed"


def test_participant_forged_host_token_rejected(client, auth_headers):
    """
    A participant sends a host-only moderation request using a deliberately
    incorrect/forged host_control_token.
    Expected result: 403 Forbidden on all host-only endpoints.
    """
    create_res = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Security Audit Session"})
    meeting_code = create_res.json()["meeting_code"]

    # Participant joins without auth
    join_res = client.post(
        f"/api/meetings/{meeting_code}/join",
        json={"display_name": "Eve Malicious", "role": "participant"}
    )
    participant_identity = join_res.json()["participant_identity"]

    forged_tokens = [
        "forged_token_hex_99999999999999999999",
        "attacker-controlled-token",
        "00000000000000000000000000000000",
    ]

    for token in forged_tokens:
        # 1. Attempt Mute-All with forged token (no owner auth)
        mute_res = client.post(
            f"/api/meetings/{meeting_code}/mute-all",
            headers={"x-host-token": token}
        )
        assert mute_res.status_code == 403

        # 2. Attempt Remove Participant with forged token
        remove_res = client.delete(
            f"/api/meetings/{meeting_code}/participants/{participant_identity}",
            headers={"x-host-token": token}
        )
        assert remove_res.status_code == 403

        # 3. Attempt End Meeting with forged token
        end_res = client.post(
            f"/api/meetings/{meeting_code}/end",
            headers={"x-host-token": token}
        )
        assert end_res.status_code == 403


def test_host_mute_single_participant_success(client, auth_headers, monkeypatch):
    create_res = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Mute Test"})
    meeting_code = create_res.json()["meeting_code"]

    # Participant joins
    join_res = client.post(
        f"/api/meetings/{meeting_code}/join",
        json={"display_name": "Alice", "role": "participant"}
    )
    participant_identity = join_res.json()["participant_identity"]

    # Mock LiveKitService.mute_participant
    async def mock_mute(room_name, identity, muted=True):
        return True

    from app.services.livekit_service import LiveKitService
    monkeypatch.setattr(LiveKitService, "mute_participant", mock_mute)

    # Host mutes Alice
    mute_res = client.post(
        f"/api/meetings/{meeting_code}/participants/{participant_identity}/mute",
        headers=auth_headers
    )
    assert mute_res.status_code == 200
    data = mute_res.json()
    assert data["status"] == "muted"
    assert data["identity"] == participant_identity
    assert data["success"] is True


def test_host_mute_all_participants_success(client, auth_headers, monkeypatch):
    create_res = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Mute All Test"})
    meeting_code = create_res.json()["meeting_code"]

    # Mock LiveKitService.mute_all_participants
    async def mock_mute_all(room_name, host_identity=None):
        return 2

    from app.services.livekit_service import LiveKitService
    monkeypatch.setattr(LiveKitService, "mute_all_participants", mock_mute_all)

    # Host executes Mute All
    mute_all_res = client.post(
        f"/api/meetings/{meeting_code}/mute-all",
        headers=auth_headers
    )
    assert mute_all_res.status_code == 200
    data = mute_all_res.json()
    assert data["status"] == "muted_all"
    assert data["meeting_code"] == meeting_code
    assert data["muted_count"] == 2


def test_non_owner_mute_rejected_with_403(client, auth_headers):
    # Owner creates meeting
    create_res = client.post("/api/meetings/instant", headers=auth_headers, json={"title": "Private Mute Room"})
    meeting_code = create_res.json()["meeting_code"]

    # Attacker registers
    attacker = client.post("/api/auth/register", json={
        "email": "attacker_mute@example.com",
        "password": "Password123!",
        "display_name": "Attacker"
    }).json()
    attacker_token = attacker["token"]

    # Non-owner attempts single mute
    res1 = client.post(
        f"/api/meetings/{meeting_code}/participants/user_someone_1234/mute",
        headers={"Authorization": f"Bearer {attacker_token}"}
    )
    assert res1.status_code == 403

    # Non-owner attempts mute all
    res2 = client.post(
        f"/api/meetings/{meeting_code}/mute-all",
        headers={"Authorization": f"Bearer {attacker_token}"}
    )
    assert res2.status_code == 403

    # Guest without auth attempts mute all
    res3 = client.post(f"/api/meetings/{meeting_code}/mute-all")
    assert res3.status_code == 403

