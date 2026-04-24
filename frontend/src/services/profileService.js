/**
 * profileService.js — Worker Profile API Service
 *
 * Centralizes all worker profile API calls.
 * Used by worker profile pages and seeker search.
 */

import apiClient from './apiClient';

/**
 * Get all worker profiles
 * @returns {Promise<Object>} API response with list of profiles
 */
export const getAllProfiles = async () => {
    const response = await apiClient.get('/profiles');
    return response.data;
};

/**
 * Create a new worker profile
 * @param {Object} profileData - { bio, skills[], district, serviceAreas[], hourlyRate, availability }
 * @returns {Promise<Object>} Created profile response
 */
export const createProfile = async (profileData) => {
    const response = await apiClient.post('/profiles', profileData);
    return response.data;
};

/**
 * Get a worker profile by profile ID
 * @param {number} id - Profile ID
 * @returns {Promise<Object>} Profile details
 */
export const getProfileById = async (id) => {
    const response = await apiClient.get(`/profiles/${id}`);
    return response.data;
};

/**
 * Get a worker profile by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Profile details
 */
export const getProfileByUserId = async (userId) => {
    const response = await apiClient.get(`/profiles/user/${userId}`);
    return response.data;
};

/**
 * Update an existing worker profile
 * @param {number} id - Profile ID
 * @param {Object} profileData - { bio, skills[], district, serviceAreas[], hourlyRate, availability }
 * @returns {Promise<Object>} Updated profile response
 */
export const updateProfile = async (id, profileData) => {
    const response = await apiClient.put(`/profiles/${id}`, profileData);
    return response.data;
};

/**
 * Delete a worker profile
 * @param {number} id - Profile ID
 * @returns {Promise<boolean>} True if successful
 */
export const deleteProfile = async (id) => {
    await apiClient.delete(`/profiles/${id}`);
    return true;
};

/**
 * Upload a bank transfer payment slip to complete worker profile registration.
 * @param {number} profileId - Worker profile ID
 * @param {File} slipFile - The payment slip image or PDF
 * @returns {Promise<Object>} Updated profile response
 */
export const uploadProfilePaymentSlip = async (profileId, slipFile) => {
    const formData = new FormData();
    formData.append('slip', slipFile);
    const response = await apiClient.post(`/profiles/${profileId}/payment-slip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
};

// ---- Admin: worker profile registration payment (same review flow as seeker requests) ----

export const getAdminPendingProfilePaymentSlips = async () => {
    const response = await apiClient.get('/admin/profile-payment-slips/pending');
    return response.data.data;
};

export const adminApproveProfilePaymentSlip = async (profileId) => {
    const response = await apiClient.post(`/admin/profiles/${profileId}/payment-approve`);
    return response.data.data;
};

export const adminRejectProfilePaymentSlip = async (profileId, reason = '') => {
    const response = await apiClient.post(`/admin/profiles/${profileId}/payment-reject`, { reason });
    return response.data.data;
};

/**
 * @param {number} profileId
 * @returns {Promise<Blob>}
 */
export const getAdminProfilePaymentSlipBlob = async (profileId) => {
    const response = await apiClient.get(`/profiles/${profileId}/payment-slip/view`, {
        responseType: 'blob',
    });
    return response.data;
};
