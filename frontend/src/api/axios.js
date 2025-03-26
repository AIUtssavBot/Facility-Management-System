import axios from 'axios';

// Create a custom axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to set auth token for every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Special instance for auth endpoints that use form data
export const authApi = {
  login: (email, password) => {
    const formBody = new URLSearchParams();
    formBody.append('username', email);
    formBody.append('password', password);
    
    return axios.post('http://localhost:8000/api/auth/login', 
      formBody.toString(),
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  },
  
  register: (userData) => {
    console.log('Registration request data:', userData); // Debug log
    return axios.post('http://localhost:8000/api/auth/register', 
      userData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
  }
};

export default api; 