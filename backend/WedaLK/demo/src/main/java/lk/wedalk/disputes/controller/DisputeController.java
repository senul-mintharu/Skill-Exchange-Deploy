package lk.wedalk.disputes.controller;

/**
 * DisputeController.java — Dispute REST Controller
 *
 * <p>This file should contain: - @RestController, @RequestMapping("/api/disputes") annotations -
 * Inject DisputeService - Endpoints: - POST /api/disputes — Create a dispute (seeker, when marking
 * "Not Completed") - GET /api/disputes/{id} — Get dispute details - GET /api/disputes/open — Get
 * all open disputes (admin) - POST /api/disputes/{id}/resolve — Resolve a dispute (admin) - All
 * endpoints return ApiResponse<DisputeResponse>
 *
 * <p>Purpose: Exposes dispute management APIs for seekers and admins.
 */
