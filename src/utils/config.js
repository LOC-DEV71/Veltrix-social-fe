// Centralized configuration helper reading strictly from VITE_API_URL environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
