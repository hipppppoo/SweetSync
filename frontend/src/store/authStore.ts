import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the shape of the user object stored in the state
interface User {
  id: string;
  email: string;
}

// Define and EXPORT the shape of the authentication state
export interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setAuthData: (token: string, user: User) => void;
  clearAuthData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the Zustand store with persistence middleware
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      // Action to set token and user data upon login/signup
      setAuthData: (token, user) => set({
        token,
        user,
        isLoading: false,
        error: null,
      }),

      // Action to clear token and user data upon logout
      clearAuthData: () => set({
        token: null,
        user: null,
        isLoading: false,
        error: null,
      }),

      // Action to set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Action to set error state
      setError: (error) => set({ error, isLoading: false }),
    }),
    {
      name: 'auth-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
      partialize: (state) => ({ token: state.token, user: state.user }), // Only persist token and user
    }
  )
); 