/**
 * quoteService.js — Quotation API Service
 *
 * Centralises all quotation API calls.
 * Used by: SubmitQuotePage, MyQuotesPage, RequestDetailsPage.
 */

import apiClient from './apiClient';

// ── Story 1 ─────────────────────────────────────────────────────────────────

/**
 * Submit a new quotation for a service request.
 * @param {Object} quoteData - { requestId, price, estimatedDays, message }
 * @returns {Promise<Object>} Created QuoteResponse
 */
export const createQuote = async (quoteData) => {
    const response = await apiClient.post('/quotes', quoteData);
    return response.data.data;
};

// ── Story 2 ─────────────────────────────────────────────────────────────────

/**
 * Get all quotations submitted by the current worker.
 * @returns {Promise<Array>} List of QuoteResponse objects
 */
export const getMyQuotes = async () => {
    const response = await apiClient.get('/quotes/my');
    return response.data.data;
};

/**
 * Withdraw a PENDING quotation.
 * @param {number} quoteId
 * @returns {Promise<Object>} Updated QuoteResponse
 */
export const withdrawQuote = async (quoteId) => {
    const response = await apiClient.delete(`/quotes/${quoteId}`);
    return response.data.data;
};

/**
 * Get all quotations for a service request (for seeker comparison).
 * @param {number} requestId
 * @returns {Promise<Array>} List of QuoteResponse objects, sorted price asc
 */
export const getQuotesByRequest = async (requestId) => {
    const response = await apiClient.get(`/quotes/request/${requestId}`);
    return response.data.data;
};
