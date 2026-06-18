package io.framemind.modules.scriptmind.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.agent.orchestration.AgentCallAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

/**
 * Character Designer agent: designs detailed character cards with arcs,
 * personalities, and relationships based on the outline and world bible.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CharacterDesignerAgent {

    private final AgentCallAdapter agentCallAdapter;
    private final ObjectMapper objectMapper;

    /**
     * Design character cards based on the outline and world bible.
     *
     * @param outline    the structured outline (ScriptContent JSON)
     * @param worldBible the world setting / story bible
     * @param onChunk    streaming callback for partial output
     * @return a JsonNode array of character cards
     */
    public JsonNode designCharacters(JsonNode outline, JsonNode worldBible, Consumer<String> onChunk) {
        log.info("CharacterDesignerAgent designing characters");

        String prompt = buildCharacterPrompt(outline, worldBible);
        AgentDefinition definition = new AgentDefinition(
                "character_designer",
                "你是一位资深角色设计师（Character Designer），负责为影视剧本创造立体、多维度的角色。"
                        + "你需要为每个角色设定完整的人物小传、性格特征、外貌描述、人物弧线和关系网络。"
                        + "角色必须有明确的动机、缺陷和成长空间。"
                        + "请始终以 JSON 数组格式输出。",
                5
        );

        try {
            String response = agentCallAdapter.call(definition, prompt, onChunk);
            return objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("CharacterDesignerAgent failed to design characters", e);
            return buildFallbackCharacters(outline);
        }
    }

    // ─── Prompt Builder ─────────────────────────────────────────────

    private String buildCharacterPrompt(JsonNode outline, JsonNode worldBible) {
        return String.format("""
                请根据以下故事大纲和世界观设定，设计完整的角色卡片。

                ## 故事大纲
                %s

                ## 世界观设定
                %s

                ## 输出格式要求
                请严格按照以下 JSON 数组格式输出：

                [
                  {
                    "name": "角色姓名",
                    "role": "protagonist/antagonist/supporting/mentor/love_interest/trickster",
                    "age": 28,
                    "gender": "性别",
                    "personality": ["性格特征1", "性格特征2", "性格特征3"],
                    "appearance": "外貌描述（发型、体型、穿着风格、标志性特征）",
                    "background": "人物背景故事（出身、经历、创伤）",
                    "goal": "核心目标/动机",
                    "flaw": "性格缺陷/弱点",
                    "arc": "人物弧线描述（从开始到结束的变化轨迹）",
                    "relationships": [
                      {
                        "target": "关联角色姓名",
                        "type": "关系类型（恋人/对手/师徒/同僚/亲人）",
                        "dynamic": "关系动态描述"
                      }
                    ],
                    "dialogueStyle": "说话风格描述（口头禅、用词习惯、语气特点）",
                    "signature_scene": "角色最具标志性的场景类型"
                  }
                ]

                ## 要求
                1. 主角和反派必须有深度的背景故事和明确的动机
                2. 每个角色都要有独特的说话风格和行为习惯
                3. 角色关系网络要形成有意义的张力
                4. 人物弧线要有清晰的成长或堕落轨迹
                5. 至少设计 3-6 个角色
                6. 请只输出 JSON 数组，不要包含额外说明
                """,
                outline.toString(),
                worldBible.toString());
    }

    // ─── Fallback Builder ───────────────────────────────────────────

    private JsonNode buildFallbackCharacters(JsonNode outline) {
        var characters = objectMapper.createArrayNode();

        var protagonist = objectMapper.createObjectNode();
        protagonist.put("name", "主角");
        protagonist.put("role", "protagonist");
        protagonist.put("age", 28);
        protagonist.put("gender", "待定");
        var personality = objectMapper.createArrayNode();
        personality.add("坚韧");
        personality.add("聪明");
        protagonist.set("personality", personality);
        protagonist.put("appearance", "待详细设计");
        protagonist.put("background", "待详细设计");
        protagonist.put("goal", "待确定");
        protagonist.put("flaw", "待确定");
        protagonist.put("arc", "从困境中崛起");
        protagonist.set("relationships", objectMapper.createArrayNode());
        protagonist.put("dialogueStyle", "待设定");
        protagonist.put("signature_scene", "待定");
        characters.add(protagonist);

        var antagonist = objectMapper.createObjectNode();
        antagonist.put("name", "对手");
        antagonist.put("role", "antagonist");
        antagonist.put("age", 32);
        antagonist.put("gender", "待定");
        var antPersonality = objectMapper.createArrayNode();
        antPersonality.add("野心勃勃");
        antPersonality.add("精于算计");
        antagonist.set("personality", antPersonality);
        antagonist.put("appearance", "待详细设计");
        antagonist.put("background", "待详细设计");
        antagonist.put("goal", "待确定");
        antagonist.put("flaw", "待确定");
        antagonist.put("arc", "从风光到衰败");
        antagonist.set("relationships", objectMapper.createArrayNode());
        antagonist.put("dialogueStyle", "待设定");
        antagonist.put("signature_scene", "待定");
        characters.add(antagonist);

        return characters;
    }
}
