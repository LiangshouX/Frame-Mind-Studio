package io.framemind.core.service;

import io.framemind.core.service.dto.ConnectivityTestResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;

/**
 * Tests connectivity to model providers, tools, and MCP servers.
 * <p>
 * For model providers, sends a minimal HTTP request to the provider's API
 * endpoint to validate reachability and API key validity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConnectivityTestService {

    private final ModelCatalogService catalogService;
    private final ConfigFileStore configStore;

    /**
     * Tests connectivity to a model provider by sending a minimal API request.
     */
    public ConnectivityTestResult testProvider(String providerId) {
        ModelCatalogService.ProviderCatalogEntry catalog = catalogService.getProvider(providerId);
        ConfigFileStore.ProviderEntry config = configStore.getProvider(providerId);

        if (catalog == null || config == null || config.getApiKey() == null || config.getApiKey().isBlank()) {
            return new ConnectivityTestResult(providerId, "UNKNOWN_ERROR", "Provider not configured", Instant.now().toString());
        }

        String baseUrl = config.getBaseUrl() != null ? config.getBaseUrl() : catalog.getDefaultBaseUrl();
        String apiKey = config.getApiKey();

        // Try to list models or send a minimal request
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            // Most OpenAI-compatible APIs support /models endpoint
            String testUrl = baseUrl.endsWith("/") ? baseUrl + "models" : baseUrl + "/models";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(testUrl))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return new ConnectivityTestResult(providerId, "SUCCESS",
                        "Connection successful", Instant.now().toString());
            } else if (response.statusCode() == 401 || response.statusCode() == 403) {
                return new ConnectivityTestResult(providerId, "AUTH_FAILED",
                        "Invalid API key or unauthorized", Instant.now().toString());
            } else {
                return new ConnectivityTestResult(providerId, "UNKNOWN_ERROR",
                        "Unexpected response: HTTP " + response.statusCode(), Instant.now().toString());
            }
        } catch (java.net.ConnectException | java.net.http.HttpConnectTimeoutException e) {
            return new ConnectivityTestResult(providerId, "NETWORK_ERROR",
                    "Connection refused or timed out", Instant.now().toString());
        } catch (java.net.http.HttpTimeoutException e) {
            return new ConnectivityTestResult(providerId, "TIMEOUT",
                    "Request timed out", Instant.now().toString());
        } catch (Exception e) {
            log.warn("Connectivity test failed for provider {}: {}", providerId, e.getMessage());
            return new ConnectivityTestResult(providerId, "UNKNOWN_ERROR",
                    "Error: " + e.getMessage(), Instant.now().toString());
        }
    }

    /**
     * Tests connectivity to Tavily search API.
     */
    public ConnectivityTestResult testTavily(String apiKey) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.tavily.com/search"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            "{\"api_key\":\"" + apiKey + "\",\"query\":\"test\",\"max_results\":1}"))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return new ConnectivityTestResult("tavily", "SUCCESS",
                        "Tavily API accessible", Instant.now().toString());
            } else if (response.statusCode() == 401 || response.statusCode() == 403) {
                return new ConnectivityTestResult("tavily", "AUTH_FAILED",
                        "Invalid Tavily API key", Instant.now().toString());
            } else {
                return new ConnectivityTestResult("tavily", "UNKNOWN_ERROR",
                        "Unexpected response: HTTP " + response.statusCode(), Instant.now().toString());
            }
        } catch (Exception e) {
            log.warn("Tavily connectivity test failed: {}", e.getMessage());
            return new ConnectivityTestResult("tavily", "NETWORK_ERROR",
                    "Error: " + e.getMessage(), Instant.now().toString());
        }
    }

    /**
     * Tests connectivity to an MCP server.
     */
    public ConnectivityTestResult testMcpServer(String url, String authType, String credentials) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(10));

            if ("BEARER".equalsIgnoreCase(authType) && credentials != null && !credentials.isBlank()) {
                reqBuilder.header("Authorization", "Bearer " + credentials);
            } else if ("BASIC".equalsIgnoreCase(authType) && credentials != null && !credentials.isBlank()) {
                reqBuilder.header("Authorization", "Basic " + java.util.Base64.getEncoder()
                        .encodeToString(credentials.getBytes()));
            }

            HttpResponse<String> response = client.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());

            // Any response means the server is reachable
            return new ConnectivityTestResult("mcp", "SUCCESS",
                    "Server reachable (HTTP " + response.statusCode() + ")", Instant.now().toString());
        } catch (java.net.ConnectException e) {
            return new ConnectivityTestResult("mcp", "NETWORK_ERROR",
                    "Connection refused", Instant.now().toString());
        } catch (Exception e) {
            return new ConnectivityTestResult("mcp", "NETWORK_ERROR",
                    "Error: " + e.getMessage(), Instant.now().toString());
        }
    }
}
