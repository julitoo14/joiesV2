<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col relative overflow-y-auto w-full h-full">
      <div class="p-8 max-w-7xl mx-auto w-full">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="heading-1 font-bold">Mis Motores</h1>
            <p class="text-slate-400 mt-1">Supervisión y Control de Bots Algorítmicos</p>
          </div>
          <button @click="openCreateModal" class="btn-primary flex items-center">
            <Plus class="w-5 h-5 mr-2" />
            <span class="font-bold">Nuevo Bot</span>
          </button>
        </div>

        <div v-if="botsStore.loading" class="flex justify-center py-20">
          <Loader2 class="w-10 h-10 animate-spin text-primary" />
        </div>

        <div v-else-if="botsStore.bots.length === 0" class="glass-panel text-center py-20 rounded-2xl flex flex-col items-center">
          <Orbit class="w-16 h-16 text-slate-600 mb-4" />
          <h2 class="text-xl font-bold text-white mb-2">No hay motores activos</h2>
          <p class="text-slate-400 max-w-md pb-6 text-center">Inicia un nuevo Grid Bot o un motor de estrategia automática y obsérvalo operar de fondo en tu cuenta.</p>
          <button @click="openCreateModal" class="btn-outline">Configurar Engine</button>
        </div>

        <!-- Bot Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="bot in botsStore.bots" :key="bot._id" class="glass-panel rounded-2xl p-6 relative overflow-hidden group">
            
            <!-- Glow indicator -->
            <div 
              class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-1000"
              :class="statusColors[bot.status].glow"
            ></div>

            <div class="flex justify-between items-start mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 border border-slate-700/50 shadow-inner">
                  <Cpu class="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 class="font-bold text-lg text-white leading-tight">{{ bot.pair }}</h3>
                  <p class="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded inline-block mt-1">{{ bot.type }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2" :class="statusColors[bot.status].text">
                <div class="w-2 h-2 rounded-full animate-pulse" :class="statusColors[bot.status].bg"></div>
                <span class="text-xs font-bold tracking-wider">{{ bot.status }}</span>
              </div>
            </div>

            <!-- Settings Snapshot -->
            <div class="space-y-3 mb-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
              <div class="flex justify-between text-sm" v-for="(val, key) in bot.settings" :key="key">
                <span class="text-slate-500 capitalize">{{ String(key).replace(/([A-Z])/g, ' $1').trim() }}</span>
                <span class="text-slate-300 font-mono">{{ typeof val === 'number' ? new Intl.NumberFormat().format(val) : val }}</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-between border-t border-slate-700/50 pt-5">
              <div class="flex space-x-2">
                <button 
                  v-if="bot.status === 'STOPPED'"
                  @click="actionBot(bot._id, 'start')" 
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
                  :disabled="loadingAction === bot._id"
                >
                  <Play class="w-5 h-5 ml-0.5" />
                </button>
                
                <button 
                  v-else-if="bot.status === 'RUNNING'"
                  @click="actionBot(bot._id, 'pause')" 
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-lg hover:shadow-amber-500/25 disabled:opacity-50"
                  :disabled="loadingAction === bot._id"
                >
                  <Pause class="w-5 h-5" />
                </button>

                 <button 
                  v-else-if="bot.status === 'PAUSED'"
                  @click="actionBot(bot._id, 'resume')" 
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                  :disabled="loadingAction === bot._id"
                >
                  <Play class="w-5 h-5 ml-0.5" />
                </button>

                <button 
                  v-if="bot.status !== 'STOPPED'"
                  @click="actionBot(bot._id, 'stop')" 
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
                  :disabled="loadingAction === bot._id"
                >
                  <Square class="w-4 h-4 fill-current" />
                </button>
              </div>

              <div class="flex space-x-2">
                <button 
                  @click="openEditModal(bot)"
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Sliders class="w-5 h-5" />
                </button>
                <button 
                  @click="deleteBot(bot._id)"
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Generic Modal for Create/Edit -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div class="glass-panel w-full max-w-md rounded-2xl p-6 relative">
        <!-- Close btn -->
        <button @click="closeModal" class="absolute top-5 right-5 text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>
        
        <h2 class="text-xl font-bold mb-6 text-white">{{ isEditing ? 'Ajustar Configuración Viva' : 'Configurar Engine' }}</h2>
        
        <form @submit.prevent="submitModal" class="space-y-4">
          
          <div v-if="!isEditing">
            <label class="block text-sm font-medium text-slate-400 mb-1">Par (Symbol)</label>
            <input v-model="modalData.pair" type="text" class="input-field uppercase font-mono" placeholder="BTCUSDT" required />
          </div>

          <div v-if="!isEditing">
            <label class="block text-sm font-medium text-slate-400 mb-1">Estrategia</label>
            <select v-model="modalData.type" class="input-field appearance-none" required>
              <option value="GRID">Grid Bot</option>
              <option value="DCA">DCA Bot (pronto)</option>
            </select>
          </div>

          <div v-if="modalData.type === 'GRID'" class="space-y-4 mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
            <h4 class="text-sm font-semibold text-primary mb-2">GRID SETTINGS</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-400 mb-1">Líneas (Grupos)</label>
                <input v-model.number="modalData.settings.gridLines" type="number" class="input-field py-2 text-sm" required />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">Margen %</label>
                <input v-model.number="modalData.settings.marginPercent" type="number" step="0.1" class="input-field py-2 text-sm" required />
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Take Profit Tgt</label>
              <input v-model.number="modalData.settings.takeProfit" type="number" class="input-field py-2 text-sm font-mono" />
            </div>
          </div>

          <button type="submit" class="btn-primary w-full mt-6 flex justify-center py-3" :disabled="modalLoading">
            <Loader2 v-if="modalLoading" class="animate-spin w-5 h-5 mr-2" />
            <span>{{ isEditing ? 'Aplicar Configuración' : 'Desplegar Bot' }}</span>
          </button>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import { useBotsStore } from '@/stores/bots';
import { 
  Plus, Loader2, Orbit, Cpu, Play, Pause, Square, Trash2, X, Sliders 
} from 'lucide-vue-next';

const botsStore = useBotsStore();

const loadingAction = ref<string | null>(null);
const showModal = ref(false);
const modalLoading = ref(false);
const isEditing = ref(false);
const editId = ref('');

const modalData = reactive({
  pair: 'BTCUSDT',
  type: 'GRID',
  settings: {
    gridLines: 10,
    marginPercent: 0.5,
    takeProfit: 100000
  } as any
});

const statusColors: Record<string, any> = {
  'RUNNING': { text: 'text-emerald-400', bg: 'bg-emerald-400', glow: 'bg-emerald-500' },
  'PAUSED': { text: 'text-amber-400', bg: 'bg-amber-400', glow: 'bg-amber-500' },
  'STOPPED': { text: 'text-slate-400', bg: 'bg-slate-500', glow: 'bg-transparent' },
};

onMounted(() => {
  botsStore.fetchBots();
});

const actionBot = async (id: string, action: 'start'|'pause'|'resume'|'stop') => {
  loadingAction.value = id;
  try {
    await botsStore.actionBot(id, action);
  } catch (e) {
    alert('Error enviando la señal al Engine. Verifica la consola.');
  } finally {
    loadingAction.value = null;
  }
};

const deleteBot = async (id: string) => {
  if (confirm('¿Estás seguro que deseas eliminar e incinerar este Bot completamente?')) {
    await botsStore.deleteBot(id);
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  modalData.pair = 'ETHUSDT';
  modalData.type = 'GRID';
  modalData.settings = { gridLines: 10, marginPercent: 0.5, takeProfit: 4000 };
  showModal.value = true;
};

const openEditModal = (bot: any) => {
  isEditing.value = true;
  editId.value = bot._id;
  modalData.pair = bot.pair;
  modalData.type = bot.type;
  // Hacemos deep copy de las settings para no mutar indirectamente antes de guardar
  modalData.settings = JSON.parse(JSON.stringify(bot.settings));
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const submitModal = async () => {
  modalLoading.value = true;
  try {
    if (isEditing.value) {
      await botsStore.updateSettings(editId.value, modalData.settings);
    } else {
      await botsStore.createBot({
        pair: modalData.pair,
        type: modalData.type,
        settings: modalData.settings
      });
    }
    showModal.value = false;
  } catch (e: any) {
    alert('Ups! Algo falló al guardar en DB: ' + (e.response?.data?.message || e.message));
  } finally {
    modalLoading.value = false;
  }
};
</script>
