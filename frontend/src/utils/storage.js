/**
 * storage.js — Token & Session Storage Helpers
 *
 * Abstracts localStorage access for authentication data.
 * Used by authService, apiClient, useAuth hook.
 */

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const setUser = (userObj) => {
  localStorage.setItem(USER_KEY, JSON.stringify(userObj));
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const clearAuth = () => {
  removeToken();
  removeUser();
};

export const isLoggedIn = () => {
  return !!getToken();
};
