package lk.wedalk.auth.service;

import lk.wedalk.auth.dto.AuthResponse;
import lk.wedalk.auth.dto.LoginRequest;
import lk.wedalk.auth.dto.RegisterRequest;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.UnauthorizedException;
import lk.wedalk.security.CustomUserDetailsService;
import lk.wedalk.security.JwtService;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final CustomUserDetailsService userDetailsService;
  private final JwtService jwtService;

  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new BadRequestException("Email is already registered");
    }
    Role role = Role.valueOf(request.getRole().name());
    if (role == Role.ADMIN) {
      throw new BadRequestException("Admin registration is not allowed");
    }

    User user =
        User.builder()
            .fullName(request.getFullName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .phoneNumber(request.getPhone())
            .district(request.getDistrict())
            .role(role)
            .isSuspended(false)
            .build();

    User saved = userRepository.save(user);
    UserDetails details = userDetailsService.loadUserByUsername(saved.getEmail());
    String token = jwtService.generateToken(details, saved.getId(), saved.getRole().name());
    return AuthResponse.builder()
        .token(token)
        .userId(saved.getId())
        .email(saved.getEmail())
        .fullName(saved.getFullName())
        .role(saved.getRole().name())
        .phoneNumber(saved.getPhoneNumber())
        .build();
  }

  public AuthResponse login(LoginRequest request) {
    try {
      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
    } catch (DisabledException ex) {
      throw new UnauthorizedException("Your account has been banned. Please contact support.");
    } catch (BadCredentialsException ex) {
      throw new UnauthorizedException("Invalid email or password");
    }

    User user =
        userRepository
            .findByEmail(request.getEmail())
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

    UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
    String token = jwtService.generateToken(details, user.getId(), user.getRole().name());
    return AuthResponse.builder()
        .token(token)
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole().name())
        .phoneNumber(user.getPhoneNumber())
        .build();
  }
}
