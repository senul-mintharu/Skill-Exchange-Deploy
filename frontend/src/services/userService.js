import apiClient from './apiClient';

export const getMyAccount = async () => {
  const response = await apiClient.get('/users/me');
  return response.data.data;
};

export const updateMyAccount = async (payload) => {
  const response = await apiClient.put('/users/me', payload);
  return response.data.data;
};

export const deleteMyAccount = async () => {
  await apiClient.delete('/users/me');
};
