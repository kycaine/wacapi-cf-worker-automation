import axios from 'axios';

// Ensure the backend URL is set correctly depending on the environment
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dashboard_token');
  if (token) {
    config.headers.Authorization = `Basic ${token}`;
  }
  return config;
});

export const login = async (username: string, password: string) => {
  const token = btoa(`${username}:${password}`);
  
  // Test the token against the API
  try {
    await axios.get(`${baseURL}/api/stats/daily`, {
      headers: { Authorization: `Basic ${token}` }
    });
    
    localStorage.setItem('dashboard_token', token);
    return true;
  } catch (error) {
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('dashboard_token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('dashboard_token');
};

export default api;
