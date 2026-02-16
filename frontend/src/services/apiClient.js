import axios from 'axios';

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

export default apiClient;
