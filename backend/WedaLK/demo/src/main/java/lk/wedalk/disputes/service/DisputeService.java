package lk.wedalk.disputes.service;

import java.util.List;
import java.util.stream.Collectors;
import lk.wedalk.common.PagedResponse;
import lk.wedalk.common.enums.DisputeStatus;
import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.common.exceptions.UnauthorizedException;
import lk.wedalk.disputes.dto.DisputeCreateRequest;
import lk.wedalk.disputes.dto.DisputeResponse;
import lk.wedalk.disputes.model.Dispute;
import lk.wedalk.disputes.repository.DisputeRepository;
import lk.wedalk.requests.model.ServiceRequest;
import lk.wedalk.requests.repository.ServiceRequestRepository;
import lk.wedalk.users.model.Role;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * DisputeService.java — Dispute Business Logic
 *
 * <p>
 * Manages dispute lifecycle — creation when "Not Completed", admin resolution.
 *
 * <p>
 * SCRUM-94: Enforces strict ownership validation —
 * only the seeker who originally posted the service request can submit a
 * dispute.
 * Workers are blocked from submitting disputes entirely.
 */
@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final UserRepository userRepository;

    /**
     * Creates a dispute for a service request marked as "Not Completed".
     *
     * <p>
     * SCRUM-94 Ownership Validation:
     * <ul>
     * <li>AC3: Only users with role SEEKER can submit disputes</li>
     * <li>AC1/AC2: The authenticated seeker must be the original author of the
     * ServiceRequest</li>
     * </ul>
     *
     * @param seekerId the ID of the authenticated user attempting to submit the
     *                 dispute
     * @param request  the dispute creation payload
     * @return DisputeResponse with the created dispute details
     */
    @Transactional
    public DisputeResponse createDispute(Long seekerId, DisputeCreateRequest request) {
        // Fetch the authenticated user
        User seeker = userRepository.findById(seekerId)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        // AC3 — Prevent Worker Submissions: Only seekers can submit disputes
        if (seeker.getRole() != Role.SEEKER) {
            throw new UnauthorizedException("Only seekers can initiate disputes");
        }

        // Fetch the service request
        ServiceRequest serviceRequest = serviceRequestRepository.findById(request.getRequestId())
                .orElseThrow(() -> new NotFoundException("Service request not found"));

        // AC1/AC2 — Ownership Validation: Verify the seeker is the original author of
        // this request
        if (!serviceRequest.getSeeker().getId().equals(seekerId)) {
            throw new UnauthorizedException(
                    "You do not have permission to dispute this job. Only the seeker who posted this request can submit a dispute.");
        }

        // Validate request status — disputes can only be created for ASSIGNED or
        // NOT_COMPLETED requests
        if (serviceRequest.getStatus() != RequestStatus.ASSIGNED
                && serviceRequest.getStatus() != RequestStatus.NOT_COMPLETED) {
            throw new BadRequestException(
                    "Disputes can only be created for ASSIGNED or NOT_COMPLETED requests. Current status: "
                            + serviceRequest.getStatus());
        }

        // Check if a dispute already exists for this request
        if (disputeRepository.existsByRequestId(request.getRequestId())) {
            throw new BadRequestException("A dispute has already been raised for this request");
        }

        // Determine the assigned worker
        User worker = serviceRequest.getAssignedWorker();
        if (worker == null) {
            throw new BadRequestException("No worker is assigned to this request");
        }

        // Mark request as NOT_COMPLETED if it isn't already
        if (serviceRequest.getStatus() != RequestStatus.NOT_COMPLETED) {
            serviceRequest.setStatus(RequestStatus.NOT_COMPLETED);
            serviceRequestRepository.save(serviceRequest);
        }

        // Save dispute
        Dispute dispute = Dispute.builder()
                .request(serviceRequest)
                .seeker(seeker)
                .worker(worker)
                .seekerReason(request.getReason())
                .status(DisputeStatus.OPEN)
                .build();

        Dispute savedDispute = disputeRepository.save(dispute);
        return mapToResponse(savedDispute);
    }

    @Transactional(readOnly = true)
    public List<DisputeResponse> getOpenDisputes() {
        List<Dispute> disputes = disputeRepository.findByStatusOrderByCreatedAtAsc(DisputeStatus.OPEN);
        return disputes.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagedResponse<DisputeResponse> getOpenDisputesPaged(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);

        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Dispute> disputes = disputeRepository.findByStatus(DisputeStatus.OPEN, pageable);

        List<DisputeResponse> content = disputes.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<DisputeResponse>builder()
                .content(content)
                .page(disputes.getNumber())
                .size(disputes.getSize())
                .totalElements(disputes.getTotalElements())
                .totalPages(disputes.getTotalPages())
                .last(disputes.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public DisputeResponse getDisputeById(Long id) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Dispute not found"));
        return mapToResponse(dispute);
    }

    @Transactional(readOnly = true)
    public DisputeResponse getDisputeByRequestForUser(Long requestId, Long currentUserId, Role currentUserRole) {
        Dispute dispute = disputeRepository.findByRequestId(requestId)
                .orElseThrow(() -> new NotFoundException("Dispute not found"));

        if (currentUserRole == Role.ADMIN) {
            return mapToResponse(dispute);
        }

        boolean isSeeker = dispute.getSeeker() != null
                && dispute.getSeeker().getId() != null
                && dispute.getSeeker().getId().equals(currentUserId);
        boolean isWorker = dispute.getWorker() != null
                && dispute.getWorker().getId() != null
                && dispute.getWorker().getId().equals(currentUserId);

        if (!isSeeker && !isWorker) {
            throw new UnauthorizedException("You do not have permission to view this dispute");
        }

        return mapToResponse(dispute);
    }

    @Transactional(readOnly = true)
    public List<DisputeResponse> getDisputesBySeeker(Long seekerId) {
        List<Dispute> disputes = disputeRepository.findBySeekerId(seekerId);
        return disputes.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public DisputeResponse resolveDispute(Long disputeId, Long adminId, String resolution) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        if (admin.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only admins can resolve disputes");
        }

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NotFoundException("Dispute not found"));

        if (dispute.getStatus() == DisputeStatus.RESOLVED) {
            throw new BadRequestException("Dispute is already resolved");
        }

        // Status is always assigned server-side for admin resolution.
        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolution(resolution);
        dispute.setResolvedBy(admin);
        dispute.setResolvedAt(LocalDateTime.now());

        Dispute saved = disputeRepository.save(dispute);
        return mapToResponse(saved);
    }

    private DisputeResponse mapToResponse(Dispute dispute) {
        return DisputeResponse.builder()
                .id(dispute.getId())
                .requestId(dispute.getRequest().getId())
                .requestTitle(dispute.getRequest().getTitle())
                .seekerId(dispute.getSeeker().getId())
                .seekerName(dispute.getSeeker().getFullName())
                .workerId(dispute.getWorker().getId())
                .workerName(dispute.getWorker().getFullName())
                .seekerReason(dispute.getSeekerReason())
                .workerResponse(dispute.getWorkerResponse())
                .status(dispute.getStatus())
                .resolution(dispute.getResolution())
                .resolvedAt(dispute.getResolvedAt())
                .createdAt(dispute.getCreatedAt())
                .build();
    }
}
