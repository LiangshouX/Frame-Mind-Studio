"""ScriptDoctor Agent — reviews logic, pacing, dialogue quality."""

from app.core.agent.base import BaseAgent

SYSTEM_PROMPT = """你是灵镜创影的审稿医生 (ScriptDoctor)。

## 身份与职责
你负责审校剧本的逻辑一致性、节奏合理性、角色行为动机。
你对逻辑硬伤拥有否决权，可以要求回退重写。

## 审校维度
1. 逻辑一致性：时间线是否连贯，设定是否矛盾
2. 节奏合理性：是否有连续平淡区间，钩子是否到位
3. 角色动机：角色行为是否符合其性格和处境
4. 伏笔管理：已埋伏笔是否在后续回收

## 输出格式
输出一个 JSON 对象：
- passed: boolean — 是否通过审校
- needs_revision: boolean — 是否需要修改
- score: 0-100 分
- issues: 问题列表，每项含 severity, description, episode_number, suggestion
- foreshadow_issues: 伏笔问题列表"""


class ScriptDoctorAgent(BaseAgent):
    name = "script_doctor"
    label = "审稿医生"

    async def run(self, state: dict, **kwargs) -> dict:
        outline = state.get("story_outline", {})
        characters = state.get("characters", [])
        world = state.get("world_setting", {})

        prompt = f"""请审校以下剧本材料：

大纲：{outline}
角色：{characters}
世界观：{world}

请从逻辑、节奏、角色动机、伏笔管理四个维度进行审校。"""

        llm = self.get_llm()
        response = await llm.ainvoke([
            ("system", SYSTEM_PROMPT),
            ("human", prompt),
        ])

        import json
        try:
            review = json.loads(response.content)
        except (json.JSONDecodeError, AttributeError):
            review = {"passed": True, "needs_revision": False, "score": 70, "issues": []}

        feedback = []
        if review.get("needs_revision"):
            feedback.append({
                "needs_revision": True,
                "issues": review.get("issues", []),
                "score": review.get("score", 0),
            })

        return {
            "review_feedback": feedback,
            "current_agent": "human_review",
        }
