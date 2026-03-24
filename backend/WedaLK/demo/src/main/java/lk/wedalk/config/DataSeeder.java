package lk.wedalk.config;

import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.full-name}")
    private String adminFullName;

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = User.builder()
                        .fullName(adminFullName)
                        .email(adminEmail)
                        .password(passwordEncoder.encode(adminPassword))
                        .district("Colombo")
                        .role(Role.ADMIN)
                        .isSuspended(false)
                        .build();
                userRepository.save(admin);
                System.out.println("Seeded Admin User: " + admin.getId());
            }

            if (userRepository.findByEmail("worker1@test.com").isEmpty()) {
                User user1 = User.builder()
                        .fullName("Test Worker One")
                        .email("worker1@test.com")
                        .password(passwordEncoder.encode("password"))
                        .district("Colombo")
                        .role(Role.WORKER)
                        .build();
                userRepository.save(user1);
                System.out.println("Seeded User 1: " + user1.getId());
            }

            if (userRepository.findByEmail("worker2@test.com").isEmpty()) {
                User user2 = User.builder()
                        .fullName("Test Worker Two")
                        .email("worker2@test.com")
                        .password(passwordEncoder.encode("password"))
                        .district("Gampaha")
                        .role(Role.WORKER)
                        .build();
                userRepository.save(user2);
                System.out.println("Seeded User 2: " + user2.getId());
            }

            if (userRepository.findByEmail("worker3@test.com").isEmpty()) {
                User user3 = User.builder()
                        .fullName("Test Worker Three")
                        .email("worker3@test.com")
                        .password(passwordEncoder.encode("password"))
                        .district("Kandy")
                        .role(Role.WORKER)
                        .build();
                userRepository.save(user3);
                System.out.println("Seeded User 3: " + user3.getId());
            }
        };

    }
}
