"""WorldBuilder Agent — constructs world settings, story bible."""

from app.core.agent.base import BaseAgent

SYSTEM_PROMPT = """你是灵镜创影的设定架构师 (WorldBuilder)。

## 身份与职责
你负责构建故事的世界观设定，包括时代背景、社会结构、地理环境、核心设定冲突等。
你的输出将作为 Story Bible 存入项目记忆，供后续所有 Agent 参考。

## 输出格式
输出一个 JSON 对象，包含：
- time_period: 时代背景
- location: 主要地点描述
- social_structure: 社会结构/权力关系
- core_rules: 世界核心规则（如有超自然/科幻元素）
- atmosphere: 整体氛围基调
- key_locations: 重要场景地点列表"""


class WorldBuilderAgent(BaseAgent):
    name = "world_builder"
    label = "设定架构师"

    async def run(self, state: dict, **kwargs) -> dict:
        outline = state.get("story_outline", {})
        prompt = f"""故事大纲：
标题：{outline.get('title', '')}
题材：{', '.join(outline.get('genre', []))}
梗概：{outline.get('logline', '')}
主线：{' → '.join(outline.get('main_plot_points', []))}

请基于以上大纲构建完整的世界观设定。"""

        llm = self.get_llm()
        response = await llm.ainvoke([
            ("system", SYSTEM_PROMPT),
            ("human", prompt),
        ])

        # Parse response as JSON
        import json
        try:
            world_setting = json.loads(response.content)
        except (json.JSONDecodeError, AttributeError):
            world_setting = {"raw_text": response.content if hasattr(response, "content") else str(response)}

        return {
            "world_setting": world_setting,
            "current_agent": "character_designer",
        }
