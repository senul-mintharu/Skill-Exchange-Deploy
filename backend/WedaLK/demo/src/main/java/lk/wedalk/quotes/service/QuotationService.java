package lk.wedalk.quotes.service;

import lk.wedalk.common.enums.QuoteStatus;
import lk.wedalk.common.enums.RequestStatus;
import lk.wedalk.common.enums.WorkerRegistrationPaymentStatus;
import lk.wedalk.common.exceptions.BadRequestException;
import lk.wedalk.common.exceptions.NotFoundException;
import lk.wedalk.common.exceptions.UnauthorizedException;
import lk.wedalk.profiles.model.WorkerProfile;
import lk.wedalk.profiles.repository.WorkerProfileRepository;
import lk.wedalk.quotes.dto.QuoteCreateRequest;
import lk.wedalk.quotes.dto.QuoteResponse;
import lk.wedalk.quotes.model.Quotation;
import lk.wedalk.quotes.repository.QuotationRepository;
import lk.wedalk.requests.model.ServiceRequest;
import lk.wedalk.requests.repository.ServiceRequestRepository;
import lk.wedalk.users.model.User;
import lk.wedalk.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * QuotationService — Business logic for the Quotation lifecycle.
 *
 * Sprint 2, Story 1: submit a quotation (this class).
 * Sprint 2, Story 2: view / withdraw quotes — stubs prepared below.
 * Sprint 2, Story 3: seeker compare/accept/reject — stubs prepared below.
 */
