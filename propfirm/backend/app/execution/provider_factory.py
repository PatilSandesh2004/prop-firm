from app.core.constants import AccountType
from app.execution.base import ExecutionProvider
from app.execution.matching_engine import matching_engine
from app.execution.upstox_broker import UpstoxExecutionProvider

upstox_broker = UpstoxExecutionProvider()


class ExecutionProviderFactory:
    @staticmethod
    def get_provider(account_type: AccountType) -> ExecutionProvider:
        """Fetch the provider for the current request."""
        if account_type == AccountType.FUNDED:
            return upstox_broker
        return matching_engine
