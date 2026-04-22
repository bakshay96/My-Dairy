
// Vite environment variables - use import.meta.env instead of process.env
export const url2 = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030/api';

// Base URL for reference
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030/api';

// Feature flags
export const ENABLE_PAYMENT = import.meta.env.VITE_ENABLE_PAYMENT === 'true';
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

// Environment
export const ENV = import.meta.env.VITE_ENV || 'development';

// Razorpay configuration
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// console.log('api url', url2);
