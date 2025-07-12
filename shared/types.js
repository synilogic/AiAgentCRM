// Shared types and constants for the WhatsApp CRM Platform

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Lead statuses
export const LEAD_STATUSES = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed'
};

// Plan types
export const PLAN_TYPES = {
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password'
  },
  LEADS: {
    LIST: '/api/leads',
    CREATE: '/api/leads',
    UPDATE: '/api/leads/:id',
    DELETE: '/api/leads/:id'
  },
  PLANS: {
    LIST: '/api/plans',
    CREATE: '/api/plans',
    UPDATE: '/api/plans/:id',
    DELETE: '/api/plans/:id'
  }
}; 