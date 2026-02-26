package lk.wedalk.reviews.controller;

/**
 * ReviewController.java — Review REST Controller
 *
 * <p>This file should contain: - @RestController, @RequestMapping("/api/reviews") annotations -
 * Inject ReviewService - Endpoints: - POST /api/reviews — Create a review (seeker, after
 * completion) - GET /api/reviews/worker/{workerId} — Get all reviews for a worker - GET
 * /api/reviews/my — Get current user's submitted reviews - All endpoints return
 * ApiResponse<ReviewResponse>
 *
 * <p>Purpose: Exposes review creation and retrieval APIs.
 */
