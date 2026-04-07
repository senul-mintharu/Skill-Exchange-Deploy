package lk.wedalk.disputes.repository;

import java.util.List;
import java.util.Optional;
import lk.wedalk.common.enums.DisputeStatus;
import lk.wedalk.disputes.model.Dispute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * DisputeRepository.java — Dispute Data Access Layer
 *
 * <p>Data access for disputes — supports admin review queue and user dispute history.
 */
@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    List<Dispute> findByStatus(DisputeStatus status);

    Optional<Dispute> findByRequestId(Long requestId);

    List<Dispute> findBySeekerId(Long seekerId);

    List<Dispute> findByWorkerId(Long workerId);

    List<Dispute> findByStatusOrderByCreatedAtAsc(DisputeStatus status);

    Page<Dispute> findByStatus(DisputeStatus status, Pageable pageable);

    boolean existsByRequestId(Long requestId);
}
