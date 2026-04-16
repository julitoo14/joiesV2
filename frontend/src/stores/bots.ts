import { defineStore } from 'pinia';
import api from '@/api/axios';
import { ref } from 'vue';

export const useBotsStore = defineStore('bots', () => {
  const bots = ref<any[]>([]);
  const loading = ref(false);

  const fetchBots = async () => {
    loading.value = true;
    try {
      const response = await api.get('/bots');
      bots.value = response.data;
    } finally {
      loading.value = false;
    }
  };

  /** Refresco silencioso sin loading spinner (para polling) */
  const refreshBots = async () => {
    try {
      const response = await api.get('/bots');
      bots.value = response.data;
    } catch (e) {
      // Silencioso
    }
  };

  const createBot = async (payload: { pair: string, type: string, settings: any }) => {
    const res = await api.post('/bots', payload);
    await fetchBots();
    return res.data;
  };

  const updateSettings = async (botId: string, settings: any) => {
    const res = await api.put(`/bots/${botId}`, { settings });
    // Refresco la lista local rapido actualizando solo ese parametro (optimista)
    const b = bots.value.find(x => x._id === botId);
    if (b) b.settings = res.data.settings;
    return res.data;
  };

  const actionBot = async (botId: string, action: 'start' | 'pause' | 'resume' | 'stop') => {
    // Pegamos al controlador que creamos en NestJS
    const res = await api.post(`/bots/${botId}/${action}`);
    
    // Almacena la actualización rápido en UI
    const b = bots.value.find(x => x._id === botId);
    if (b) {
      if (action === 'start') b.status = 'RUNNING';
      if (action === 'pause') b.status = 'PAUSED';
      if (action === 'resume') b.status = 'RUNNING';
      if (action === 'stop') b.status = 'STOPPED';
    }
    return res.data;
  };

  const previewStart = async (botId: string) => {
    const res = await api.get(`/bots/${botId}/preview-start`);
    return res.data;
  };

  const deleteBot = async (botId: string) => {
    await api.delete(`/bots/${botId}`);
    bots.value = bots.value.filter(b => b._id !== botId);
  };

  return { bots, loading, fetchBots, refreshBots, createBot, updateSettings, actionBot, previewStart, deleteBot };
});
