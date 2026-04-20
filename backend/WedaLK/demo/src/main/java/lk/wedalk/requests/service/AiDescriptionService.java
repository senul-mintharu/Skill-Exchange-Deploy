package lk.wedalk.requests.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiDescriptionService {

  private static final Logger log = LoggerFactory.getLogger(AiDescriptionService.class);
  private static final int DESCRIPTION_LIMIT = 2000;
  private static final String UNAVAILABLE_MESSAGE =
      "AI generation is currently unavailable. Please write your description manually or try again later.";

  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;
  private final String apiKey;
  private final String baseUrl;
  private final String model;
  private final int timeoutMs;

  public AiDescriptionService(
      ObjectMapper objectMapper,
      @Value("${app.ai.gemini.api-key:}") String apiKey,
      @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}") String baseUrl,
      @Value("${app.ai.gemini.model:gemini-2.5-flash}") String model,
      @Value("${app.ai.timeout-ms:10000}") int timeoutMs) {
    this.objectMapper = objectMapper;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
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
      ObjectNode payload = buildGeminiPayload(request);

      HttpRequest httpRequest = HttpRequest.newBuilder()
          .uri(URI.create(buildGeminiUrl()))
          .timeout(Duration.ofMillis(timeoutMs))
          .header("x-goog-api-key", apiKey)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
          .build();

      HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw unavailable(
            "AI provider returned status " + response.statusCode() + ": " + summarize(response.body()),
            null);
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

  private ObjectNode buildGeminiPayload(AiDescriptionRequest request) {
    ObjectNode payload = objectMapper.createObjectNode();

    ObjectNode systemInstruction = payload.putObject("system_instruction");
    systemInstruction.putArray("parts")
        .addObject()
        .put("text", buildInstructions());

    ArrayNode contents = payload.putArray("contents");
    ObjectNode userContent = contents.addObject();
    userContent.put("role", "user");
    userContent.putArray("parts")
        .addObject()
        .put("text", buildUserPrompt(request));

    ObjectNode generationConfig = payload.putObject("generationConfig");
    generationConfig.put("temperature", 0.35);
    generationConfig.put("maxOutputTokens", 700);

    return payload;
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

    StringBuilder draft = new StringBuilder();
    for (JsonNode candidate : root.path("candidates")) {
      for (JsonNode part : candidate.path("content").path("parts")) {
        String text = part.path("text").asText("");
        if (!text.isBlank()) {
          if (!draft.isEmpty()) {
            draft.append("\n");
          }
          draft.append(text);
        }
      }
    }
    return draft.toString();
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

  private String buildGeminiUrl() {
    String normalizedBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.substring(0, baseUrl.length() - 1)
        : baseUrl;
    String normalizedModel = model.startsWith("models/") ? model.substring("models/".length()) : model;
    return normalizedBaseUrl + "/" + normalizedModel + ":generateContent";
  }

  private String summarize(String responseBody) {
    if (responseBody == null || responseBody.isBlank()) {
      return "empty response body";
    }

    String compact = responseBody.replaceAll("\\s+", " ").trim();
    return compact.length() <= 500 ? compact : compact.substring(0, 500) + "...";
  }

  private AiGenerationException unavailable(String detail, Throwable cause) {
    if (cause == null) {
      log.warn("AI description generation unavailable: {}", detail);
      return new AiGenerationException(UNAVAILABLE_MESSAGE);
    }

    log.warn("AI description generation unavailable: {}", detail, cause);
    return new AiGenerationException(UNAVAILABLE_MESSAGE, cause);
  }
}
