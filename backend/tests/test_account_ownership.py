import pytest
from fastapi import HTTPException

from app.api.accounts import _get_owned_account
from app.api.orders import _assert_account_owner
from app.core.constants import Role
from app.models.user import User

from .conftest import make_account


async def _get_owner(db_session, account) -> User:
    return await db_session.get(User, account.user_id)


@pytest.mark.asyncio
async def test_owner_can_load_own_account(db_session, account):
    owner = await _get_owner(db_session, account)
    loaded = await _get_owned_account(db_session, account.id, owner)
    assert loaded.id == account.id


@pytest.mark.asyncio
async def test_stranger_gets_404_not_403(db_session, account):
    other_account = await make_account(db_session, starting_balance=account.starting_balance)
    stranger = await _get_owner(db_session, other_account)

    with pytest.raises(HTTPException) as exc_info:
        await _get_owned_account(db_session, account.id, stranger)

    # 404, not 403 -- a caller who doesn't own the account shouldn't be able
    # to distinguish "not yours" from "doesn't exist" via the status code.
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_admin_can_load_any_account(db_session, account):
    admin = User(
        email="admin-ownership-test@example.com",
        password_hash="x",
        role=Role.ADMIN,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)

    loaded = await _get_owned_account(db_session, account.id, admin)
    assert loaded.id == account.id


@pytest.mark.asyncio
async def test_missing_account_is_404(db_session, account):
    owner = await _get_owner(db_session, account)
    import uuid

    with pytest.raises(HTTPException) as exc_info:
        await _get_owned_account(db_session, uuid.uuid4(), owner)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_orders_ownership_check_matches_accounts(db_session, account):
    other_account = await make_account(db_session, starting_balance=account.starting_balance)
    stranger = await _get_owner(db_session, other_account)

    with pytest.raises(HTTPException) as exc_info:
        await _assert_account_owner(db_session, account.id, stranger)
    assert exc_info.value.status_code == 404

    owner = await _get_owner(db_session, account)
    await _assert_account_owner(db_session, account.id, owner)  # should not raise
