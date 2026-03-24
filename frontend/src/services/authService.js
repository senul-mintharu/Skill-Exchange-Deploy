import apiClient from './apiClient';
import { clearAuth, getToken, getUser, isLoggedIn, setToken, setUser } from '../utils/storage';

const normalizeAuthPayload = (payload) => ({
  id: payload.userId,
  email: payload.email,
  fullName: payload.fullName,
  role: payload.role
});

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  const payload = response?.data?.data;

  if (!payload?.token) {
    throw new Error('Invalid login response');
  }

  setToken(payload.token);
  setUser(normalizeAuthPayload(payload));
  return normalizeAuthPayload(payload);
};

export const register = async (registerData) => {
  const response = await apiClient.post('/auth/register', registerData);
  const payload = response?.data?.data;

  if (!payload?.token) {
    throw new Error('Invalid register response');
  }

  setToken(payload.token);
  setUser(normalizeAuthPayload(payload));
  return normalizeAuthPayload(payload);
};

export const logout = () => {
  clearAuth();
};

export const getCurrentUser = () => getUser();

export const updateCurrentUser = (updates) => {
  const current = getUser();
  if (!current) return null;
  const merged = { ...current, ...updates };
  setUser(merged);
  return merged;
};

export const isAuthenticated = () => isLoggedIn() && !!getToken();

export const getDefaultRouteForRole = (role) => {
  if (role === 'SEEKER') return '/seeker/dashboard';
  if (role === 'WORKER') return '/worker/dashboard';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/';
};
