package lk.wedalk.requests.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.common.enums.UrgencyLevel;
import lk.wedalk.users.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ServiceRequest.java — Service Request JPA Entity
 *
 * <p>
 * Represents a service request posted by a seeker. Workers can browse open
 * requests and submit
 * quotations.
 */
@Entity
@Table(name = "service_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequest {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(length = 150)
  private String title;

  @Column(nullable = false, length = 2000)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private ServiceCategory category;

  @Column(nullable = false, length = 100)
  private String locationArea;

  @Enumerated(EnumType.STRING)
  @Column(length = 20)
  private UrgencyLevel urgency;

  @Column
  private Double budget;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private RequestStatus status;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "seeker_id", nullable = false)
  private User seeker;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_worker_id")
  private User assignedWorker;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
    if (status == null) {
      status = RequestStatus.OPEN;
    }
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
