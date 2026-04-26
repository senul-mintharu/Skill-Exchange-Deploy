import axios from 'axios';
import { getToken, clearAuth } from '../utils/storage';

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8081/api',
  timeout: 15000,
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

const isRetryableError = (error) => {
  const method = String(error?.config?.method || '').toLowerCase();
  if (method !== 'get') return false;
  if (error?.config?.__retried) return false;

  const status = error?.response?.status;
  if (status && RETRYABLE_STATUS_CODES.has(status)) return true;

  const code = error?.code;
  return code === 'ECONNABORTED' || code === 'ERR_NETWORK';
};

const getStatusFallbackMessage = (status) => {
  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return 'The requested resource was not found.';
  }
  if (status === 409) {
    return 'This action conflicts with existing data. Please refresh and try again.';
  }
  if (status === 503) {
    return 'The service is temporarily unavailable. Please try again shortly.';
  }
  if (status >= 500) {
    return 'A server error occurred. Please try again later.';
  }
  return '';
};

const normalizeApiError = (error) => {
  const status = error?.response?.status || 0;
  const responseData = error?.response?.data;
  const responseMessage =
    (typeof responseData?.message === 'string' && responseData.message.trim()) ||
    (typeof responseData?.error === 'string' && responseData.error.trim()) ||
    '';

  let userMessage = responseMessage || getStatusFallbackMessage(status);
  if (!userMessage && (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK')) {
    userMessage = 'Cannot reach the server. Check your internet connection, then try again.';
  }
  if (!userMessage) {
    userMessage = 'Something went wrong. Please try again.';
  }

  error.userMessage = userMessage;
  error.normalized = {
    status,
    code: error?.code || '',
    message: userMessage,
    rawMessage: responseMessage || error?.message || '',
  };
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (isRetryableError(error)) {
      error.config.__retried = true;
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
      return apiClient(error.config);
    }

    normalizeApiError(error);

    if (error?.response?.status === 401) {
      clearAuth();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