@Service
@RequiredArgsConstructor
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;

    // =========================================================================
    // Story 1 — Submit a Quotation
    // =========================================================================

    /**
     * Creates and persists a new quotation for an open service request.
     *
     * Business rules enforced:
     * 1. The referenced service request must exist.
     * 2. The request must still be OPEN (not already assigned / closed).
     * 3. A worker may submit at most one quote per request (AC4).
     * 4. The submitting user must exist.
     *
     * @param workerId ID of the worker submitting the quote (from query param until
     *                 auth is wired)
     * @param request  Validated DTO containing price, ETA, optional message
     * @return QuoteResponse DTO of the newly created quotation
     */
    @Transactional
    public QuoteResponse createQuote(Long workerId, QuoteCreateRequest request) {

        // 1. Validate the service request exists
        ServiceRequest serviceRequest = serviceRequestRepository
                .findById(request.getRequestId())
                .orElseThrow(() -> new NotFoundException(
                        "Service request #" + request.getRequestId() + " not found"));

        // 2. Validate the request is still open for quotations
        if (serviceRequest.getStatus() != RequestStatus.OPEN) {
            throw new BadRequestException(
                    "Service request #" + request.getRequestId()
                            + " is no longer accepting quotations (status: "
                            + serviceRequest.getStatus() + ")");
        }

        // 3. Validate the worker exists
        User worker = userRepository
                .findById(workerId)
                .orElseThrow(() -> new NotFoundException("Worker with ID " + workerId + " not found"));

        // 4. Prevent duplicate quotation (AC4)
        if (quotationRepository.existsByRequestIdAndWorkerId(request.getRequestId(), workerId)) {
            throw new BadRequestException(
                    "You have already submitted a quotation for this request. "
                            + "You can only submit one quote per request.");
        }

        WorkerProfile workerProfile = workerProfileRepository
                .findByUserId(workerId)
                .orElseThrow(() -> new BadRequestException("Create a worker profile before submitting quotations."));
        WorkerRegistrationPaymentStatus reg = workerProfile.getRegistrationPaymentStatus() != null
                ? workerProfile.getRegistrationPaymentStatus()
                : WorkerRegistrationPaymentStatus.APPROVED;
        if (reg != WorkerRegistrationPaymentStatus.APPROVED) {
            throw new BadRequestException(
                    "Your worker registration payment must be approved before you can submit quotations.");
        }

        // 5. Build and persist the quotation
        Quotation quotation = Quotation.builder()
                .request(serviceRequest)
                .worker(worker)
                .price(request.getPrice())
                .estimatedDays(request.getEstimatedDays())
                .message(request.getMessage())
                .status(QuoteStatus.PENDING)
                .build();

        Quotation saved = quotationRepository.save(quotation);
        return mapToResponse(saved);
    }

    // =========================================================================
    // Story 2 — Worker: View & Manage Submitted Quotations
    // =========================================================================

    /**
     * Returns all quotations submitted by a given worker, newest first.
     */
    @Transactional(readOnly = true)
    public List<QuoteResponse> getQuotesByWorker(Long workerId) {
        return quotationRepository
                .findByWorkerIdOrderByCreatedAtDesc(workerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Allows a worker to withdraw a PENDING quotation.
     * Only PENDING quotes can be withdrawn — once a seeker has acted on it,
     * it cannot be recalled.
     */
    @Transactional
    public QuoteResponse withdrawQuote(Long quoteId, Long workerId) {
        Quotation quotation = findQuoteOrThrow(quoteId);

        if (!quotation.getWorker().getId().equals(workerId)) {
            throw new BadRequestException("You can only withdraw your own quotations.");
        }
        if (quotation.getStatus() != QuoteStatus.PENDING) {
            throw new BadRequestException(
                    "Only PENDING quotations can be withdrawn. "
                            + "This quote is currently " + quotation.getStatus() + ".");
        }

        quotation.setStatus(QuoteStatus.WITHDRAWN);
        return mapToResponse(quotationRepository.save(quotation));
    }

    // =========================================================================
    // Story 3 — Seeker: View & Compare Quotations (stubs — next story)
    // =========================================================================

    /**
     * Returns all quotations for a service request, ordered by price ascending.
     * Used by the seeker's Compare Quotes page.
     */
    @Transactional(readOnly = true)
    public List<QuoteResponse> getQuotesByRequest(Long requestId, Long seekerId) {
        ServiceRequest serviceRequest =
                serviceRequestRepository
                        .findById(requestId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException("Service request #" + requestId + " not found"));
        if (!serviceRequest.getSeeker().getId().equals(seekerId)) {
            throw new UnauthorizedException(
                    "You can only view quotations for your own service requests.");
        }
        return quotationRepository
                .findByRequestIdOrderByPriceAsc(requestId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Seeker accepts a specific quote:
     * - Accepted quote → ACCEPTED
     * - All other quotes for same request → NOT_ACCEPTED
     * - Service request status → ASSIGNED
     * - Assign accepted worker to the service request
     */
    @Transactional
    public QuoteResponse acceptQuote(Long quoteId, Long seekerId) {
        Quotation quotation = findQuoteOrThrow(quoteId);
        ServiceRequest serviceRequest = quotation.getRequest();

        // Only the seeker who owns the request can accept
        if (!serviceRequest.getSeeker().getId().equals(seekerId)) {
            throw new UnauthorizedException("You can only accept quotes on your own requests.");
        }
        if (serviceRequest.getStatus() != RequestStatus.OPEN) {
            throw new BadRequestException("This request is no longer accepting quote decisions.");
        }
        if (quotation.getStatus() != QuoteStatus.PENDING) {
            throw new BadRequestException("Only PENDING quotations can be accepted.");
        }

        // Accept this quote
        quotation.setStatus(QuoteStatus.ACCEPTED);
        quotationRepository.save(quotation);

        // Mark all other quotes as NOT_ACCEPTED
        List<Quotation> otherQuotes = quotationRepository
                .findByRequestIdOrderByPriceAsc(serviceRequest.getId());
        for (Quotation q : otherQuotes) {
            if (!q.getId().equals(quoteId) && q.getStatus() != QuoteStatus.NOT_ACCEPTED) {
                q.setStatus(QuoteStatus.NOT_ACCEPTED);
                quotationRepository.save(q);
            }
        }

        // Update the request assignment and status
        serviceRequest.setAssignedWorker(quotation.getWorker());
        serviceRequest.setStatus(RequestStatus.ASSIGNED);
        serviceRequestRepository.save(serviceRequest);

        return mapToResponse(quotation);
    }

    /**
     * Seeker explicitly rejects a specific quote.
     */
    @Transactional
    public QuoteResponse rejectQuote(Long quoteId, Long seekerId) {
        Quotation quotation = findQuoteOrThrow(quoteId);

        if (!quotation.getRequest().getSeeker().getId().equals(seekerId)) {
            throw new UnauthorizedException("You can only reject quotes on your own requests.");
        }
        if (quotation.getStatus() != QuoteStatus.PENDING) {
            throw new BadRequestException("Only PENDING quotes can be rejected.");
        }

        quotation.setStatus(QuoteStatus.NOT_ACCEPTED);
        return mapToResponse(quotationRepository.save(quotation));
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private Quotation findQuoteOrThrow(Long quoteId) {
        return quotationRepository
                .findById(quoteId)
                .orElseThrow(() -> new NotFoundException("Quotation #" + quoteId + " not found"));
    }

    private QuoteResponse mapToResponse(Quotation q) {
        Long workerProfileId = workerProfileRepository
            .findByUserId(q.getWorker().getId())
            .map(profile -> profile.getId())
            .orElse(null);

        return QuoteResponse.builder()
                .id(q.getId())
                .requestId(q.getRequest().getId())
                .requestTitle(q.getRequest().getTitle())
                .workerId(q.getWorker().getId())
            .workerProfileId(workerProfileId)
                .workerName(q.getWorker().getFullName())
                .price(q.getPrice())
                .estimatedDays(q.getEstimatedDays())
                .message(q.getMessage())
                .status(q.getStatus())
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .build();
    }
}
