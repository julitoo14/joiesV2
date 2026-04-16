<template>
  <div class="flex h-screen overflow-hidden bg-background">
    <Sidebar />

    <main class="flex-1 overflow-y-auto w-full p-8 relative">
      <div class="max-w-4xl mx-auto space-y-8">
        
        <!-- Header -->
        <div class="flex items-end justify-between border-b border-slate-700/50 pb-6">
          <div>
            <h1 class="heading-1 font-bold">Perfil del Usuario</h1>
            <p class="text-slate-400 mt-1">Configuración y Seguridad de la red Joies</p>
          </div>
          <div class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            Role: {{ authStore.user?.role }}
          </div>
        </div>

        <!-- Formularios de usuario -->
        <form @submit.prevent="updateProfile" class="space-y-8">
          
          <!-- Personal Settings Card -->
          <div class="glass-panel rounded-2xl p-8">
            <h2 class="text-lg font-bold text-white mb-6 flex items-center">
              <UserCircle class="w-5 h-5 mr-2 text-primary" />
              Datos Personales
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-400 mb-1">Nombre Completo</label>
                <input v-model="profileForm.name" type="text" class="input-field" required />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-400 mb-1">Correo Electrónico (Solo Lectura)</label>
                <input :value="authStore.user?.email" type="email" class="input-field opacity-50 cursor-not-allowed" disabled />
              </div>
            </div>
          </div>

          <!-- Preferences Settings Card -->
          <div class="glass-panel rounded-2xl p-8">
            <h2 class="text-lg font-bold text-white mb-6 flex items-center">
              <Sliders class="w-5 h-5 mr-2 text-primary" />
              Preferencias
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-400 mb-1">Moneda Principal</label>
                <select v-model="profileForm.preferences.currency" class="input-field bg-slate-800">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-400 mb-1">Tema</label>
                <select v-model="profileForm.preferences.theme" class="input-field bg-slate-800">
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </select>
              </div>
              <div class="flex items-center mt-6">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="profileForm.preferences.alertsEnabled" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  <span class="ml-3 text-sm font-medium text-slate-300">Activar Alertas</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Binance API Card -->
          <div class="glass-panel rounded-2xl p-8">
            <h2 class="text-lg font-bold text-white mb-6 flex items-center">
              <Key class="w-5 h-5 mr-2 text-primary" />
              Configuración de Binance API
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-400 mb-1">API Key</label>
                <input v-model="profileForm.binanceConfig.apiKey" type="text" class="input-field" placeholder="Ingresa tu API Key de Binance" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-400 mb-1">API Secret</label>
                <input v-model="profileForm.binanceConfig.apiSecret" type="password" class="input-field" placeholder="Déjalo en blanco si no quieres cambiarlo" />
                <p class="text-xs text-slate-500 mt-1">Por seguridad, el secreto no se muestra una vez guardado.</p>
              </div>
            </div>
          </div>

          <!-- Acciones Guardar -->
          <div class="flex items-center justify-end space-x-4">
             <p v-if="saveSuccess" class="text-emerald-400 text-sm font-medium transition-all">¡Perfil actualizado correctamente!</p>
             <button type="submit" class="btn-primary px-8 py-3" :disabled="savingProfile">
              <Loader2 v-if="savingProfile" class="animate-spin w-5 h-5 mr-2 inline" />
              Guardar Cambios
            </button>
          </div>
          
        </form>

        <!-- Admin Table Card -->
        <div v-if="authStore.user?.role === 'admin'" class="glass-panel rounded-2xl p-8 border-l-4 border-l-primary">
          <div class="flex justify-between items-center mb-6">
             <h2 class="text-lg font-bold text-white flex items-center">
              <Shield class="w-5 h-5 mr-2 text-primary" />
              Directorio de Fábrica (Admin)
            </h2>
            <button @click="fetchUsers" class="text-slate-400 hover:text-white transition-colors">
              <RefreshCw class="w-5 h-5" :class="{'animate-spin text-primary': loadingUsers}" />
            </button>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-700/50">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-slate-800/80 text-slate-300">
                <tr>
                  <th class="px-6 py-4 font-medium uppercase text-xs">Nombre</th>
                  <th class="px-6 py-4 font-medium uppercase text-xs">Email</th>
                  <th class="px-6 py-4 font-medium uppercase text-xs">Rol</th>
                  <th class="px-6 py-4 font-medium uppercase text-xs text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50 bg-slate-900/30">
                <tr v-for="u in adminUsersList" :key="u.id" class="hover:bg-slate-800/50 transition-colors">
                  <td class="px-6 py-4 text-white font-medium">{{ u.name }}</td>
                  <td class="px-6 py-4 text-slate-400">{{ u.email }}</td>
                  <td class="px-6 py-4">
                     <span class="px-2 py-1 rounded text-xs tracking-wide" 
                           :class="u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'">
                       {{ u.role }}
                     </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button 
                      v-if="u.id !== authStore.user?.id" 
                      @click="deleteUser(u.id)" 
                      class="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded transition-all"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Sidebar from '@/components/Sidebar.vue';
