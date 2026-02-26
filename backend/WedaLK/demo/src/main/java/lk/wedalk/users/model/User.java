package lk.wedalk.users.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String password; // hashed

    private String phone;

    private String district;

    // For simplicity, using String for Role in this iteration, or could be an Enum
    // Let's stick to the prompt's simplicity if possible but Enum is safer.
    // The placeholder had Role role; let's implement a simple Role enum or String.
    // I'll use String for now to avoid dependency on a Role enum file if it doesn't
    // exist,
    // or I'll check if the Role enum exists.
    // The previous view_file of User.java showed: Role role —
    // @Enumerated(EnumType.STRING).
    // I should create the Role enum too if I use it.
    // To be safe and quick, I'll use String for now since no login is implemented,
    // or just comment it out if not critical.
    // Ideally, I should create the Role enum. Let's create it in
    // `lk.wedalk.users.model`.

    @Enumerated(EnumType.STRING)
    private Role role;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
