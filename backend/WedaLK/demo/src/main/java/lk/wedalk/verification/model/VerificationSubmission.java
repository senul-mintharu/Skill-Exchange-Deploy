package lk.wedalk.verification.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lk.wedalk.common.enums.VerificationStatus;
import lk.wedalk.users.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "verification_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @Column(name = "document_name", nullable = false)
    private String documentName;

    @Column(name = "document_path", nullable = false)
    private String documentPath;

    @Column(name = "document_content_type", nullable = false)
    private String documentContentType;

    @Column(name = "document_size_bytes", nullable = false)
    private Long documentSizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus status;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;
}
