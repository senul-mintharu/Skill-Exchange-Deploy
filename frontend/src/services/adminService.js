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
