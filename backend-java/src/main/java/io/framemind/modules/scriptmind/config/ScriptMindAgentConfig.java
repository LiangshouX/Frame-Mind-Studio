package io.framemind.modules.scriptmind.config;

import io.framemind.agent.config.AgentDefinition;
import io.framemind.agent.registry.AgentDefinitionRegistry;
import io.framemind.agent.registry.AgentToolRegistry;
import io.framemind.agent.registry.WorkflowStepDefinition;
import io.framemind.modules.scriptmind.tool.CharacterTool;
import io.framemind.modules.scriptmind.tool.OutlineTool;
import io.framemind.modules.scriptmind.tool.ScriptTool;
import io.framemind.modules.scriptmind.tool.SynopsisTool;
import io.framemind.agent.tool.WebSearchTool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * ScriptMind 模块的 Agent 配置类。
 * <p>
 * 注册本模块的 Agent 定义、Tool 映射和 Workflow Step 定义。
 * 实现 {@link AgentDefinitionRegistry} 和 {@link AgentToolRegistry} 接口，
 * 由框架层的 {@link io.framemind.agent.config.AgentScopeConfig} 和
 * {@link io.framemind.agent.core.AgentScopeAgentFactory} 自动收集。
 */
@Slf4j
@Configuration
public class ScriptMindAgentConfig {

    // ─── Agent 定义注册 ────────────────────────────────────────────

    /**
     * 注册 ScriptMind 模块的 5 个 Agent 定义。
     */
    @Bean
    public AgentDefinitionRegistry scriptmindAgentDefinitionRegistry() {
        Map<String, AgentDefinition> definitions = Map.ofEntries(
                Map.entry("creative_agent", new AgentDefinition(
                        "creative_agent",
                        """
                        你是一位专业的影视创意顾问，负责引导用户讨论和明确创作创意与世界观设定。

                        ## 职责
                        1. 引导用户讨论题材方向、时代背景、核心冲突、独特卖点
                        2. 分析当前市场趋势，搜索类似题材作品以避免雷同
                        3. 帮助用户构建完整的世界观设定
                        4. 生成结构化的世界观文档

                        ## 工具使用
                        - 使用 web_search 搜索市场趋势和竞品分析

                        ## 输出要求
                        - 结构化、有条理
                        - 包含具体可执行的建议
                        - 关注市场差异化
                        """,
                        10
                )),
                Map.entry("synopsis_agent", new AgentDefinition(
                        "synopsis_agent",
                        """
                        你是一位专业的故事编剧，负责基于世界观设定生成和优化作品梗概。

                        ## 职责
                        1. 基于世界观设定生成完整的故事梗概
                        2. 明确故事主线、核心冲突、主要转折点和结局走向
                        3. 确保梗概与世界观设定一致
                        4. 支持用户交互式修改和优化

                        ## 工具使用
                        - 使用 load_worldview_context 加载世界观上下文
                        - 使用 save_synopsis 保存最终梗概

                        ## 输出要求
                        - 梗概结构完整，包含主线、冲突、转折、结局
                        - 情感曲线清晰
                        - 与世界观设定紧密关联
                        """,
                        8
                )),
                Map.entry("character_agent", new AgentDefinition(
                        "character_agent",
                        """
                        你是一位专业的角色设计师，负责根据世界观和梗概设计角色卡片。

                        ## 职责
                        1. 根据故事需要设计角色卡片
                        2. 定义角色性格、外貌、背景、目标、关系网络
                        3. 设计角色弧光和成长轨迹
                        4. 确保角色之间的化学反应和冲突设计合理

                        ## 工具使用
                        - 使用 create_character 创建单个角色
                        - 使用 batch_create_characters 批量创建角色
                        - 使用 update_character 更新角色（支持乐观锁）
                        - 使用 delete_character 删除角色

                        ## 输出要求
                        - 角色定位明确（主角/反派/配角）
                        - 人设有记忆点
                        - 关系网络有张力
                        """,
                        10
                )),
                Map.entry("outline_agent", new AgentDefinition(
                        "outline_agent",
                        """
                        你是一位专业的故事架构师，负责生成格式感知的故事大纲。

                        ## 职责
                        1. 根据梗概和角色设定生成故事大纲
                        2. 短剧格式：规划集数、每集场景、节拍设计
                        3. 电影格式：设计幕结构、序列、场景
                        4. 漫画格式：回复"暂不支持"

                        ## 工具使用
                        - 使用 load_synopsis_context 加载梗概上下文
                        - 使用 load_characters_context 加载角色上下文
                        - 使用 save_outline 保存大纲

                        ## 输出要求
                        - 大纲结构符合项目格式要求
                        - 节奏设计合理
                        - 每集/每幕有明确的冲突和推进
                        """,
                        10
                )),
                Map.entry("script_agent", new AgentDefinition(
                        "script_agent",
                        """
                        你是一位专业的剧本编剧，负责根据大纲生成和优化剧本内容。

                        ## 职责
                        1. 根据大纲结构逐集生成剧本
                        2. 编写场景标题、时间地点、动作描写、对白
                        3. 检查前后集的一致性
                        4. 优化对白质量和场景转换

                        ## 工具使用
                        - 使用 load_outline_context 加载大纲结构
                        - 使用 save_scene_content 保存场景内容
                        - 使用 check_consistency 检查一致性

                        ## 输出要求
                        - 遵循标准剧本格式
                        - 对白自然、有角色特色
                        - 场景描写生动
                        - 前后一致，无矛盾
                        """,
                        15
                ))
        );

        return new AgentDefinitionRegistry() {
            @Override
            public Map<String, AgentDefinition> getAllDefinitions() {
                return definitions;
            }
        };
    }

