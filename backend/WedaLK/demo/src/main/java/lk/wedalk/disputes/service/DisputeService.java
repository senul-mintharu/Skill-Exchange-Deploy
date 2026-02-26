package lk.wedalk.disputes.service;

/**
 * DisputeService.java — Dispute Business Logic
 *
 * <p>This file should contain: - @Service annotation - Inject DisputeRepository,
 * ServiceRequestRepository, UserRepository - Methods: - DisputeResponse createDispute(Long
 * seekerId, DisputeCreateRequest request) - Validate request exists and is ASSIGNED - Mark request
 * as NOT_COMPLETED - Create dispute with OPEN status - List<DisputeResponse> getOpenDisputes() —
 * for admin dashboard - DisputeResponse getDisputeById(Long id) - DisputeResponse
 * resolveDispute(Long adminId, DisputeResolutionRequest request) - Update dispute status to
 * RESOLVED - Record admin notes and resolvedAt timestamp
 *
 * <p>Purpose: Manages dispute lifecycle — creation when "Not Completed", admin resolution.
 */
