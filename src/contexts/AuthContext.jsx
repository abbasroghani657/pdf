import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage and validate with server
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('pdfmaster_token');
      if (token) {
        try {
          // Fetch fresh user profile from backend
          const res = await api.get('/auth/me');
          setUser({ ...res.data.user, profile: res.data.profile });
        } catch (error) {
          console.error('Session validation failed:', error);
          logout(); // Clear invalid token
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, profile, session } = res.data;
      
      // Store token and set state
      localStorage.setItem('pdfmaster_token', session.access_token);
      setUser({ ...user, profile });
      
      toast.success('Welcome back!');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const loginWithOAuth = async (provider) => {
    try {
      const res = await api.post(`/auth/oauth/${provider}`);
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      toast.error(`Failed to initiate ${provider} login.`);
      console.error(error);
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      toast.success('Registration successful! You can now log in.');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      setUser(prev => ({ ...prev, profile: res.data.profile }));
      toast.success('Profile updated successfully!');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('pdfmaster_token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Redirect user to Stripe Checkout for Pro upgrade
  const upgradeToPro = async (plan = 'monthly') => {
    if (!user) {
      toast.error('Please log in first to upgrade.');
      return;
    }
    
    try {
      const res = await api.post('/payments/create-checkout-session', { plan });
      if (res.data.url) {
        // Redirect to Stripe hosted checkout page
        window.location.href = res.data.url;
      } else {
        toast.error('Could not initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Payment system is currently unavailable.');
    }
  };

  const downgradeToFree = () => {
    if (!user) return;
    toast.error('Subscription cancellation must be done via the Customer Portal (Coming Soon).');
  };

  // Determine isPro status. Fallback to localStorage if no user for demo purposes, 
  // but ideally it relies solely on the database profile.
  const isPro = user?.profile?.is_pro || false;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isPro, 
      login, 
      loginWithOAuth,
      register,
      updateProfile,
      logout,
      upgradeToPro, 
      downgradeToFree 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
