package lk.wedalk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * WedaLkApplication — Main Spring Boot Application Entry Point.
 * Bootstraps the embedded Tomcat server and initializes the Spring context.
 */
@SpringBootApplication
public class WedaLkApplication {

    public static void main(String[] args) {
        SpringApplication.run(WedaLkApplication.class, args);
    }
}
