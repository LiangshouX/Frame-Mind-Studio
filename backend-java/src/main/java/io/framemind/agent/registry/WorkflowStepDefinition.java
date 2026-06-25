package io.framemind.agent.registry;

/**
 * 工作流步骤定义（不可变记录）。
 * <p>
 * 描述一个 workflow step 的配置，包括步骤名称、对应的 agent 名称和生成 prompt 的模板。
 * 各业务模块通过 {@code @Bean} 注册自己的 workflow step 定义。
 *
 * @param stepName      workflow step 名称（如 "worldview"、"synopsis"）
 * @param agentName     对应的 agent 名称（如 "creative_agent"）
 * @param promptTemplate 生成 prompt 的模板（支持 {@code {projectId}} 等占位符）
 */
public record WorkflowStepDefinition(
        String stepName,
        String agentName,
        String promptTemplate
) {}
