import axios from 'axios';
import { getToken, clearAuth } from '../utils/storage';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8081/api',
  // No default Content-Type: axios auto-sets application/json for plain objects
  // and lets the browser attach the correct multipart/form-data; boundary=... for FormData.
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
