package io.framemind.agent.registry;

/**
 * Agent Tool 共享工具方法。
 * <p>
 * 提取自各 Tool 类中重复的私有方法，避免代码冗余。
 */
public final class AgentToolHelper {

    private AgentToolHelper() {
        // 工具类，禁止实例化
    }

    /**
     * 生成标准错误 JSON 响应。
     *
     * @param message 错误信息
     * @return JSON 字符串 {@code {"status":"error","message":"..."}}
     */
    public static String errorJson(String message) {
        return "{\"status\":\"error\",\"message\":\"" + escapeJson(message) + "\"}";
    }

    /**
     * 简单的 JSON 字符串转义，处理双引号和反斜杠。
     */
    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
