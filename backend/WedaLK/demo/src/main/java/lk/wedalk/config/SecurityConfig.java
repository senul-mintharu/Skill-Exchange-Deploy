package lk.wedalk.config;

import jakarta.servlet.http.HttpServletResponse;
import lk.wedalk.security.CustomUserDetailsService;
import lk.wedalk.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
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
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint(authenticationEntryPoint())
            .accessDeniedHandler(accessDeniedHandler()))
        .authenticationProvider(authenticationProvider())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**", "/api/health").permitAll()
            .requestMatchers(HttpMethod.PUT, "/api/verification/*/status").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/disputes/*/resolve").hasRole("ADMIN")
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
            .requestMatchers(HttpMethod.POST, "/api/requests").hasRole("SEEKER")
            .requestMatchers(HttpMethod.GET, "/api/requests/my").hasRole("SEEKER")
            .requestMatchers(HttpMethod.PUT, "/api/requests/*").hasRole("SEEKER")
            .requestMatchers(HttpMethod.DELETE, "/api/requests/*").hasRole("SEEKER")
            .requestMatchers(HttpMethod.GET, "/api/requests/worker/my").hasRole("WORKER")
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
    return (request, response, authException) -> response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
        "Unauthorized");
  }

  @Bean
  public AccessDeniedHandler accessDeniedHandler() {
    return (request, response, accessDeniedException) -> response.sendError(HttpServletResponse.SC_FORBIDDEN,
        "Forbidden");
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
