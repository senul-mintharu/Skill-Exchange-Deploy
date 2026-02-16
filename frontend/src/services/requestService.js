/**
 * requestService.js — Service Request API Service (Simplified)
 *
 * No authentication - uses default seekerId
 */

import apiClient from './apiClient';

// Default seeker ID for development (no auth)
const DEFAULT_SEEKER_ID = 1;

/**
 * Create a new service request
 * @param {Object} requestData - { description, category, locationArea, urgency }
 * @returns {Promise<Object>} Created request response
 */
export const createRequest = async (requestData) => {
    const response = await apiClient.post(`/requests?seekerId=${DEFAULT_SEEKER_ID}`, requestData);
    return response.data.data; // Backend wraps in ApiResponse with data field
};

/**
 * Get all requests created by the current seeker
 * @returns {Promise<Array>} List of requests
 */
export const getMyRequests = async () => {
    const response = await apiClient.get(`/requests/my?seekerId=${DEFAULT_SEEKER_ID}`);
    return response.data.data;
};

/**
 * Get all open requests (for workers to browse)
 * @returns {Promise<Array>} List of open requests
 */
export const getOpenRequests = async () => {
    const response = await apiClient.get('/requests/open');
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
