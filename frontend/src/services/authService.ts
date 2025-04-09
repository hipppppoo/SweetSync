import api from './api';
import { useAuthStore } from '../store/authStore';

// Define the expected shape of auth responses
interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
  };
}

// Define the shape of credentials
interface Credentials {
  email: string;
  password: string;
}

// Signup function
export const signup = async (credentials: Credentials): Promise<AuthResponse> => {
  const { setLoading, setAuthData, setError } = useAuthStore.getState();
  setLoading(true);
  try {
    const response = await api.post<AuthResponse>('/auth/signup', credentials);
    setAuthData(response.data.token, response.data.user);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Signup failed';
    setError(errorMessage);
    console.error("Signup Error:", error.response || error);
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
};

// Login function
export const login = async (credentials: Credentials): Promise<AuthResponse> => {
  const { setLoading, setAuthData, setError } = useAuthStore.getState();
  setLoading(true);
  try {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    setAuthData(response.data.token, response.data.user);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Login failed';
    setError(errorMessage);
    console.error("Login Error:", error.response || error);
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
};

// Logout function (clears store data)
export const logout = () => {
  const { clearAuthData } = useAuthStore.getState();
  clearAuthData();
  // Optionally: Redirect user or perform other cleanup
  console.log("User logged out.");
}; 