import api from '@/api/axios';
import { UserCircle, Shield, Loader2, Trash2, RefreshCw, Sliders, Key } from 'lucide-vue-next';

const authStore = useAuthStore();
const savingProfile = ref(false);
const saveSuccess = ref(false);

const profileForm = ref({
  name: '',
  binanceConfig: {
    apiKey: '',
    apiSecret: ''
  },
  preferences: {
    currency: 'USD',
    theme: 'light',
    alertsEnabled: true
  }
});

// Estado Admin
const adminUsersList = ref<any[]>([]);
const loadingUsers = ref(false);

onMounted(() => {
  if (authStore.user) {
    profileForm.value.name = authStore.user.name || '';
    if (authStore.user.binanceConfig) {
      profileForm.value.binanceConfig.apiKey = authStore.user.binanceConfig.apiKey || '';
      // apiSecret no viene del backend
    }
    if (authStore.user.preferences) {
      profileForm.value.preferences.currency = authStore.user.preferences.currency || 'USD';
      profileForm.value.preferences.theme = authStore.user.preferences.theme || 'light';
      profileForm.value.preferences.alertsEnabled = authStore.user.preferences.alertsEnabled ?? true;
    }
    
    if (authStore.user.role === 'admin') {
      fetchUsers();
    }
  }
});

const updateProfile = async () => {
  if (!authStore.user) return;
  savingProfile.value = true;
  saveSuccess.value = false;
  try {
    const payload: any = { 
      name: profileForm.value.name,
      preferences: profileForm.value.preferences
    };

    // Solo enviamos binanceConfig si se llenó al menos la API Key (o si ya existía y la está editando)
    if (profileForm.value.binanceConfig.apiKey) {
       payload.binanceConfig = { apiKey: profileForm.value.binanceConfig.apiKey };
       if (profileForm.value.binanceConfig.apiSecret) {
         payload.binanceConfig.apiSecret = profileForm.value.binanceConfig.apiSecret;
       }
    }

    await api.patch(`/users/${authStore.user.id}`, payload);
    await authStore.fetchProfile();
    
    // Resetear el campo de secreto
    profileForm.value.binanceConfig.apiSecret = '';

    saveSuccess.value = true;
    setTimeout(() => { saveSuccess.value = false }, 3000);
  } catch (e) {
    alert('Fallo al actualizar perfil');
  } finally {
    savingProfile.value = false;
  }
};

const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const { data } = await api.get('/users');
    adminUsersList.value = data;
  } catch (e) {
    console.error("Error fetching users", e);
  } finally {
    loadingUsers.value = false;
  }
};

const deleteUser = async (id: string) => {
  if (confirm('PELIGRO: ¿Eliminar a este usuario permanentemente?')) {
    try {
      await api.delete(`/users/${id}`);
      adminUsersList.value = adminUsersList.value.filter(u => u.id !== id);
    } catch (e) {
      alert('Error eliminando usuario. Tal vez no tienes permisos de root.');
    }
  }
};
</script>
