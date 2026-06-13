import axios from 'axios';

/**
 * Dedicated axios instance for Admin Panel API calls.
 * 
 * Security layers:
 *  1. Bearer JWT token (Supabase) — proves identity
 *  2. X-Admin-Key header — server returns 404 for any request missing this key,
 *     making the entire /api/admin namespace invisible to scanners & bots
 * 
 * NOTE: This key is visible in the compiled bundle to determined attackers,
 * but that is acceptable because the REAL gate is the JWT + DB role check.
 * The key is defense-in-depth to stop automated scanners, not authenticated humans.
 */
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Key': import.meta.env.VITE_ADMIN_SECRET_KEY || '',
  },
});

// Attach JWT token on every request
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pdfmaster_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pdfmaster_token');
      localStorage.removeItem('pdfmaster_user');
      window.location.href = '/login';
    }
    // 403 = logged in but not admin — send to home
    if (error.response?.status === 403) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default adminApi;
