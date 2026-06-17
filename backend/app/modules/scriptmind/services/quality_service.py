"""Script quality metrics calculation service."""

from typing import Any


def calculate_quality_metrics(content: dict) -> dict:
    """Calculate all quality metrics for a script."""
    episodes = content.get("episodes", [])
    if not episodes:
        return _empty_metrics()

    # Hook strength: % of episodes with cliffhanger
    hooks_with_cliffhanger = sum(1 for ep in episodes if ep.get("cliffhanger"))
    hook_strength = hooks_with_cliffhanger / len(episodes) if episodes else 0

    # Collect all beats for analysis
    all_beats = []
    all_scenes = []
    for ep in episodes:
        for scene in ep.get("scenes", []):
            all_scenes.append(scene)
            for beat in scene.get("beats", []):
                all_beats.append(beat)

    total_beats = len(all_beats)

    # Dialogue ratio
    dialogue_beats = sum(1 for b in all_beats if b.get("type") == "dialogue")
    dialogue_ratio = dialogue_beats / total_beats if total_beats > 0 else 0

    # Scene diversity: unique locations / total scenes
    locations = set(s.get("location", "") for s in all_scenes)
    scene_diversity = len(locations) / len(all_scenes) if all_scenes else 0

    # Character balance (simplified — count dialogue by character)
    char_dialogue: dict[str, int] = {}
    for b in all_beats:
        if b.get("type") == "dialogue" and b.get("character"):
            char_dialogue[b["character"]] = char_dialogue.get(b["character"], 0) + 1
    total_dialogue = sum(char_dialogue.values())
    max_char_ratio = max(char_dialogue.values()) / total_dialogue if total_dialogue > 0 else 0

    # Rhythm curve: variation in mood tags (simplified)
    mood_counts: dict[str, int] = {}
    for s in all_scenes:
        for mood in s.get("moodTags", s.get("mood_tags", [])):
            mood_counts[mood] = mood_counts.get(mood, 0) + 1
    rhythm_score = min(len(mood_counts) / 5.0, 1.0) if mood_counts else 0.3

    return {
        "hook_strength": {
            "value": round(hook_strength, 2),
            "target": 1.0,
            "status": "pass" if hook_strength >= 0.95 else "warning",
            "details": f"{hooks_with_cliffhanger}/{len(episodes)} 集有结尾钩子",
        },
        "rhythm_curve": {
            "value": round(rhythm_score, 2),
            "target": 0.3,
            "status": "pass" if rhythm_score >= 0.3 else "warning",
            "details": f"情绪类型多样性 {len(mood_counts)} 种",
        },
        "character_balance": {
            "value": round(max_char_ratio, 2),
            "target_range": [0.4, 0.6],
            "status": "pass" if 0.4 <= max_char_ratio <= 0.6 else "warning",
            "details": f"主角对白占比 {round(max_char_ratio * 100)}%",
        },
        "dialogue_ratio": {
            "value": round(dialogue_ratio, 2),
            "target_range": [0.3, 0.5],
            "status": "pass" if 0.3 <= dialogue_ratio <= 0.5 else "warning",
            "details": f"对白占比 {round(dialogue_ratio * 100)}%",
        },
        "scene_diversity": {
            "value": round(scene_diversity, 2),
            "target": 0.6,
            "status": "pass" if scene_diversity >= 0.6 else "warning",
            "details": f"{len(locations)} 个不同场景 / {len(all_scenes)} 个总场景",
        },
        "overall_score": _calculate_overall_score(hook_strength, rhythm_score, max_char_ratio, dialogue_ratio, scene_diversity),
    }


def _calculate_overall_score(hook: float, rhythm: float, balance: float, dialogue: float, diversity: float) -> int:
    scores = []
    scores.append(min(hook / 1.0, 1.0) * 25)
    scores.append(min(rhythm / 0.3, 1.0) * 20)
    scores.append((1.0 if 0.4 <= balance <= 0.6 else 0.5) * 20)
    scores.append((1.0 if 0.3 <= dialogue <= 0.5 else 0.5) * 15)
    scores.append(min(diversity / 0.6, 1.0) * 20)
    return round(sum(scores))


def _empty_metrics() -> dict:
    return {
        "hook_strength": {"value": 0, "target": 1.0, "status": "pending", "details": "无数据"},
        "rhythm_curve": {"value": 0, "target": 0.3, "status": "pending", "details": "无数据"},
        "character_balance": {"value": 0, "target_range": [0.4, 0.6], "status": "pending", "details": "无数据"},
        "dialogue_ratio": {"value": 0, "target_range": [0.3, 0.5], "status": "pending", "details": "无数据"},
        "scene_diversity": {"value": 0, "target": 0.6, "status": "pending", "details": "无数据"},
        "overall_score": 0,
    }
