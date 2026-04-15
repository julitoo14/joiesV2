import { defineStore } from 'pinia';
import api from '@/api/axios';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('joies_access_token'));
  const user = ref<any>(null);

  const isAuthenticated = () => !!token.value;

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('joies_access_token', newToken);
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('joies_access_token');
  };

  const fetchProfile = async () => {
    if (!token.value) return null;
    try {
      const response = await api.get('/users/me');
      user.value = response.data;
      return user.value;
    } catch (e) {
      logout();
      return null;
    }
  };

  return { token, user, isAuthenticated, setToken, logout, fetchProfile };
});
