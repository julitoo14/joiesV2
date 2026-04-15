import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'Auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    }
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const isAuth = authStore.isAuthenticated();

  if (to.meta.requiresAuth && !isAuth) {
    next('/auth');
  } else if (to.meta.requiresGuest && isAuth) {
    next('/');
  } else {
    // Si esta logueado pero no cargo el perfil, lo recargamos en background
    if (isAuth && !authStore.user) {
        await authStore.fetchProfile();
    }
    next();
  }
});

export default router;
