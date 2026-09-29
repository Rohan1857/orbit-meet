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
    async def mute_participant(cls, room_name: str, identity: str, muted: bool = True) -> bool:
        """Mutes all published audio tracks for a given participant."""
        api_key, api_secret, url = cls.get_api_credentials()
        if not settings.livekit_api_key or not settings.livekit_api_secret:
            return True
        try:
            async with api.LiveKitAPI(url, api_key, api_secret) as lk:
                participant = await lk.room.get_participant(
                    api.RoomParticipantIdentity(room=room_name, identity=identity)
                )
                muted_any = False
                for track in participant.tracks:
                    if track.type == api.TrackType.AUDIO or track.source == api.TrackSource.MICROPHONE:
                        await lk.room.mute_published_track(
                            api.MuteRoomTrackRequest(
                                room=room_name,
                                identity=identity,
                                track_sid=track.sid,
                                muted=muted
                            )
                        )
                        muted_any = True
                return muted_any or True
        except Exception:
            return False

    @classmethod
    async def mute_all_participants(cls, room_name: str, host_identity: str = None) -> int:
        """Mutes all published audio tracks for all non-host participants in a room."""
        api_key, api_secret, url = cls.get_api_credentials()
        if not settings.livekit_api_key or not settings.livekit_api_secret:
            return 0
        muted_count = 0
        try:
            async with api.LiveKitAPI(url, api_key, api_secret) as lk:
                response = await lk.room.list_participants(
                    api.ListParticipantsRequest(room=room_name)
                )
                for p in response.participants:
                    # Skip the host
                    if host_identity and p.identity == host_identity:
                        continue
                    if p.permission and p.permission.room_admin:
                        continue
                    if p.identity.startswith("host_"):
                        continue

                    for track in p.tracks:
                        if track.type == api.TrackType.AUDIO or track.source == api.TrackSource.MICROPHONE:
                            try:
                                await lk.room.mute_published_track(
                                    api.MuteRoomTrackRequest(
                                        room=room_name,
                                        identity=p.identity,
                                        track_sid=track.sid,
                                        muted=True
                                    )
                                )
                                muted_count += 1
                            except Exception:
                                pass
            return muted_count
        except Exception:
            return 0
