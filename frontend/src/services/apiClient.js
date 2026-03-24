import axios from 'axios';
import { getToken, clearAuth } from '../utils/storage';

/**
 * apiClient.js — Axios HTTP Client (Simplified)
 * 
 * No authentication - direct API calls to backend
 */
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8081/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuth();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
