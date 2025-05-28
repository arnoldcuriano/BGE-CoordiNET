import axios from 'axios';

// Create an Axios instance with default configuration
const api = axios.create({
  baseURL: '/api', // Use relative path to leverage the proxy in development
  withCredentials: true, // Include cookies in requests (e.g., for session authentication)
  timeout: 10000, // Timeout after 10 seconds
});

// Add a request interceptor to handle Content-Type for FormData
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      // Let FormData set its own Content-Type (multipart/form-data)
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
    console.log('API request:', config.method.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log('API response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API response error:', error.response?.status, error.response?.config.url, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;