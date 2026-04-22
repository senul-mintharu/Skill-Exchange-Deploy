package lk.wedalk.config;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import lk.wedalk.security.CustomUserDetailsService;
import lk.wedalk.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * SecurityConfig — JWT + RBAC
 * SecurityConfig.java — JWT + RBAC Security Configuration
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;
  private final CustomUserDetailsService userDetailsService;

  public SecurityConfig(
      JwtAuthenticationFilter jwtAuthenticationFilter,
      CustomUserDetailsService userDetailsService) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    this.userDetailsService = userDetailsService;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(Customizer.withDefaults())
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint(authenticationEntryPoint())
            .accessDeniedHandler(accessDeniedHandler()))
        .authenticationProvider(authenticationProvider())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .authorizeHttpRequests(auth -> auth
            .dispatcherTypeMatchers(DispatcherType.ERROR, DispatcherType.FORWARD).permitAll()
            .requestMatchers("/api/auth/**", "/api/health").permitAll()
            .requestMatchers(HttpMethod.PUT, "/api/verification/*/status").hasRole("ADMIN")
            .requestMatchers(HttpMethod.GET, "/api/verification/*/document").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/disputes/*/resolve").hasRole("ADMIN")
            .requestMatchers(HttpMethod.GET, "/api/disputes/open").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/verification", "/api/verification/")
            .hasRole("WORKER")
            .requestMatchers(HttpMethod.GET, "/api/verification/pending").hasRole("ADMIN")
            .requestMatchers(HttpMethod.GET, "/api/verification/my").hasRole("WORKER")
            .requestMatchers("/api/verification/**").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/quotes").hasRole("WORKER")
            .requestMatchers(HttpMethod.POST, "/api/quotes/*/accept").hasRole("SEEKER")
            .requestMatchers(HttpMethod.DELETE, "/api/quotes/**").hasRole("WORKER")
            .requestMatchers(HttpMethod.GET, "/api/quotes/my").hasRole("WORKER")
            .requestMatchers(HttpMethod.PATCH, "/api/quotes/*/accept", "/api/quotes/*/reject")
            .hasRole("SEEKER")
            .requestMatchers(HttpMethod.GET, "/api/quotes/request/**").hasRole("SEEKER")
            .requestMatchers(HttpMethod.POST, "/api/requests/ai-description").hasRole("SEEKER")
            .requestMatchers(HttpMethod.POST, "/api/requests").hasRole("SEEKER")
            .requestMatchers(HttpMethod.POST, "/api/requests/*/payment-slip").hasRole("SEEKER")
            .requestMatchers(HttpMethod.GET, "/api/requests/my").hasRole("SEEKER")
            .requestMatchers(HttpMethod.PUT, "/api/requests/*").hasRole("SEEKER")
            .requestMatchers(HttpMethod.PUT, "/api/requests/*/status").hasRole("SEEKER")
            .requestMatchers(HttpMethod.DELETE, "/api/requests/*").hasRole("SEEKER")
            .requestMatchers(HttpMethod.PATCH, "/api/requests/*/worker-complete").hasRole("WORKER")
            .requestMatchers(HttpMethod.GET, "/api/requests/worker/my").hasRole("WORKER")
            .requestMatchers(HttpMethod.GET, "/api/requests/worker/*").hasRole("WORKER")
            .requestMatchers(HttpMethod.POST, "/api/profiles/*/payment-slip").hasRole("WORKER")
            .requestMatchers(HttpMethod.GET, "/api/admin/payment-slips/pending").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/admin/requests/*/payment-approve").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/admin/requests/*/payment-reject").hasRole("ADMIN")
            .requestMatchers(HttpMethod.GET, "/api/requests/*/payment-slip/view").hasRole("ADMIN")
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated());

    return http.build();
  }

  @Bean
  public AuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
    authProvider.setUserDetailsService(userDetailsService);
    authProvider.setPasswordEncoder(passwordEncoder());
    return authProvider;
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
      throws Exception {
    return config.getAuthenticationManager();
  }

  @Bean
  public AuthenticationEntryPoint authenticationEntryPoint() {
    return (request, response, authException) -> {
      // #region agent log
      try {
        String line = "{\"sessionId\":\"ba51df\",\"runId\":\"run1\",\"hypothesisId\":\"H1,H2,H3,H4\",\"location\":\"SecurityConfig.java:authenticationEntryPoint\",\"message\":\"401 emitted\",\"data\":{\"path\":\""
            + request.getMethod() + " " + request.getRequestURI() + "\",\"ex\":\""
            + (authException.getClass().getSimpleName()) + "\",\"msg\":\""
            + (authException.getMessage() == null ? "" : authException.getMessage().replace("\"", "\\\""))
            + "\",\"hasAuthHeader\":" + (request.getHeader("Authorization") != null)
            + "},\"timestamp\":" + System.currentTimeMillis() + "}\n";
        java.nio.file.Files.write(
            java.nio.file.Paths.get("D:/skill-exchange/debug-ba51df.log"),
            line.getBytes(java.nio.charset.StandardCharsets.UTF_8),
            java.nio.file.StandardOpenOption.CREATE,
            java.nio.file.StandardOpenOption.APPEND);
      } catch (Exception ignored) {}
      // #endregion
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
    };
  }

  @Bean
  public AccessDeniedHandler accessDeniedHandler() {
    return (request, response, accessDeniedException) -> {
      // #region agent log
      try {
        String line = "{\"sessionId\":\"ba51df\",\"runId\":\"run1\",\"hypothesisId\":\"H2,H3\",\"location\":\"SecurityConfig.java:accessDeniedHandler\",\"message\":\"403 emitted\",\"data\":{\"path\":\""
            + request.getMethod() + " " + request.getRequestURI()
            + "\",\"msg\":\""
            + (accessDeniedException.getMessage() == null ? "" : accessDeniedException.getMessage().replace("\"", "\\\""))
            + "\"},\"timestamp\":" + System.currentTimeMillis() + "}\n";
        java.nio.file.Files.write(
            java.nio.file.Paths.get("D:/skill-exchange/debug-ba51df.log"),
            line.getBytes(java.nio.charset.StandardCharsets.UTF_8),
            java.nio.file.StandardOpenOption.CREATE,
            java.nio.file.StandardOpenOption.APPEND);
      } catch (Exception ignored) {}
      // #endregion
      response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
    };
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