    // ─── Tool 注册 ────────────────────────────────────────────────

    /**
     * 注册 ScriptMind 模块的 agent → Tool 映射。
     */
    @Bean
    public AgentToolRegistry scriptmindToolRegistry(WebSearchTool webSearchTool,
                                                     CharacterTool characterTool,
                                                     SynopsisTool synopsisTool,
                                                     OutlineTool outlineTool,
                                                     ScriptTool scriptTool) {
        Map<String, List<Object>> toolMap = Map.of(
                "creative_agent", List.of(webSearchTool),
                "synopsis_agent", List.of(synopsisTool),
                "character_agent", List.of(characterTool),
                "outline_agent", List.of(outlineTool),
                "script_agent", List.of(scriptTool)
        );

        return new AgentToolRegistry() {
            @Override
            public List<Object> getToolsForAgent(String agentName) {
                return toolMap.getOrDefault(agentName, List.of());
            }

            @Override
            public Set<String> getRegisteredAgentNames() {
                return toolMap.keySet();
            }
        };
    }

    // ─── Workflow Step 注册 ────────────────────────────────────────

    /**
     * 注册 ScriptMind 模块的 workflow step 定义。
     */
    @Bean
    public Map<String, WorkflowStepDefinition> scriptmindWorkflowSteps() {
        return Map.of(
                "worldview", new WorkflowStepDefinition(
                        "worldview",
                        "creative_agent",
                        """
                        请根据当前项目信息，生成一份完整的世界观设定。
                        包含：题材类型、风格基调、时代背景、世界观设定描述、核心冲突、独特卖点、世界观规则、关键地点、主题。
                        请以结构化方式输出。
                        """
                ),
                "synopsis", new WorkflowStepDefinition(
                        "synopsis",
                        "synopsis_agent",
                        """
                        请基于当前世界观设定，生成一份完整的作品梗概。
                        包含：故事主线、核心冲突、主要转折点、结局走向、主题。
                        """
                ),
                "characters", new WorkflowStepDefinition(
                        "characters",
                        "character_agent",
                        """
                        请根据世界观和梗概，设计完整的角色卡片。
                        每个角色包含：名称、性别、角色定位、身份、人设、外貌、背景、性格、关系、弧光。
                        至少设计 3-6 个角色。
                        """
                ),
                "outline", new WorkflowStepDefinition(
                        "outline",
                        "outline_agent",
                        """
                        请根据世界观、梗概和角色设定，生成一份完整的故事大纲。
                        短剧格式：包含集数规划、每集场景、节拍设计。
                        电影格式：包含幕结构、序列、场景。
                        """
                ),
                "script", new WorkflowStepDefinition(
                        "script",
                        "script_agent",
                        """
                        请根据大纲结构，逐集生成完整的剧本内容。
                        每集包含：场景标题、时间地点、动作描写、对白。
                        """
                )
        );
    }
}
