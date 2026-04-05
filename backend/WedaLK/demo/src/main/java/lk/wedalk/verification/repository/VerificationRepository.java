package lk.wedalk.verification.repository;

import java.util.List;
import java.util.Optional;
import lk.wedalk.common.enums.VerificationStatus;
import lk.wedalk.verification.model.VerificationSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VerificationRepository extends JpaRepository<VerificationSubmission, Long> {

    Optional<VerificationSubmission> findByWorkerId(Long workerId);

    List<VerificationSubmission> findByStatus(VerificationStatus status);

    List<VerificationSubmission> findByStatusOrderBySubmittedAtAsc(VerificationStatus status);
}
