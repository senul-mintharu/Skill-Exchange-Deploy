package lk.wedalk.health;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HealthController — Simple health check endpoint to verify backend is running. Used to test
 * frontend ↔ backend connectivity.
 */
@RestController
public class HealthController {

  @GetMapping("/api/health")
  public Map<String, Object> healthCheck() {
    Map<String, Object> response = new HashMap<>();
    response.put("status", "UP");
    response.put("message", "WedaLK backend is running");
    response.put("timestamp", LocalDateTime.now().toString());
    return response;
  }
}
