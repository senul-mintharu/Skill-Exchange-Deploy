package lk.wedalk.users.model;

import jakarta.persistence.*;
import lk.wedalk.common.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_users_role", columnList = "role"),
        @Index(name = "idx_users_is_suspended", columnList = "is_suspended"),
        @Index(name = "idx_users_created_at", columnList = "created_at")
    }
)
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

    @Column(name = "phone_number")
    private String phoneNumber;

    private String district;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.NONE;

    @Builder.Default
    @Column(name = "is_suspended")
    private Boolean isSuspended = false;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
