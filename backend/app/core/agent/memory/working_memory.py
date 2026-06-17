"""Working memory (LangChain ChatMemory) for conversation context."""

from langchain_core.chat_history import InMemoryChatMessageHistory


class WorkingMemory:
    """Per-session working memory using LangChain's in-memory history."""

    def __init__(self):
        self._stores: dict[str, InMemoryChatMessageHistory] = {}

    def get_history(self, session_id: str) -> InMemoryChatMessageHistory:
        if session_id not in self._stores:
            self._stores[session_id] = InMemoryChatMessageHistory()
        return self._stores[session_id]

    def clear(self, session_id: str):
        if session_id in self._stores:
            del self._stores[session_id]


# Global instance
working_memory = WorkingMemory()
