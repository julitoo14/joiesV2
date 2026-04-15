<template>
  <aside class="w-64 bg-surface border-r border-slate-700/50 flex flex-col hidden md:flex shrink-0">
    <div class="h-16 flex items-center px-6 border-b border-slate-700/50">
      <div class="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
        <Activity class="text-primary w-5 h-5" />
      </div>
      <span class="text-lg font-bold text-white tracking-wide">JOIES ENGINE</span>
    </div>

    <nav class="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
      <router-link 
        to="/" 
        class="flex items-center px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors group"
        active-class="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
      >
        <LayoutDashboard class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
        <span class="font-medium">Dashboard</span>
      </router-link>

      <router-link 
        to="/profile" 
        class="flex items-center px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors group"
        active-class="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
      >
        <User class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
        <span class="font-medium">Mi Cuenta</span>
      </router-link>
    </nav>

    <div class="p-4 border-t border-slate-700/50">
      <div class="flex items-center space-x-3 px-2 mb-4" v-if="authStore.user">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg">
          <span class="text-white font-bold">{{ authStore.user.name?.charAt(0) }}</span>
        </div>
        <div class="overflow-hidden">
          <p class="text-sm font-medium text-white truncate">{{ authStore.user.name }}</p>
          <p class="text-xs text-slate-400 capitalize">{{ authStore.user.role }}</p>
        </div>
      </div>
      
      <button @click="handleLogout" class="flex items-center w-full px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
        <LogOut class="w-5 h-5 mr-3" />
        <span class="font-medium">Cerrar Sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { LayoutDashboard, User, LogOut, Activity } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/auth');
};
</script>
