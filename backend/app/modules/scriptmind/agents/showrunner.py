"""Showrunner Agent — main writer controlling story arc, pacing, and theme."""

from app.core.agent.base import BaseAgent
from app.modules.scriptmind.schemas.script import StoryOutline


SYSTEM_PROMPT = """你是灵镜创影的主笔编剧 (Showrunner)。

## 身份与职责
你是一位经验丰富的短剧/网文编剧总监，擅长把控故事主线、节奏和主题。
你的目标是创作出"开局抓人、中段紧凑、结尾有余味"的优质剧本。

## 工作流程
1. 接收用户的创作意图（题材、风格、时长、集数等）
2. 生成故事大纲（含集数规划、主线脉络、关键反转点）

## 输出格式
严格按照 JSON Schema 输出，必须包含：
- title: 标题
- genre: 题材标签列表
- logline: 一句话梗概
- episodes: 集数规划列表（每集含 title, summary, key_events, cliffhanger）
- main_plot_points: 主线剧情点
- turning_points: 关键反转点
- themes: 主题标签

## 约束
- 短剧每集时长 1-3 分钟，总集数 8-100 集
- 前 3 集必须完成核心冲突建立和"钩子"设置
- 每集结尾必须有悬念或反转"""


class ShowrunnerAgent(BaseAgent):
    name = "showrunner"
    label = "主笔编剧"

    async def run(self, state: dict, **kwargs) -> dict:
        style_hints = {
            "sweet": "甜宠风格，注重情感升温曲线，误会-和好循环，撒糖密度高",
            "suspense": "悬疑风格，线索埋设、反转叠加、逻辑闭环",
            "revenge": "逆袭风格，压迫积累、分级打脸、终极反转",
            "ancient": "古风风格，古典意境、权谋斗争、恩怨情仇",
            "marvel": "漫威风格，世界观宏大、视觉奇观、英雄弧光",
            "comedy": "搞笑风格，节奏明快、反差萌、梗密度高",
        }

        style_hint = style_hints.get(state.get("style_preset", ""), "通用风格")
        target_episodes = state.get("target_episodes", 20)
        user_input = state.get("user_input", "")

        prompt = f"""用户创意输入：{user_input}
风格要求：{style_hint}
目标集数：{target_episodes} 集

请根据以上信息生成完整的故事大纲。"""

        llm = self.get_llm_with_structured_output(StoryOutline)
        outline = await llm.ainvoke([
            ("system", SYSTEM_PROMPT),
            ("human", prompt),
        ])

        return {
            "story_outline": outline.model_dump() if hasattr(outline, "model_dump") else outline.dict(),
            "current_agent": "world_builder",
        }
