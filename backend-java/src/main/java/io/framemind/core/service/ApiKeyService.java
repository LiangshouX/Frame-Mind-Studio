package io.framemind.core.service;

import io.framemind.core.dto.SettingsRequest;
import io.framemind.core.dto.SettingsResponse;

import java.util.List;

public interface ApiKeyService {

    List<SettingsResponse> listApiKeys();

    SettingsResponse saveApiKey(SettingsRequest request);
}
