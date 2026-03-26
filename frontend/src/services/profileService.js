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
