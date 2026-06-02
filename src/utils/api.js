import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // This proxies to the backend running on port 3005 in dev
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pdfmaster_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if session expired
      localStorage.removeItem('pdfmaster_token');
      localStorage.removeItem('pdfmaster_user');
      // Redirect handled by React Router in AuthContext or App component
    }
    return Promise.reject(error);
  }
);

export default api;
