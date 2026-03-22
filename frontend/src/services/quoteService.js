/**
 * quoteService.js — Quotation API Service
 *
 * Centralises all quotation API calls.
 * Used by: SubmitQuotePage, MyQuotesPage (Story 2), CompareQuotesPage (Story 3).
 */

import apiClient from './apiClient';

// ── Story 1 ─────────────────────────────────────────────────────────────────

/**
 * Submit a new quotation for a service request.
 * @param {Object} quoteData - { requestId, price, estimatedDays, message }
 * @param {number} workerId  - Worker's user ID (temp param until auth is wired)
 * @returns {Promise<Object>} Created QuoteResponse
 */
export const createQuote = async (quoteData, workerId = 2) => {
    const response = await apiClient.post(`/quotes?workerId=${workerId}`, quoteData);
    return response.data.data;
};

// ── Story 2 ─────────────────────────────────────────────────────────────────

/**
 * Get all quotations submitted by the current worker.
 * @param {number} workerId
 * @returns {Promise<Array>} List of QuoteResponse objects
 */
export const getMyQuotes = async (workerId = 2) => {
    const response = await apiClient.get(`/quotes/my?workerId=${workerId}`);
    return response.data.data;
};

/**
 * Withdraw a PENDING quotation.
 * @param {number} quoteId
 * @param {number} workerId
 * @returns {Promise<Object>} Updated QuoteResponse
 */
export const withdrawQuote = async (quoteId, workerId = 2) => {
    const response = await apiClient.delete(`/quotes/${quoteId}?workerId=${workerId}`);
    return response.data.data;
};

// ── Story 3 ─────────────────────────────────────────────────────────────────

/**
 * Get all quotations for a service request (for seeker comparison).
 * @param {number} requestId
 * @returns {Promise<Array>} List of QuoteResponse objects, sorted price asc
 */
export const getQuotesByRequest = async (requestId) => {
    const response = await apiClient.get(`/quotes/request/${requestId}`);
    return response.data.data;
};

/**
 * Seeker accepts a specific quote.
 * @param {number} quoteId
 * @param {number} seekerId
 * @returns {Promise<Object>} Updated QuoteResponse
 */
export const acceptQuote = async (quoteId, seekerId = 1) => {
    const response = await apiClient.post(`/quotes/${quoteId}/accept?seekerId=${seekerId}`);
    return response.data.data;
};

/**
 * Seeker rejects a specific quote.
 * @param {number} quoteId
 * @param {number} seekerId
 * @returns {Promise<Object>} Updated QuoteResponse
 */
export const rejectQuote = async (quoteId, seekerId = 1) => {
    const response = await apiClient.patch(`/quotes/${quoteId}/reject?seekerId=${seekerId}`);
    return response.data.data;
};
