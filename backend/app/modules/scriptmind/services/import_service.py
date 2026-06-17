"""File and URL import service."""

import chardet
import httpx
import trafilatura
import logging

logger = logging.getLogger(__name__)

MAX_FILE_SIZE_CHARS = 500_000  # 50万字


def detect_encoding(raw_bytes: bytes) -> str:
    result = chardet.detect(raw_bytes)
    return result.get("encoding", "utf-8") or "utf-8"


def parse_txt(content: str) -> dict:
    """Parse plain text into structured chapters."""
    lines = content.strip().split("\n")
    chapters = []
    current_chapter = {"title": "第1章", "content": []}

    for line in lines:
        stripped = line.strip()
        # Detect chapter boundaries
        if any(stripped.startswith(prefix) for prefix in ["第", "Chapter ", "CHAPTER ", "---", "==="]):
            if current_chapter["content"]:
                chapters.append(current_chapter)
            current_chapter = {"title": stripped, "content": []}
        elif stripped:
            current_chapter["content"].append(stripped)

    if current_chapter["content"]:
        chapters.append(current_chapter)

    return {"chapters": chapters, "total_chars": len(content)}


def parse_docx(file_bytes: bytes) -> dict:
    """Parse .docx file."""
    try:
        from docx import Document
        import io
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        content = "\n".join(paragraphs)
        return parse_txt(content)
    except Exception as e:
        logger.error(f"Failed to parse docx: {e}")
        return {"chapters": [], "total_chars": 0, "error": str(e)}


def parse_markdown(content: str) -> dict:
    """Parse markdown into sections."""
    import mistune
    md = mistune.create_markdown()
    md(content)  # Parse to validate
    return parse_txt(content)


def parse_fountain(content: str) -> dict:
    """Parse Fountain screenplay format."""
    try:
        import fountain
        script = fountain.Fountain(content)
        scenes = []
        for scene in script.scenes:
            scenes.append({
                "title": scene.scene_heading if hasattr(scene, "scene_heading") else str(scene),
                "content": str(scene),
            })
        return {"scenes": scenes, "total_chars": len(content)}
    except ImportError:
        # Fallback: treat as plain text
        return parse_txt(content)


async def fetch_url_content(url: str) -> dict:
    """Fetch and extract text content from a URL."""
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            html = response.text

        # Extract main content using trafilatura
        text = trafilatura.extract(html, include_comments=False, include_tables=False)
        if not text:
            return {"error": "无法从该页面提取有效内容", "content": ""}

        return {"content": text, "total_chars": len(text)}
    except httpx.HTTPStatusError as e:
        return {"error": f"HTTP 错误: {e.response.status_code}", "content": ""}
    except Exception as e:
        return {"error": f"抓取失败: {str(e)}", "content": ""}


def parse_file(filename: str, content: bytes) -> dict:
    """Dispatch to the correct parser based on file extension."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    # Detect encoding for text files
    if ext in ("txt", "md", "fountain"):
        encoding = detect_encoding(content)
        text = content.decode(encoding, errors="replace")
        if len(text) > MAX_FILE_SIZE_CHARS:
            return {"error": f"文件过大（{len(text)} 字，上限 {MAX_FILE_SIZE_CHARS} 字），请分批导入"}

        if ext == "txt":
            return parse_txt(text)
        elif ext == "md":
            return parse_markdown(text)
        elif ext == "fountain":
            return parse_fountain(text)

    elif ext == "docx":
        return parse_docx(content)

    return {"error": f"不支持的文件格式: .{ext}"}
