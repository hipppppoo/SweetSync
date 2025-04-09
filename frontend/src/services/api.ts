import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore'; // Import the Zustand store

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api' 
  : '/api'; // Adjust for production deployment if necessary

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Axios request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('[Frontend Interceptor] Running for request:', config.url);
    // Get the token from the Zustand store
    const token = useAuthStore.getState().token;
    console.log('[Frontend Interceptor] Token from store:', token ? `Bearer ${token.substring(0, 10)}...` : 'null'); // Log token existence/prefix

    if (token) {
      // If a token exists, add it to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Frontend Interceptor] Authorization header set');
    } else {
      console.log('[Frontend Interceptor] No token found, Authorization header NOT set');
    }
    return config; // Return the modified config
  },
  (error) => {
    // Handle request error
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

export default api; 