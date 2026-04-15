import axios from 'axios';

// Singleton instance de Axios para comunicarse con el servidor NestJS
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar automáticamente el JWT de autorización en cada Request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('joies_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor global para interceptar errores 401 (deslogueo del backend)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Elimina token expirado
      localStorage.removeItem('joies_access_token');
      // En una app real, redirigir al login: window.location.href = '/login' (o usar Router)
    }
    return Promise.reject(error);
  }
);

export default api;
