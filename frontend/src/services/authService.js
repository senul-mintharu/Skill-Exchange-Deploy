/**
 * authService.js — Authentication Service (DISABLED)
 *
 * Authentication is disabled for development.
 * These are stub functions to prevent errors.
 */

/**
 * Stub login function
 */
export const login = async (email, password) => {
    console.warn('Authentication is disabled');
    return { message: 'Auth disabled' };
};

/**
 * Stub register function
 */
export const register = async (registerData) => {
    console.warn('Authentication is disabled');
    return { message: 'Auth disabled' };
};

/**
 * Stub logout function
 */
export const logout = () => {
    console.warn('Authentication is disabled');
};

/**
 * Stub getCurrentUser function
 */
export const getCurrentUser = () => {
    return null;
};

/**
 * Stub isAuthenticated function
 */
export const isAuthenticated = () => {
    return false;
};
