import pytest

from app.core.config import settings
from app.core.constants import Role
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)
from app.dependencies.auth import get_current_user
from app.models.user import User


def test_access_token_round_trips():
    token = create_access_token("user-123")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"


def test_refresh_token_round_trips():
    token = create_refresh_token("user-123")
    payload = decode_refresh_token(token)
    assert payload["sub"] == "user-123"


def test_refresh_token_rejected_as_access_token():
    # A refresh token must not be usable to authenticate API calls directly --
    # it should only ever be exchanged via POST /auth/refresh.
    refresh_token = create_refresh_token("user-123")
    with pytest.raises(ValueError):
        decode_access_token(refresh_token)


def test_access_token_rejected_as_refresh_token():
    access_token = create_access_token("user-123")
    with pytest.raises(ValueError):
        decode_refresh_token(access_token)


@pytest.mark.asyncio
async def test_get_current_user_falls_back_to_demo_user_with_no_header(db_session):
    # No Authorization header at all -- preserves the zero-login direct
    # terminal/API access that existed before real auth was restored.
    demo_user = User(
        email=settings.DEMO_TRADER_EMAIL,
        password_hash="x",
        role=Role.TRADER,
        is_active=True,
    )
    db_session.add(demo_user)
    await db_session.commit()

    resolved = await get_current_user(db=db_session, authorization=None)
    assert resolved.email == settings.DEMO_TRADER_EMAIL


@pytest.mark.asyncio
async def test_get_current_user_resolves_a_real_bearer_token(db_session):
    # A valid token for a real (non-demo) user must resolve to that user,
    # not the demo user -- this is what actually isolates one trader's
    # accounts/orders from another's.
    user = User(
        email="realtrader@example.com",
        password_hash="x",
        role=Role.TRADER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(str(user.id))
    resolved = await get_current_user(db=db_session, authorization=f"Bearer {token}")
    assert resolved.id == user.id


@pytest.mark.asyncio
async def test_get_current_user_rejects_garbage_token(db_session):
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(db=db_session, authorization="Bearer not-a-real-token")
    assert exc_info.value.status_code == 401
