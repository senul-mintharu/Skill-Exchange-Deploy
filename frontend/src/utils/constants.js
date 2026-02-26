/**
 * constants.js — Application Constants
 *
 * This file should contain:
 * - Enum-like objects matching backend enums:
 *
 *   export const ROLES = { SEEKER: 'SEEKER', WORKER: 'WORKER', ADMIN: 'ADMIN' };
 *
 *   export const REQUEST_STATUS = {
 *     OPEN: 'OPEN', ASSIGNED: 'ASSIGNED', COMPLETED: 'COMPLETED',
 *     NOT_COMPLETED: 'NOT_COMPLETED', CANCELLED: 'CANCELLED'
 *   };
 *
 *   export const QUOTE_STATUS = { PENDING: 'PENDING', ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED' };
 *
 *   export const VERIFICATION_STATUS = {
 *     NONE: 'NONE', PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED'
 *   };
 *
 *   export const DISPUTE_STATUS = { OPEN: 'OPEN', RESOLVED: 'RESOLVED' };
 *
 * - Sri Lankan districts list:
 *   export const DISTRICTS = [
 *     'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
 *     'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
 *     'Mullaitivu', 'Vavuniya', 'Trincomalee', 'Batticaloa', 'Ampara',
 *     'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
 *     'Monaragala', 'Ratnapura', 'Kegalle'
 *   ];
 *
 * - Service categories:
 *   export const CATEGORIES = [
 *     'Plumbing', 'Electrical', 'Painting', 'Carpentry', 'Cleaning',
 *     'Gardening', 'AC Repair', 'Appliance Repair', 'Moving', 'Other'
 *   ];
 *
 * - API base URL:
 *   export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';
 *
 * Purpose:
 *   Single source of truth for all constants used across the frontend.
 */

export const CATEGORIES = [
    { value: 'PLUMBING', label: 'Plumbing', icon: '🔧' },
    { value: 'ELECTRICAL', label: 'Electrical', icon: '⚡' },
    { value: 'CARPENTRY', label: 'Carpentry', icon: '🪚' },
    { value: 'PAINTING', label: 'Painting', icon: '🎨' },
    { value: 'CLEANING', label: 'Cleaning', icon: '🧹' },
    { value: 'AC_REPAIR', label: 'AC Repair', icon: '❄️' },
    { value: 'APPLIANCE_REPAIR', label: 'Appliance Repair', icon: '🔌' },
    { value: 'GARDENING', label: 'Gardening', icon: '🌱' },
    { value: 'MASONRY', label: 'Masonry', icon: '🧱' },
    { value: 'ROOFING', label: 'Roofing', icon: '🏠' },
    { value: 'PEST_CONTROL', label: 'Pest Control', icon: '🐛' },
    { value: 'OTHER', label: 'Other', icon: '⋯' }
];

export const URGENCY_LEVELS = [
    { value: 'URGENT', label: 'Urgent', weight: 4 },
    { value: 'HIGH', label: 'High', weight: 3 },
    { value: 'MEDIUM', label: 'Medium', weight: 2 },
    { value: 'LOW', label: 'Low', weight: 1 }
];

export const getCategoryIcon = (category) => {
    const found = CATEGORIES.find(c => c.value === category);
    return found ? found.icon : '🔨';
};

export const formatCategoryLabel = (category) => {
    if (!category) return 'Service Request';
    const found = CATEGORIES.find(c => c.value === category);
    return found ? found.label : category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatBudget = (budget) => {
    if (budget === null || budget === undefined) return 'Negotiable';
    if (budget === 0) return 'Free / Volunteer';
    return `Rs. ${Number(budget).toLocaleString()}`;
};
