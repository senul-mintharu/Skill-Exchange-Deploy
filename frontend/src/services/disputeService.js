/**
 * disputeService.js — Dispute API Service
 *
 * Handles dispute submission and retrieval.
 * SCRUM-94: Only the seeker who originally posted the request can submit a dispute.
 * The backend enforces ownership validation and returns 403 if violated.
 */

import apiClient from './apiClient';

/**
 * Submit a dispute for a service request marked as "Not Completed".
 * @param {Object} disputeData - { requestId, reason }
 * @returns {Promise<Object>} Created dispute response
 */
export const submitDispute = async (disputeData) => {
  const response = await apiClient.post('/disputes', disputeData);
  return response.data.data;
};

/**
 * Get all disputes submitted by the current user (seeker).
 * @returns {Promise<Array>} List of disputes
 */
export const getMyDisputes = async () => {
  const response = await apiClient.get('/disputes/my');
  return response.data.data;
};

/**
 * Get a specific dispute by ID.
 * @param {number} id - Dispute ID
 * @returns {Promise<Object>} Dispute details
 */
export const getDisputeById = async (id) => {
  const response = await apiClient.get(`/disputes/${id}`);
  return response.data.data;
};

/**
 * Get dispute details by request ID (admin, seeker-owner, or assigned worker).
 * @param {number} requestId - Service request ID
 * @returns {Promise<Object>} Dispute details
 */
export const getDisputeByRequest = async (requestId) => {
  const response = await apiClient.get(`/disputes/request/${requestId}`);
  return response.data.data;
};

/**
 * Get all open disputes (admin only).
 * @returns {Promise<Array>} List of open disputes
 */
export const getOpenDisputes = async () => {
  const response = await apiClient.get('/disputes/open');
  return response.data.data;
};

/**
 * Get paginated open disputes (admin only).
 * @param {Object} params - { page, size }
 * @returns {Promise<Object>} Paged response { content, page, size, totalElements, totalPages, last }
 */
export const getOpenDisputesPaged = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append('page', params.page);
  if (params.size !== undefined) query.append('size', params.size);

  const response = await apiClient.get(`/disputes/open?${query.toString()}`);
  return response.data.data;
};
