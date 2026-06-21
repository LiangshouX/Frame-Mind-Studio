package io.framemind.core.service;

import io.framemind.core.service.dto.SettingsRequest;
import io.framemind.core.service.dto.SettingsResponse;

import java.util.List;

public interface ApiKeyService {

    List<SettingsResponse> listApiKeys();

    SettingsResponse saveApiKey(SettingsRequest request);
}
