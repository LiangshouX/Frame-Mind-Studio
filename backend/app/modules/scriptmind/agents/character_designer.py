"""CharacterDesigner Agent — designs character profiles, relationships, arcs."""

from app.core.agent.base import BaseAgent

SYSTEM_PROMPT = """你是灵镜创影的设计师 (CharacterDesigner)。

## 身份与职责
你负责根据故事大纲和世界观设计所有角色，包括主角、反派、配角。
每个角色需要包含：外貌、性格、人物关系、角色弧光。

## 输出格式
输出一个 JSON 数组，每个角色包含：
- name: 角色名
- role_type: "protagonist" | "antagonist" | "supporting" | "minor"
- description: 角色简介
- appearance: 外貌描述
- personality: 性格标签列表
- relationships: 与其他角色的关系字典
- character_arc: 角色弧光描述
- visual_prompt: 用于图像生成的英文 Prompt"""


class CharacterDesignerAgent(BaseAgent):
    name = "character_designer"
    label = "角色设计师"

    async def run(self, state: dict, **kwargs) -> dict:
        outline = state.get("story_outline", {})
        world = state.get("world_setting", {})

        prompt = f"""故事大纲：{outline}
世界观设定：{world}

请设计所有主要角色和重要配角。"""

        llm = self.get_llm()
        response = await llm.ainvoke([
            ("system", SYSTEM_PROMPT),
            ("human", prompt),
        ])

        import json
        try:
            characters = json.loads(response.content)
        except (json.JSONDecodeError, AttributeError):
            characters = [{"raw_text": response.content if hasattr(response, "content") else str(response)}]

        return {
            "characters": characters if isinstance(characters, list) else [characters],
            "current_agent": "script_doctor",
        }
