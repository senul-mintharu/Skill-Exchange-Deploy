package lk.wedalk.profiles.model;

import jakarta.persistence.*;
import lk.wedalk.users.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "worker_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @ElementCollection(fetch = FetchType.EAGER) // EAGER for simplicity in demo
    @CollectionTable(name = "worker_skills", joinColumns = @JoinColumn(name = "worker_id"))
    @Column(name = "skill")
    private List<String> skills;

    private String district;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "worker_service_areas", joinColumns = @JoinColumn(name = "worker_id"))
    @Column(name = "area")
    private List<String> serviceAreas;

    private double hourlyRate;

    private String availability;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
