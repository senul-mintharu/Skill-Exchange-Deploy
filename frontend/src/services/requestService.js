/**
 * requestService.js — Service Request API Service
 *
 * Uses authenticated JWT user identity on backend.
 */

import apiClient from './apiClient';
import { getUser } from '../utils/storage';

/**
 * Create a new service request
 * @param {Object} requestData - { description, category, locationArea, urgency }
 * @returns {Promise<Object>} Created request response
 */
export const createRequest = async (requestData) => {
    const response = await apiClient.post('/requests', requestData);
    return response.data.data; // Backend wraps in ApiResponse with data field
};

/**
 * Get all requests created by the current seeker
 * @returns {Promise<Array>} List of requests
 */
export const getMyRequests = async () => {
    const response = await apiClient.get('/requests/my');
    return response.data.data;
};

/**
 * Get all open requests (for workers to browse) - unpaginated
 * @returns {Promise<Array>} List of open requests
 */
export const getOpenRequests = async () => {
    const response = await apiClient.get('/requests/open');
    return response.data.data;
};

/**
 * Browse open requests with pagination, keyword search, filters, and server-side sort
 * @param {Object} params - { keyword, category, locationArea, page, size, sortBy }
 * @returns {Promise<Object>} Paged response { content, page, size, totalElements, totalPages, last }
 */
export const browseRequests = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.category) query.append('category', params.category);
    if (params.locationArea) query.append('locationArea', params.locationArea);
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size) query.append('size', params.size);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    const response = await apiClient.get(`/requests/browse?${query.toString()}`);
    return response.data.data;
};

/**
 * Get request by ID
 * @param {number} id - Request ID
 * @returns {Promise<Object>} Request details
 */
export const getRequestById = async (id) => {
    const response = await apiClient.get(`/requests/${id}`);
    return response.data.data;
};

/**
 * Get assigned jobs for the current worker
 * @param {number} workerId - Worker ID
 * @returns {Promise<Array>} List of assigned jobs
 */
export const getMyAssignedJobs = async () => {
    const response = await apiClient.get('/requests/worker/my');
    return response.data.data;
};

/**
 * Search requests by location and/or category
 * @param {Object} filters - { locationArea, category }
 * @returns {Promise<Array>} List of matching requests
 */
export const searchRequests = async (filters) => {
    const params = new URLSearchParams();
    if (filters.locationArea) params.append('locationArea', filters.locationArea);
    if (filters.category) params.append('category', filters.category);
    
    const response = await apiClient.get(`/requests/search?${params.toString()}`);
    return response.data.data;
};

/**
 * Update an existing service request
 * @param {number} id - Request ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated request
 */
export const updateRequest = async (id, updateData) => {
    const response = await apiClient.put(`/requests/${id}`, updateData);
    return response.data.data;
};

/**
 * Update request job outcome status (ASSIGNED -> COMPLETED / NOT_COMPLETED)
 * @param {number} id - Request ID
 * @param {string} status - COMPLETED or NOT_COMPLETED
 * @returns {Promise<Object>} Updated request
 */
export const updateRequestStatus = async (id, status) => {
    const currentUser = getUser();
    if (!currentUser?.id) {
        throw new Error('User must be logged in to update request status');
    }

    const response = await apiClient.put(
        `/requests/${id}/status?seekerId=${currentUser.id}`,
        { status }
    );
    return response.data.data;
};

/**
 * Delete (or cancel) a service request
 * @param {number} id - Request ID
 * @returns {Promise<boolean>} True if successful
 */
export const deleteRequest = async (id) => {
    await apiClient.delete(`/requests/${id}`);
    return true;
};

/**
 * Upload a bank transfer payment slip for a service request.
 * Transitions the request from PENDING_PAYMENT → PAYMENT_UNDER_REVIEW.
 * @param {number} requestId - Request ID
 * @param {File} slipFile - The payment slip image or PDF
 * @returns {Promise<Object>} Updated request
 */
export const uploadRequestPaymentSlip = async (requestId, slipFile) => {
    const formData = new FormData();
    formData.append('slip', slipFile);
    const response = await apiClient.post(`/requests/${requestId}/payment-slip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
};

// ---- Admin: payment slip review (SCRUM-106) ----

/**
 * Admin: get all requests with PAYMENT_UNDER_REVIEW status
 * @returns {Promise<Array>} List of requests pending payment review
 */
export const getAdminPendingPaymentSlips = async () => {
    const response = await apiClient.get('/admin/payment-slips/pending');
    return response.data.data;
};

/**
 * Admin: approve a payment slip — transitions request to OPEN
 * @param {number} requestId
 * @returns {Promise<Object>} Updated request
 */
export const adminApprovePaymentSlip = async (requestId) => {
    const response = await apiClient.post(`/admin/requests/${requestId}/payment-approve`);
    return response.data.data;
};

/**
 * Admin: reject a payment slip — transitions request back to PENDING_PAYMENT
 * @param {number} requestId
 * @param {string} [reason] - Optional rejection reason shown to the seeker
 * @returns {Promise<Object>} Updated request
 */
export const adminRejectPaymentSlip = async (requestId, reason = '') => {
    const response = await apiClient.post(`/admin/requests/${requestId}/payment-reject`, { reason });
    return response.data.data;
};

/**
 * Admin: fetch the raw payment slip file as a Blob (for viewing in a new tab).
 * @param {number} requestId
 * @returns {Promise<Blob>}
 */
export const getAdminPaymentSlipBlob = async (requestId) => {
    const response = await apiClient.get(`/requests/${requestId}/payment-slip/view`, {
        responseType: 'blob',
    });
    return response.data;
};
