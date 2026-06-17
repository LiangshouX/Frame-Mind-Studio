"""Agent orchestrator using LangGraph StateGraph."""

import logging
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    """Shared state across all agents in the pipeline."""
    project_id: str
    user_input: str
    input_type: str  # one_sentence, outline, file, url
    style_preset: str | None
    target_episodes: int
    story_outline: dict | None
    world_setting: dict | None
    characters: list[dict] | None
    script_draft: dict | None
    review_feedback: list[dict] | None
    output: dict | None
    hitl_pending: bool
    hitl_action: str | None
    hitl_feedback: str | None
    tokens_consumed: int
    current_agent: str | None


class ScriptMindOrchestrator:
    """Orchestrates the ScriptMind agent pipeline."""

    def __init__(self):
        self.checkpointer = MemorySaver()
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        from app.modules.scriptmind.agents.showrunner import ShowrunnerAgent
        from app.modules.scriptmind.agents.world_builder import WorldBuilderAgent
        from app.modules.scriptmind.agents.character_designer import CharacterDesignerAgent
        from app.modules.scriptmind.agents.script_doctor import ScriptDoctorAgent

        showrunner = ShowrunnerAgent()
        world_builder = WorldBuilderAgent()
        character_designer = CharacterDesignerAgent()
        script_doctor = ScriptDoctorAgent()

        graph = StateGraph(AgentState)

        # Add nodes
        graph.add_node("showrunner", showrunner.run)
        graph.add_node("world_builder", world_builder.run)
        graph.add_node("character_designer", character_designer.run)
        graph.add_node("script_doctor", script_doctor.run)
        graph.add_node("human_review", self._human_review)
        graph.add_node("output_formatter", self._output_formatter)

        # Define edges
        graph.set_entry_point("showrunner")
        graph.add_edge("showrunner", "world_builder")
        graph.add_edge("world_builder", "character_designer")
        graph.add_edge("character_designer", "script_doctor")

        # Conditional: script_doctor → pass or needs_revision
        graph.add_conditional_edges(
            "script_doctor",
            self._check_review,
            {
                "pass": "human_review",
                "needs_revision": "showrunner",
            },
        )

        # Conditional: human_review → approved or revise
        graph.add_conditional_edges(
            "human_review",
            self._check_hitl,
            {
                "approved": "output_formatter",
                "revise": "showrunner",
            },
        )

        graph.add_edge("output_formatter", END)

        return graph.compile(checkpointer=self.checkpointer)

    def _check_review(self, state: AgentState) -> str:
        if state.get("review_feedback") and any(
            f.get("needs_revision") for f in state["review_feedback"]
        ):
            return "needs_revision"
        return "pass"

    def _check_hitl(self, state: AgentState) -> str:
        if state.get("hitl_action") == "revise":
            return "revise"
        return "approved"

    async def _human_review(self, state: AgentState) -> dict:
        """HITL node — sets hitl_pending and waits for external input."""
        return {"hitl_pending": True, "current_agent": "human_review"}

    async def _output_formatter(self, state: AgentState) -> dict:
        """Format final output."""
        return {
            "output": {
                "story_outline": state.get("story_outline"),
                "world_setting": state.get("world_setting"),
                "characters": state.get("characters"),
                "script_draft": state.get("script_draft"),
            },
            "hitl_pending": False,
            "current_agent": None,
        }

    async def run(self, initial_state: dict, thread_id: str = "default") -> dict:
        """Run the full pipeline."""
        config = {"configurable": {"thread_id": thread_id}}
        result = await self.graph.ainvoke(initial_state, config=config)
        return result

    async def resume(self, thread_id: str, hitl_action: str, feedback: str | None = None) -> dict:
        """Resume after HITL review."""
        config = {"configurable": {"thread_id": thread_id}}
        state = await self.graph.aget_state(config)
        updated = {**state.values, "hitl_action": hitl_action, "hitl_feedback": feedback, "hitl_pending": False}
        result = await self.graph.ainvoke(updated, config=config)
        return result
