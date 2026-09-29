import datetime
from app.models.meeting import Meeting


def test_instant_meeting_assigned_to_authenticated_user(client):
    reg = client.post("/api/auth/register", json={
        "email": "owner1@example.com",
        "password": "Password123!",
        "display_name": "Owner One"
    }).json()
    token = reg["token"]
    user_id = reg["user"]["id"]

    res = client.post(
        "/api/meetings/instant",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Owner 1 Meeting"}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["owner_user_id"] == user_id
    assert data["host_name"] == "Owner One"


def test_scheduled_meeting_assigned_to_authenticated_user(client):
    reg = client.post("/api/auth/register", json={
        "email": "owner2@example.com",
        "password": "Password123!",
        "display_name": "Owner Two"
    }).json()
    token = reg["token"]
    user_id = reg["user"]["id"]

    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)
    res = client.post(
        "/api/meetings",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Owner 2 Planning",
            "scheduled_at": future.isoformat(),
            "duration_minutes": 30
        }
    )
    assert res.status_code == 201
    data = res.json()
    assert data["owner_user_id"] == user_id
    assert data["host_name"] == "Owner Two"


def test_dashboard_scoped_to_owner(client):
    # User A
    user_a = client.post("/api/auth/register", json={
        "email": "userA@example.com",
        "password": "Password123!",
        "display_name": "User A"
    }).json()
    token_a = user_a["token"]

    # User B
    user_b = client.post("/api/auth/register", json={
        "email": "userB@example.com",
        "password": "Password123!",
        "display_name": "User B"
    }).json()
    token_b = user_b["token"]

    future = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)

    # User A schedules meeting
    client.post(
        "/api/meetings",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"title": "Meeting for A only", "scheduled_at": future.isoformat(), "duration_minutes": 30}
    )

    # User B schedules meeting
    client.post(
        "/api/meetings",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"title": "Meeting for B only", "scheduled_at": future.isoformat(), "duration_minutes": 45}
    )

    # User A checks upcoming
    list_a = client.get("/api/meetings?filter=upcoming", headers={"Authorization": f"Bearer {token_a}"}).json()
    titles_a = [m["title"] for m in list_a]
    assert "Meeting for A only" in titles_a
    assert "Meeting for B only" not in titles_a

    # User B checks upcoming
    list_b = client.get("/api/meetings?filter=upcoming", headers={"Authorization": f"Bearer {token_b}"}).json()
    titles_b = [m["title"] for m in list_b]
    assert "Meeting for B only" in titles_b
    assert "Meeting for A only" not in titles_b


def test_cross_user_moderation_rejected_with_403(client):
    # User A creates Meeting A
    user_a = client.post("/api/auth/register", json={
        "email": "hostA@example.com",
        "password": "Password123!",
        "display_name": "Host A"
    }).json()
    token_a = user_a["token"]

    create_res = client.post(
        "/api/meetings/instant",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"title": "Host A Meeting"}
    ).json()
    meeting_code = create_res["meeting_code"]
    host_token = create_res["host_control_token"]

    # User B registers
    user_b = client.post("/api/auth/register", json={
        "email": "attackerB@example.com",
        "password": "Password123!",
        "display_name": "Attacker B"
    }).json()
    token_b = user_b["token"]

    # User B attempts to end User A's meeting with User B's token
    res1 = client.post(
        f"/api/meetings/{meeting_code}/end",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res1.status_code == 403

    # User B attempts to end User A's meeting even if passing host_control_token
    res2 = client.post(
        f"/api/meetings/{meeting_code}/end",
        headers={
            "Authorization": f"Bearer {token_b}",
            "x-host-token": host_token
        }
    )
    assert res2.status_code == 403

    # User B attempts mute-all on User A's meeting
    res3 = client.post(
        f"/api/meetings/{meeting_code}/mute-all",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res3.status_code == 403

    # But User A (the genuine owner) CAN end their meeting
    res_owner = client.post(
        f"/api/meetings/{meeting_code}/end",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_owner.status_code == 200
    assert res_owner.json()["status"] == "ended"


def test_guest_can_join_without_auth(client):
    # Authenticated user creates meeting
    host = client.post("/api/auth/register", json={
        "email": "host_for_guest@example.com",
        "password": "Password123!",
        "display_name": "Host For Guest"
    }).json()
    token = host["token"]

    meeting = client.post(
        "/api/meetings/instant",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Open Meeting"}
    ).json()
    code = meeting["meeting_code"]

    # Completely unauthenticated guest joins with only display name
    join_res = client.post(f"/api/meetings/{code}/join", json={
        "display_name": "Alice Guest",
        "role": "participant"
    })
    assert join_res.status_code == 200
    data = join_res.json()
    assert data["role"] == "participant"
    assert data["display_name"] == "Alice Guest"
    assert data["participant_identity"].startswith("user_aliceguest_")
    assert "token" in data
