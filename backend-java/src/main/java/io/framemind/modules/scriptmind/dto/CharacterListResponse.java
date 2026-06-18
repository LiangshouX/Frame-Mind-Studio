package io.framemind.modules.scriptmind.dto;

import java.util.List;

public record CharacterListResponse(
        List<CharacterResponse> items,
        int total
) {
}
