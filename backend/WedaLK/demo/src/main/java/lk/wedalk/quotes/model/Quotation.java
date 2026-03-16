package lk.wedalk.quotes.model;

import jakarta.persistence.*;
import lk.wedalk.common.enums.QuoteStatus;
import lk.wedalk.requests.model.ServiceRequest;
import lk.wedalk.users.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Quotation — JPA Entity
 *
 * Represents a worker's bid on an open service request.
 * Business rule: one worker can submit at most one quote per request
 * (enforced by the unique constraint on request_id + worker_id).
 */
@Entity
@Table(name = "quotations", uniqueConstraints = {
        @UniqueConstraint(name = "uq_quotation_request_worker", columnNames = { "request_id", "worker_id" })
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The service request this quote is for. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private ServiceRequest request;

    /** The worker who submitted the quote. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    /** Quoted price in LKR. */
    @Column(nullable = false)
    private double price;

    /** Estimated number of days to complete the work. */
    @Column(name = "estimated_days", nullable = false)
    private int estimatedDays;

    /** Worker's proposal / cover message to the seeker. */
    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private QuoteStatus status = QuoteStatus.PENDING;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
