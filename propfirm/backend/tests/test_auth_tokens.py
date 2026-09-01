import pytest

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)


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
