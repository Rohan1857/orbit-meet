import datetime
from livekit import api
from app.config import settings


class LiveKitService:
    @staticmethod
    def get_api_credentials():
        api_key = settings.livekit_api_key or "devkey_orbitmeet_local"
        api_secret = settings.livekit_api_secret or "devsecret_orbitmeet_local_32bytes_long!"
        url = settings.livekit_url or "wss://orbitmeet.livekit.cloud"
        return api_key, api_secret, url

    @classmethod
    def generate_token(
        cls,
        room_name: str,
        participant_identity: str,
        display_name: str,
        is_host: bool = False
    ) -> str:
        api_key, api_secret, _ = cls.get_api_credentials()
        grants = api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
            room_admin=is_host,
            room_record=False
        )
        token = (
            api.AccessToken(api_key, api_secret)
            .with_identity(participant_identity)
            .with_name(display_name)
            .with_grants(grants)
            .with_ttl(datetime.timedelta(hours=6))
        )
        return token.to_jwt()

    @classmethod
    async def remove_participant(cls, room_name: str, identity: str) -> bool:
        api_key, api_secret, url = cls.get_api_credentials()
        if not settings.livekit_api_key or not settings.livekit_api_secret:
            return True
        try:
            async with api.LiveKitAPI(url, api_key, api_secret) as lk:
                await lk.room.remove_participant(
                    api.RoomParticipantIdentity(room=room_name, identity=identity)
                )
            return True
        except Exception:
            return False

    @classmethod
    async def mute_participant_track(cls, room_name: str, identity: str, track_sid: str, muted: bool = True) -> bool:
        api_key, api_secret, url = cls.get_api_credentials()
        if not settings.livekit_api_key or not settings.livekit_api_secret:
            return True
        try:
            async with api.LiveKitAPI(url, api_key, api_secret) as lk:
                await lk.room.mute_published_track(
                    api.MuteRoomTrackRequest(
                        room=room_name,
                        identity=identity,
                        track_sid=track_sid,
                        muted=muted
                    )
                )
            return True
        except Exception:
            return False

    @classmethod
    async def mute_participant(cls, room_name: str, identity: str, muted: bool = True) -> dict:
        """Mutes all published audio tracks for a given participant via LiveKit server API."""
        api_key, api_secret, url = cls.get_api_credentials()
        if not settings.livekit_api_key or not settings.livekit_api_secret:
            raise RuntimeError("LiveKit credentials not configured")

        async with api.LiveKitAPI(url, api_key, api_secret) as lk:
            try:
                participant = await lk.room.get_participant(
                    api.RoomParticipantIdentity(room=room_name, identity=identity)
                )
            except Exception as e:
                return {"status": "not_found", "identity": identity, "detail": str(e)}

            if not participant:
                return {"status": "not_found", "identity": identity, "detail": "Participant not found"}

            audio_tracks = [
                track for track in participant.tracks
                if track.type == api.TrackType.AUDIO or track.source == api.TrackSource.MICROPHONE
            ]
            if not audio_tracks:
                return {"status": "no_audio_tracks", "identity": identity, "detail": "No audio tracks published"}

            all_already_muted = all(track.muted for track in audio_tracks)
            if all_already_muted and muted:
                return {"status": "already_muted", "identity": identity, "muted": True, "tracks_muted": 0}

            muted_count = 0
            for track in audio_tracks:
                await lk.room.mute_published_track(
                    api.MuteRoomTrackRequest(
                        room=room_name,
                        identity=identity,
                        track_sid=track.sid,
                        muted=muted
                    )
                )
                muted_count += 1

            return {"status": "muted", "identity": identity, "muted": muted, "tracks_muted": muted_count}

    @classmethod
    async def mute_all_participants(cls, room_name: str, host_identity: str = None) -> dict:
        """Mutes all published audio tracks for all non-host participants in a room."""
        api_key, api_secret, url = cls.get_api_credentials()
        if not settings.livekit_api_key or not settings.livekit_api_secret:
            raise RuntimeError("LiveKit credentials not configured")

        async with api.LiveKitAPI(url, api_key, api_secret) as lk:
            try:
                response = await lk.room.list_participants(
                    api.ListParticipantsRequest(room=room_name)
                )
            except Exception as e:
                # If room is not currently active on LiveKit SFU, return clean success with 0 participants
                if "not_found" in str(e).lower() or "does not exist" in str(e).lower():
                    return {
                        "status": "muted_all",
                        "room": room_name,
                        "muted_participants": 0,
                        "skipped_participants": 0,
                        "failed_participants": 0,
                        "total_participants": 0,
                        "detail": "Room has no active participants"
                    }
                raise

            muted_participants = 0
            skipped_participants = 0
            failed_participants = 0

            for p in response.participants:
                # Skip the host
                if host_identity and p.identity == host_identity:
                    skipped_participants += 1
                    continue
                if p.identity.startswith("host_") or getattr(p.permission, "room_admin", False):
                    skipped_participants += 1
                    continue

                audio_tracks = [
                    track for track in p.tracks
                    if track.type == api.TrackType.AUDIO or track.source == api.TrackSource.MICROPHONE
                ]
                if not audio_tracks or all(track.muted for track in audio_tracks):
                    skipped_participants += 1
                    continue

                participant_muted = False
                for track in audio_tracks:
                    if not track.muted:
                        try:
                            await lk.room.mute_published_track(
                                api.MuteRoomTrackRequest(
                                    room=room_name,
                                    identity=p.identity,
                                    track_sid=track.sid,
                                    muted=True
                                )
                            )
                            participant_muted = True
                        except Exception:
                            pass
                if participant_muted:
                    muted_participants += 1
                else:
                    failed_participants += 1

            return {
                "status": "muted_all",
                "room": room_name,
                "muted_participants": muted_participants,
                "skipped_participants": skipped_participants,
                "failed_participants": failed_participants,
                "total_participants": len(response.participants)
            }
