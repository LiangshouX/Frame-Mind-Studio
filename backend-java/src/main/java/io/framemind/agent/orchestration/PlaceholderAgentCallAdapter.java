package io.framemind.agent.orchestration;

import io.framemind.agent.config.AgentDefinition;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

/**
 * Placeholder implementation of {@link AgentCallAdapter} that returns stub
 * responses. This allows the full pipeline to be wired, tested and demonstrated
 * without a live LLM backend.
 * <p>
 * Activated when {@code framemind.agent.adapter=placeholder}.
 * The {@link AgentScopeCallAdapter} is the default.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "framemind.agent.adapter", havingValue = "placeholder")
public class PlaceholderAgentCallAdapter implements AgentCallAdapter {

    @Override
    public String call(AgentDefinition definition, String prompt, Consumer<String> onChunk) {
        log.info("Placeholder agent call: agent='{}', prompt length={}", definition.name(), prompt.length());

        String response = buildStubResponse(definition.name(), prompt);

        // Simulate streaming by emitting the response in chunks
        int chunkSize = 40;
        for (int i = 0; i < response.length(); i += chunkSize) {
            int end = Math.min(i + chunkSize, response.length());
            String chunk = response.substring(i, end);
            onChunk.accept(chunk);

            // Simulate latency between chunks
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        return response;
    }

    private String buildStubResponse(String agentName, String prompt) {
        return switch (agentName) {
            case "showrunner" -> """
                    {
                      "title": "逆袭女王",
                      "theme": "都市复仇与自我救赎",
                      "logline": "互联网产品经理林晚秋在遭遇渣男背叛和职场打压后，凭借智慧和勇气实现人生逆袭。",
                      "episode_list": [
                        {"episode": 1, "title": "坠入深渊", "summary": "林晚秋发现男友陈昊的背叛，同时被公司降职。"},
                        {"episode": 2, "title": "绝地反击", "summary": "晚秋偶遇贵人，获得创业机会。"},
                        {"episode": 3, "title": "暗流涌动", "summary": "陈昊发现晚秋的新公司威胁到他的利益。"}
                      ],
                      "hook_design": {
                        "pilot_hook": "电梯里捡到的神秘戒指暗藏惊天秘密",
                        "mid_hook": "晚秋发现真正的幕后黑手竟是最信任的人",
                        "finale_hook": "所有伏笔汇聚，真相令人震惊"
                      }
                    }
                    """;
            case "world_builder" -> """
                    {
                      "setting": "现代都市 - 一线城市",
                      "time_period": "2024-2025",
                      "locations": [
                        {"name": "星辰科技大厦", "description": "互联网公司总部，故事主要职场场景"},
                        {"name": "老城区咖啡馆", "description": "晚秋的秘密基地，多次关键对话发生地"}
                      ],
                      "rules": {
                        "power_structure": "互联网行业的资本博弈",
                        "social_hierarchy": "职场层级与新旧势力对抗"
                      },
                      "timeline": [
                        {"event": "晚秋入职", "relative_time": "-2年"},
                        {"event": "故事开始", "relative_time": "0"}
                      ]
                    }
                    """;
            case "character_designer" -> """
                    [
                      {
                        "name": "林晚秋",
                        "role": "protagonist",
                        "age": 28,
                        "personality": ["坚韧", "聪明", "隐忍", "果断"],
                        "appearance": "短发干练，眼神中带着不服输的光芒",
                        "background": "互联网公司产品经理，出身普通家庭",
                        "goal": "证明自己的价值，不让任何人看轻",
                        "arc": "从隐忍到爆发，从被动到主动掌控人生"
                      },
                      {
                        "name": "陈昊",
                        "role": "antagonist",
                        "age": 30,
                        "personality": ["野心勃勃", "虚伪", "精于算计"],
                        "appearance": "西装革履，表面温文尔雅",
                        "background": "互联网公司高管，晚秋前男友",
                        "goal": "不择手段获取权力和地位",
                        "arc": "从风光无限到众叛亲离"
                      }
                    ]
                    """;
            case "script_doctor" -> """
                    {
                      "overall_score": 82,
                      "strengths": [
                        "人物性格鲜明，冲突设计合理",
                        "节奏感好，每集都有钩子"
                      ],
                      "issues": [
                        {"severity": "medium", "location": "第3集", "description": "反转稍显突兀，铺垫不足"},
                        {"severity": "low", "location": "第5集对白", "description": "部分台词过于书面化"}
                      ],
                      "suggestions": [
                        "在第2集中增加对第3集反转的伏笔铺垫",
                        "优化第5集对白，使其更口语化"
                      ],
                      "foreshadow_status": {
                        "total": 3,
                        "resolved": 1,
                        "unresolved": 2
                      }
                    }
                    """;
            default -> "{\"message\": \"Agent '" + agentName + "' processed the request successfully.\"}";
        };
    }
}
