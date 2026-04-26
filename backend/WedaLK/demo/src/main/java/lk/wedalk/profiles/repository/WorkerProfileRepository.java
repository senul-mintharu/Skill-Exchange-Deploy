package lk.wedalk.profiles.repository;

import java.util.List;
import java.util.Optional;
import lk.wedalk.common.enums.WorkerRegistrationPaymentStatus;
import lk.wedalk.profiles.model.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long> {
    Optional<WorkerProfile> findByUserId(Long userId);

    List<WorkerProfile> findByRegistrationPaymentStatusOrderByUpdatedAtAsc(
            WorkerRegistrationPaymentStatus registrationPaymentStatus);
}
