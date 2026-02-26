package lk.wedalk.admin.controller;

/**
 * AdminController.java — Admin REST Controller
 *
 * <p>This file should contain: - @RestController, @RequestMapping("/api/admin") annotations -
 * Inject AdminService, UserService - Endpoints: - GET /api/admin/users — List all users (with
 * filters) - GET /api/admin/users/{id} — Get user details - POST /api/admin/users/{id}/suspend —
 * Suspend a user - POST /api/admin/users/{id}/unsuspend — Unsuspend a user - GET /api/admin/stats —
 * Platform statistics (total users, requests, etc.) - All endpoints require ADMIN role - All
 * endpoints return ApiResponse
 *
 * <p>Purpose: Admin-only endpoints for user management and platform oversight.
 */
