package lk.wedalk.disputes.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lk.wedalk.common.enums.DisputeResolveOutcome;
import lk.wedalk.common.enums.DisputeStatus;
import lk.wedalk.requests.model.ServiceRequest;
import lk.wedalk.users.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Dispute.java — Dispute JPA Entity
 *
 * <p>Created when a seeker marks a request as "Not Completed".
 * Admin reviews and resolves the dispute.
 */
@Entity
@Table(name = "disputes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private ServiceRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seeker_id", nullable = false)
    private User seeker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String seekerReason;

    @Column(columnDefinition = "TEXT")
    private String workerResponse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DisputeStatus status;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolve_outcome", length = 50)
    private DisputeResolveOutcome resolveOutcome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = DisputeStatus.OPEN;
        }
    }
}
