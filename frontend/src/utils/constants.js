/**
 * constants.js — Application Constants
 *
 * Single source of truth for all constants used across the frontend.
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
