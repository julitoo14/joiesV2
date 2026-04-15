<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
    <!-- Componentes de fondo dinámicos y coloridos tipo cripto/trading -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse" style="animation-delay: 2s;"></div>
    
    <div class="relative w-full max-w-md mx-auto p-8 rounded-3xl glass-panel z-10">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <Activity class="text-primary w-8 h-8" />
        </div>
        <h1 class="heading-1">{{ isLogin ? 'Inciar Sesión' : 'Únete a Joies' }}</h1>
        <p class="text-slate-400 mt-2 text-sm">Plataforma Avanzada de Algorithmic Trading</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div v-show="!isLogin">
          <label class="block text-sm font-medium text-slate-300 mb-1">Nombre Completo</label>
          <input 
            v-model="form.name"
            type="text" 
            class="input-field" 
            placeholder="Ada Lovelace"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1">Correo Electrónico</label>
          <input 
            v-model="form.email"
            type="email" 
            required
            class="input-field" 
            placeholder="trading@joies.com"
          />
        </div>

        <div>
           <label class="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
          <input 
            v-model="form.password"
            type="password"
            required 
            class="input-field" 
            placeholder="••••••••"
          />
        </div>

        <div v-if="errorMsg" class="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-lg">
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="btn-primary w-full flex justify-center items-center gap-2"
        >
          <Loader2 v-if="loading" class="animate-spin w-5 h-5" />
          <span>{{ isLogin ? 'Entrar al Motor' : 'Crear Cuenta' }}</span>
        </button>
      </form>

      <div class="mt-8 text-center text-sm text-slate-400">
        {{ isLogin ? '¿No tenés cuenta?' : '¿Ya eres parte de Joies?' }}
        <button 
          @click="toggleMode"
          class="text-primary hover:text-primary-dark font-medium transition-colors ml-1"
        >
          {{ isLogin ? 'Registrarme' : 'Iniciar Sesión' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/api/axios';
import { Activity, Loader2 } from 'lucide-vue-next';

const isLogin = ref(true);
const loading = ref(false);
const errorMsg = ref('');

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  name: '',
  email: '',
  password: ''
});

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  errorMsg.value = '';
};

const handleSubmit = async () => {
  loading.value = true;
  errorMsg.value = '';

  try {
    const endpoint = isLogin.value ? '/auth/login' : '/auth/register';
    const payload = isLogin.value ? { email: form.email, password: form.password } : form;
    
    const { data } = await api.post(endpoint, payload);
    
    // Guardar token y saltar al index
    authStore.setToken(data.access_token);
    await router.push('/');
  } catch (err: any) {
    if (err.response?.status === 401) {
      errorMsg.value = 'Credenciales inválidas o correo existente';
    } else {
      errorMsg.value = 'Ocurrió un error de red o interno del servidor';
    }
  } finally {
    loading.value = false;
  }
};
</script>
