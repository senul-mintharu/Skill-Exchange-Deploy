package lk.wedalk.config;

import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            if (userRepository.findByEmail("worker1@test.com").isEmpty()) {
                // User 1
                User user1 = User.builder()
                        .fullName("Test Worker One")
                        .email("worker1@test.com")
                        .password("password")
                        .district("Colombo")
                        .role(Role.WORKER)
                        .build();
                userRepository.save(user1);
                System.out.println("Seeded User 1: " + user1.getId());
            }

            if (userRepository.findByEmail("worker2@test.com").isEmpty()) {
                // User 2
                User user2 = User.builder()
                        .fullName("Test Worker Two")
                        .email("worker2@test.com")
                        .password("password")
                        .district("Gampaha")
                        .role(Role.WORKER)
                        .build();
                userRepository.save(user2);
                System.out.println("Seeded User 2: " + user2.getId());
            }

            if (userRepository.findByEmail("worker3@test.com").isEmpty()) {
                // User 3
                User user3 = User.builder()
                        .fullName("Test Worker Three")
                        .email("worker3@test.com")
                        .password("password")
                        .district("Kandy")
                        .role(Role.WORKER)
                        .build();
                userRepository.save(user3);
                System.out.println("Seeded User 3: " + user3.getId());
            }
        };

    }
}
