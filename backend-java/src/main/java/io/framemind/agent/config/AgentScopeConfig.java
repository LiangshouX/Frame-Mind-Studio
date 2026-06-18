package io.framemind.agent.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Configuration class that registers the agent definitions used throughout the
 * multi-agent screenplay pipeline.
 * <p>
 * Each {@link AgentDefinition} holds the system prompt, iteration budget, and
 * metadata for a single agent role. The definitions are stored in a
 * {@code Map<String, AgentDefinition>} bean so that the orchestrator can look
 * them up by name at runtime.
 * <p>
 * When the AgentScope-Java SDK is fully integrated, these definitions can be
 * upgraded to produce real {@code ReActAgent} instances. For now they serve as
 * the configuration layer that a pluggable agent adapter consumes.
 */
@Configuration
public class AgentScopeConfig {

    @Value("${agentscope.model.provider:openai}")
    private String modelProvider;

    /**
     * Provides the mapping from agent name to its runtime definition.
     */
    @Bean
    public Map<String, AgentDefinition> agentDefinitions() {
        return Map.of(
                "showrunner", new AgentDefinition(
                        "showrunner",
                        "你是「主笔编剧」Showrunner Agent。你的职责是：\n"
                                + "1. 解析用户的创意输入（一句话梗概、大纲文本等）\n"
                                + "2. 生成结构化的故事大纲，包含集数规划和钩子设计\n"
                                + "3. 协调其他 Agent 完成剧本创作流水线\n"
                                + "4. 确保故事的整体节奏和情感曲线合理\n\n"
                                + "输出格式要求：JSON 结构化大纲，包含 episode_list、hook_design、theme 等字段。\n"
                                + "当前模型提供者: " + modelProvider,
                        10
                ),
                "world_builder", new AgentDefinition(
                        "world_builder",
                        "你是「世界观架构师」WorldBuilder Agent。你的职责是：\n"
                                + "1. 根据故事大纲构建完整的世界观设定\n"
                                + "2. 创建故事圣经（story bible），包括时间线、规则体系、背景设定\n"
                                + "3. 确保世界观的一致性和内在逻辑\n"
                                + "4. 定义关键场景的地理、文化和社会背景\n\n"
                                + "输出格式要求：JSON 结构化世界观，包含 timeline、rules、locations、culture 等字段。",
                        8
                ),
                "character_designer", new AgentDefinition(
                        "character_designer",
                        "你是「角色设计师」CharacterDesigner Agent。你的职责是：\n"
                                + "1. 根据故事大纲和世界观设计角色卡片\n"
                                + "2. 定义角色性格、外貌、背景、目标、关系网络\n"
                                + "3. 设计角色弧光和成长轨迹\n"
                                + "4. 确保角色之间的化学反应和冲突设计合理\n\n"
                                + "输出格式要求：JSON 数组，每个元素为一个角色卡片，包含 name、role、personality、appearance、background、arc、relationships 等字段。",
                        8
                ),
                "script_doctor", new AgentDefinition(
                        "script_doctor",
                        "你是「剧本医生」ScriptDoctor Agent。你的职责是：\n"
                                + "1. 审校剧本的逻辑性、节奏感、情感张力\n"
                                + "2. 检查伏笔回收情况\n"
                                + "3. 优化对白质量和场景转换\n"
                                + "4. 提供具体的修改建议\n"
                                + "5. 评估整体质量并给出评分\n\n"
                                + "输出格式要求：JSON 对象，包含 overall_score、issues（问题列表）、suggestions（建议列表）、foreshadow_status 等字段。",
                        10
                )
        );
    }
}
