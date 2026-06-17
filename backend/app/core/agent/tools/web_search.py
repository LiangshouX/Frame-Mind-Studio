"""Web search tool for agents."""

import httpx
import logging

logger = logging.getLogger(__name__)


async def web_search(query: str, max_results: int = 5) -> list[dict]:
    """Search the web for information. Returns list of {title, url, snippet}."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Use a simple search API (placeholder — integrate with actual search provider)
            response = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1},
            )
            if response.status_code == 200:
                data = response.json()
                results = []
                for item in data.get("RelatedTopics", [])[:max_results]:
                    if "Text" in item:
                        results.append({
                            "title": item.get("Text", "")[:100],
                            "url": item.get("FirstURL", ""),
                            "snippet": item.get("Text", ""),
                        })
                return results
    except Exception as e:
        logger.warning(f"Web search failed: {e}")
    return []
