package lk.wedalk.requests.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import lk.wedalk.common.exceptions.AiGenerationException;
import lk.wedalk.requests.dto.AiDescriptionRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiDescriptionService {

  private static final int DESCRIPTION_LIMIT = 2000;
  private static final String UNAVAILABLE_MESSAGE =
      "AI generation is currently unavailable. Please write your description manually or try again later.";

  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;
  private final String apiKey;
  private final String apiUrl;
  private final String model;
  private final int timeoutMs;

  public AiDescriptionService(
      ObjectMapper objectMapper,
      @Value("${app.ai.openai.api-key:}") String apiKey,
      @Value("${app.ai.openai.api-url:https://api.openai.com/v1/responses}") String apiUrl,
      @Value("${app.ai.openai.model:gpt-4o-mini}") String model,
      @Value("${app.ai.timeout-ms:10000}") int timeoutMs) {
    this.objectMapper = objectMapper;
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofMillis(timeoutMs))
        .build();
  }

  public String generateDescription(AiDescriptionRequest request) {
    if (apiKey == null || apiKey.isBlank()) {
      throw unavailable("AI API key is not configured", null);
    }

    try {
      ObjectNode payload = objectMapper.createObjectNode();
      payload.put("model", model);
      payload.put("instructions", buildInstructions());
      payload.put("input", buildUserPrompt(request));
      payload.put("max_output_tokens", 650);

      HttpRequest httpRequest = HttpRequest.newBuilder()
          .uri(URI.create(apiUrl))
          .timeout(Duration.ofMillis(timeoutMs))
          .header("Authorization", "Bearer " + apiKey)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
          .build();

      HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw unavailable("AI provider returned status " + response.statusCode(), null);
      }

      String draft = extractDraft(response.body()).trim();
      if (draft.isBlank()) {
        throw unavailable("AI provider returned an empty draft", null);
      }

      return truncateToLimit(draft);
    } catch (HttpTimeoutException ex) {
      throw unavailable("AI provider request timed out", ex);
    } catch (IOException ex) {
      throw unavailable("AI provider connection failed", ex);
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw unavailable("AI provider request was interrupted", ex);
    } catch (IllegalArgumentException ex) {
      throw unavailable("AI provider configuration is invalid", ex);
    }
  }

  private String buildInstructions() {
    return """
        You help Sri Lankan service seekers write clear job descriptions for a local services marketplace.
        Return only the job description text.
        Do not include a title, greeting, markdown, bullets, quotation marks, or price estimate.
        Write in first person as the seeker.
        Mention the issue, useful details workers need before quoting, access or timing notes, and expected outcome.
        Keep the draft concise and comfortably below 2000 characters.
        """;
  }

  private String buildUserPrompt(AiDescriptionRequest request) {
    return String.format(
        """
        Job Title: %s
        Category: %s
        Location Area: %s
        Urgency: %s
        Existing Notes: %s
        """,
        safe(request.getTitle()),
        request.getCategory(),
        safe(request.getLocationArea()),
        request.getUrgency() == null ? "MEDIUM" : request.getUrgency(),
        safe(request.getExistingDescription()));
  }

  private String extractDraft(String responseBody) throws IOException {
    JsonNode root = objectMapper.readTree(responseBody);
    String outputText = root.path("output_text").asText("");
    if (!outputText.isBlank()) {
      return outputText;
    }

    StringBuilder fallbackText = new StringBuilder();
    for (JsonNode output : root.path("output")) {
      for (JsonNode content : output.path("content")) {
        String text = content.path("text").asText("");
        if (!text.isBlank()) {
          if (!fallbackText.isEmpty()) {
            fallbackText.append("\n");
          }
          fallbackText.append(text);
        }
      }
    }
    return fallbackText.toString();
  }

  private String truncateToLimit(String text) {
    if (text.length() <= DESCRIPTION_LIMIT) {
      return text;
    }
    return text.substring(0, DESCRIPTION_LIMIT);
  }

  private String safe(String value) {
    return value == null || value.isBlank() ? "Not provided" : value.trim();
  }

  private AiGenerationException unavailable(String detail, Throwable cause) {
    return new AiGenerationException(UNAVAILABLE_MESSAGE, cause == null ? new RuntimeException(detail) : cause);
  }
}
