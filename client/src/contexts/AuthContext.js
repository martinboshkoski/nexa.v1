import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import { clearCSRFTokenCache } from '../services/csrfService';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const validateToken = useCallback(async (authToken) => {
    try {
      const response = await fetch('http://localhost:5002/api/auth/validate', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { isValid: true, user: data.user };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Token validation failed');
      }
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        const { isValid, user, error } = await validateToken(token);
        if (isValid && user) {
          setCurrentUser(user);
        } else {
          // Silent handling - remove token and redirect
          localStorage.removeItem('token');
          setToken(null);
          setCurrentUser(null);
          if (window.location.pathname.startsWith('/terminal')) {
            navigate('/login');
          }
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [token, validateToken, navigate]);

  // Login with email and password
  const login = async (email, password) => {
    setError(null);
    try {
      // Fetch CSRF token
      const csrfResponse = await fetch('http://localhost:5002/api/csrf-token', {
        credentials: 'include', // Include cookies
      });
      if (!csrfResponse.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      const response = await fetch('http://localhost:5002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken, // Include CSRF token in headers
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Include cookies
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Login with username and password (for simplified signup users)
  const loginWithUsername = async (username, password) => {
    setError(null);
    
    console.log('loginWithUsername called with:', { username, password: '[HIDDEN]' });
    
    try {
      // Fetch CSRF token
      console.log('Fetching CSRF token for login...');
      
      const csrfResponse = await fetch('http://localhost:5002/api/csrf-token', {
        credentials: 'include',
      });
      
      console.log('CSRF response status:', csrfResponse.status);
      
      if (!csrfResponse.ok) {
        throw new Error(`Failed to fetch CSRF token: ${csrfResponse.status} ${csrfResponse.statusText}`);
      }
      
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      
      console.log('CSRF token obtained for login:', csrfToken.substring(0, 20) + '...');
      console.log('Sending login request...');

      const response = await fetch('http://localhost:5002/api/auth/login-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      console.log('Login response status:', response.status);
      
      const data = await response.json();
      console.log('Login response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `Login failed: ${response.status} ${response.statusText}`);
      }

      console.log('Login successful, setting user data...');
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      
      // Clear CSRF token cache on successful login
      clearCSRFTokenCache();
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Simple registration with just username and password
  const registerSimple = async (username, password) => {
    setError(null);
    
    console.log('registerSimple called with:', { username, password: '[HIDDEN]' });
    
    try {
      // Fetch CSRF token
      console.log('Fetching CSRF token...');
      
      const csrfResponse = await fetch('http://localhost:5002/api/csrf-token', {
        credentials: 'include',
      });
      
      console.log('CSRF response status:', csrfResponse.status);
      
      if (!csrfResponse.ok) {
        throw new Error(`Failed to fetch CSRF token: ${csrfResponse.status} ${csrfResponse.statusText}`);
      }
      
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      
      console.log('CSRF token obtained:', csrfToken.substring(0, 20) + '...');
      console.log('Sending registration request...');

      const response = await fetch('http://localhost:5002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      console.log('Registration response status:', response.status);
      
      const data = await response.json();
      console.log('Registration response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `Registration failed: ${response.status} ${response.statusText}`);
      }

      console.log('Registration successful, setting user data...');
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Register new user with company information
  const register = async (email, password, companyInfo = {}) => {
    try {
      // Fetch CSRF token
      const csrfResponse = await fetch('http://localhost:5002/api/csrf-token', {
        credentials: 'include', // Include cookies
      });
      if (!csrfResponse.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      // Add CSRF token to headers for ApiService
      const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      };

      // Assuming ApiService.request also uses fetch, it needs to support credentials
      // If ApiService is a wrapper around fetch, ensure it passes credentials: 'include'
      // For now, let's assume direct fetch or that ApiService handles it.
      // If ApiService.request doesn't support passing credentials option directly,
      // this part might need adjustment based on ApiService implementation.
      const data = await ApiService.request('/auth/register', {
        method: 'POST',
        headers, // Pass headers to ApiService
        body: JSON.stringify({ 
          email, 
          password, 
          companyInfo 
        }),
        // If ApiService.request is a simple fetch wrapper, you might need to add credentials here too
        // or modify ApiService to handle it.
      });
      
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  // Login with token (for OAuth callbacks)
  const loginWithToken = async (newToken) => {
    try {
      // Validate the token
      const response = await fetch('http://localhost:5002/api/auth/validate', {
        headers: {
          Authorization: `Bearer ${newToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Invalid token');
      }
      
      const data = await response.json();
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setError(null);
    try {
      // Fetch CSRF token
      const csrfResponse = await fetch('http://localhost:5002/api/csrf-token', {
        credentials: 'include',
      });
      if (!csrfResponse.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      const response = await fetch('http://localhost:5002/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      // Update current user with new profile data
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch('http://localhost:5002/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      
      // Clear CSRF token cache on logout
      clearCSRFTokenCache();
      
      navigate('/login');
    }
  }, [token, navigate]);

  // Auto-logout on token expiration or error
  const handleAuthError = useCallback(() => {
    console.log('Handling auth error, clearing token and user');
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    if (window.location.pathname.startsWith('/terminal')) {
      console.log('Redirecting to login from terminal due to auth error');
      navigate('/login', { state: { from: { pathname: window.location.pathname }, authError: true } });
    }
  }, [navigate]);

  const value = {
    currentUser,
    token,
    loading,
    error,
    login,
    loginWithUsername,
    register,
    registerSimple,
    updateProfile,
    logout,
    handleAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
