import apiClient from './apiClient';

export const getAllUsers = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);

  const query = params.toString();
  const response = await apiClient.get(`/admin/users${query ? `?${query}` : ''}`);
  return response.data.data;
};

/**
 * Toggles the active/suspended status of a user account.
 * Backend flips isSuspended and returns the updated UserDto.
 *
 * @param {number} userId - The ID of the user to toggle.
 * @returns {Promise<Object>} The updated user DTO.
 */
export const toggleUserStatus = async (userId) => {
  const response = await apiClient.patch(`/admin/users/${userId}/status`);
  return response.data.data;
};
