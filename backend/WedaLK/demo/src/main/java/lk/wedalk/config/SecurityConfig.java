package lk.wedalk.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import lk.wedalk.common.ApiResponse;
import lk.wedalk.security.CustomUserDetailsService;
import lk.wedalk.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
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

  /** Shared mapper for writing JSON error responses in the security handlers. */
  private static final ObjectMapper MAPPER = new ObjectMapper()
      .registerModule(new JavaTimeModule())
      .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

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

  /**
   * Returns a JSON {@link ApiResponse.ErrorResponse} with 401 status when the
   * request is unauthenticated (missing or invalid JWT).
   */
  @Bean
  public AuthenticationEntryPoint authenticationEntryPoint() {
    return (request, response, authException) -> {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      MAPPER.writeValue(response.getOutputStream(),
          ApiResponse.ErrorResponse.of(401, "Unauthorized",
              "Authentication is required. Please log in to continue."));
    };
  }

  /**
   * Returns a JSON {@link ApiResponse.ErrorResponse} with 403 status when the
   * authenticated user lacks the required role/authority.
   */
  @Bean
  public AccessDeniedHandler accessDeniedHandler() {
    return (request, response, accessDeniedException) -> {
      response.setStatus(HttpServletResponse.SC_FORBIDDEN);
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      MAPPER.writeValue(response.getOutputStream(),
          ApiResponse.ErrorResponse.of(403, "Forbidden",
              "You do not have the required permissions to perform this action."));
    };
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
