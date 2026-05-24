import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OPERATOR' | 'ACCOUNTANT' | 'HR' | 'MANAGER' | 'ADMIN';
  department?: string;
  position?: string;
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe extraction for Next.js SSR environment
  const getInitialToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('service_desk_token');
    }
    return null;
  };

  const getInitialUser = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('service_desk_user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  };

  const token = getInitialToken();
  const user = getInitialUser();

  return {
    token,
    user,
    isAuthenticated: !!token,
    setAuth: (token, user) => {
      localStorage.setItem('service_desk_token', token);
      localStorage.setItem('service_desk_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },
    clearAuth: () => {
      localStorage.removeItem('service_desk_token');
      localStorage.removeItem('service_desk_user');
      set({ token: null, user: null, isAuthenticated: false });
    },
    updateUser: (updatedUser) => {
      set((state) => {
        if (!state.user) return state;
        const newUser = { ...state.user, ...updatedUser };
        localStorage.setItem('service_desk_user', JSON.stringify(newUser));
        return { user: newUser };
      });
    },
  };
});
