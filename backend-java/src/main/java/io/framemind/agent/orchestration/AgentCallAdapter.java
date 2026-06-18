package io.framemind.agent.orchestration;

import io.framemind.agent.config.AgentDefinition;

import java.util.function.Consumer;

/**
 * Abstraction over the actual LLM / AgentScope call.
 * <p>
 * Implementations of this interface translate a prompt into a model response.
 * The real implementation will invoke AgentScope-Java's {@code ReActAgent};
 * the default (placeholder) implementation returns a stub response so that the
 * rest of the pipeline can be wired and tested independently of the LLM.
 */
public interface AgentCallAdapter {

    /**
     * Invoke an agent with the given prompt and stream partial output chunks
     * to the supplied callback.
     *
     * @param definition  the agent definition (name, system prompt, iteration budget)
     * @param prompt      the user/developer prompt to send to the agent
     * @param onChunk     callback invoked for each streaming text chunk
     * @return the full aggregated response text
     */
    String call(AgentDefinition definition, String prompt, Consumer<String> onChunk);
}
