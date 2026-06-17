"""ChromaDB project memory store."""

import chromadb
from app.core.config import get_settings


def get_chroma_client() -> chromadb.HttpClient:
    settings = get_settings()
    return chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)


def get_or_create_collection(name: str):
    client = get_chroma_client()
    return client.get_or_create_collection(name=name)


class ProjectMemory:
    """Manages project-specific memory in ChromaDB."""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self._story_bible = None
        self._characters = None
        self._foreshadows = None

    @property
    def story_bible(self):
        if not self._story_bible:
            self._story_bible = get_or_create_collection("story_bible")
        return self._story_bible

    @property
    def characters(self):
        if not self._characters:
            self._characters = get_or_create_collection("characters")
        return self._characters

    @property
    def foreshadows(self):
        if not self._foreshadows:
            self._foreshadows = get_or_create_collection("foreshadows")
        return self._foreshadows

    def add_setting(self, doc_id: str, text: str, metadata: dict | None = None):
        meta = {"project_id": self.project_id, "type": "world_setting", **(metadata or {})}
        self.story_bible.add(documents=[text], metadatas=[meta], ids=[f"setting_{doc_id}"])

    def add_character(self, char_id: str, text: str, metadata: dict | None = None):
        meta = {"project_id": self.project_id, **(metadata or {})}
        self.characters.add(documents=[text], metadatas=[meta], ids=[f"char_{char_id}_desc"])

    def add_foreshadow(self, fs_id: str, text: str, metadata: dict | None = None):
        meta = {"project_id": self.project_id, **(metadata or {})}
        self.foreshadows.add(documents=[text], metadatas=[meta], ids=[f"foreshadow_{fs_id}"])

    def search_settings(self, query: str, n_results: int = 5) -> list[dict]:
        results = self.story_bible.query(
            query_texts=[query],
            n_results=n_results,
            where={"project_id": self.project_id},
        )
        return results

    def search_characters(self, query: str, n_results: int = 5) -> list[dict]:
        results = self.characters.query(
            query_texts=[query],
            n_results=n_results,
            where={"project_id": self.project_id},
        )
        return results

    def search_foreshadows(self, resolved: bool | None = None, n_results: int = 20) -> list[dict]:
        where = {"project_id": self.project_id}
        if resolved is not None:
            where["resolved"] = resolved
        results = self.foreshadows.query(
            query_texts=[""],
            n_results=n_results,
            where=where,
        )
        return results
