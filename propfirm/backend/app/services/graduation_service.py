import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AccountStatus, AccountType
from app.models.account import Account
from app.models.rule_version import RuleVersion

logger = logging.getLogger(__name__)


class AccountGraduationService:
    @staticmethod
    async def graduate_account(db: AsyncSession, account_id: uuid.UUID) -> Account:
        """
        Takes an EVALUATION account that has PASSED and creates a new FUNDED account.
        """
        # Fetch the evaluation account
        eval_account = await db.get(Account, account_id)
        if not eval_account:
            raise ValueError(f"Account {account_id} not found.")

        if eval_account.account_type != AccountType.EVALUATION:
            raise ValueError(f"Account {account_id} is not an EVALUATION account.")

        if eval_account.status != AccountStatus.PASSED:
            raise ValueError(
                f"Account {account_id} must be PASSED to graduate. Current status: {eval_account.status}"
            )

        # Fetch the rule version to get funded capital amount
        rule_version = await db.get(RuleVersion, eval_account.rule_version_id)
        if not rule_version:
            raise ValueError(f"RuleVersion {eval_account.rule_version_id} not found.")

        # Create the new FUNDED account
        funded_account = Account(
            user_id=eval_account.user_id,
            challenge_id=eval_account.challenge_id,
            rule_version_id=eval_account.rule_version_id,
            source_evaluation_account_id=eval_account.id,
            account_type=AccountType.FUNDED,
            status=AccountStatus.ACTIVE,  # Simulating immediate provisioning for POC
            starting_balance=rule_version.funded_capital_amount,
            current_balance=rule_version.funded_capital_amount,
            equity=rule_version.funded_capital_amount,
            high_water_mark=rule_version.funded_capital_amount,
            execution_provider_key="SIMULATED",  # Simulated until real broker API is hooked up
        )

        db.add(funded_account)

        # Mark evaluation account as CLOSED (successfully completed)
        eval_account.status = AccountStatus.CLOSED

        await db.commit()
        await db.refresh(funded_account)

        logger.info(
            f"Successfully graduated evaluation account {eval_account.id} to funded account {funded_account.id}"
        )
        return funded_account
