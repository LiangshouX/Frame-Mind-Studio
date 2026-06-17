"""Format converter tool for agents."""

from typing import Any


def script_to_plain_text(script_content: dict) -> str:
    """Convert structured script content to readable plain text."""
    lines = []
    for ep in script_content.get("episodes", []):
        lines.append(f"\n{'='*60}")
        lines.append(f"第{ep['episodeNumber']}集: {ep['title']}")
        lines.append(f"{'='*60}\n")
        for scene in ep.get("scenes", []):
            lines.append(f"[场景] {scene['location']} — {scene['time']}")
            for beat in scene.get("beats", []):
                if beat["type"] == "action":
                    lines.append(f"  {beat['content']}")
                elif beat["type"] == "dialogue":
                    char = beat.get("character", "?")
                    emotion = beat.get("emotion", "")
                    emo_str = f"（{emotion}）" if emotion else ""
                    lines.append(f"  {char}{emo_str}: {beat['content']}")
                elif beat["type"] == "transition":
                    lines.append(f"  >>> {beat['content']}")
            lines.append("")
    return "\n".join(lines)


def outline_to_markdown(outline: dict) -> str:
    """Convert structured outline to Markdown."""
    lines = []
    lines.append(f"# {outline.get('title', '未命名')}\n")
    lines.append(f"**梗概**: {outline.get('logline', '')}\n")
    lines.append(f"**题材**: {', '.join(outline.get('genre', []))}\n")

    if outline.get("themes"):
        lines.append(f"**主题**: {', '.join(outline['themes'])}\n")

    lines.append("## 集数规划\n")
    for ep in outline.get("episodes", []):
        lines.append(f"### 第{ep['episodeNumber']}集: {ep['title']}\n")
        lines.append(f"{ep['summary']}\n")
        if ep.get("keyEvents"):
            lines.append("**关键事件**:")
            for event in ep["keyEvents"]:
                lines.append(f"- {event}")
            lines.append("")
        if ep.get("cliffhanger"):
            lines.append(f"**钩子**: {ep['cliffhanger']}\n")

    return "\n".join(lines)
