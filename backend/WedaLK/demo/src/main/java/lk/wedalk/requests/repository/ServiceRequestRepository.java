package lk.wedalk.requests.repository;

import java.util.List;
import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.enums.ServiceCategory;
import lk.wedalk.requests.model.ServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * ServiceRequestRepository.java — Service Request Repository
 *
 * <p>Data access layer for service requests.
 */
@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

  List<ServiceRequest> findBySeekerId(Long seekerId);

  List<ServiceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

  List<ServiceRequest> findByLocationAreaContainingIgnoreCaseAndStatus(
      String locationArea, RequestStatus status);

  List<ServiceRequest> findByCategoryAndStatus(ServiceCategory category, RequestStatus status);

    List<ServiceRequest> findByLocationAreaContainingIgnoreCaseAndCategoryAndStatus(
            String locationArea, ServiceCategory category, RequestStatus status);

    /**
     * Paginated browse with optional keyword, category, and location filters.
     * Keyword searches across title and description (case-insensitive).
     * Uses COALESCE for null-safe parameter binding (Hibernate 6 compatible).
     */
    @Query("SELECT sr FROM ServiceRequest sr WHERE sr.status = :status " +
            "AND (COALESCE(:keyword, '') = '' OR (LOWER(sr.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "    OR LOWER(sr.description) LIKE LOWER(CONCAT('%', :keyword, '%')))) " +
            "AND (:category IS NULL OR sr.category = :category) " +
            "AND (COALESCE(:locationArea, '') = '' OR LOWER(sr.locationArea) LIKE LOWER(CONCAT('%', :locationArea, '%')))")
    Page<ServiceRequest> browseOpenRequests(
            @Param("status") RequestStatus status,
            @Param("keyword") String keyword,
            @Param("category") ServiceCategory category,
            @Param("locationArea") String locationArea,
            Pageable pageable);
}
