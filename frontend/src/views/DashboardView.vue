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
              <div v-if="bot.stats && bot.stats.totalSales > 0" class="pb-3 mb-3 border-b border-slate-800/80">
                <div class="flex justify-between items-center">
                  <span class="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Performance</span>
                  <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Real Live</span>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p class="text-[10px] text-slate-500">Ventas</p>
                    <p class="text-sm font-bold text-white">{{ bot.stats.totalSales }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] text-slate-500">Profit Neto</p>
                    <p class="text-sm font-bold text-emerald-400 font-mono">+${{ bot.stats.profitNet?.toFixed(2) }}</p>
                  </div>
                </div>
              </div>

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
          
          <div v-if="!isEditing" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1">Par (Symbol)</label>
              <select v-model="modalData.pair" @change="fetchCurrentPrice" class="input-field bg-slate-800" required>
                <option value="BTCUSDT">BTCUSDT (Bitcoin)</option>
                <option value="ETHUSDT">ETHUSDT (Ethereum)</option>
                <option value="SOLUSDT">SOLUSDT (Solana)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-1">Estrategia</label>
              <select v-model="modalData.type" class="input-field bg-slate-800" required>
                <option value="GRID">Grid Bot</option>
                <option value="DCA">DCA Bot (pronto)</option>
              </select>
            </div>
          </div>

          <div v-if="modalData.type === 'GRID'" class="space-y-4 mt-4 p-5 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-inner">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-primary tracking-widest uppercase">Grid Engine Settings</h4>
              <div v-if="currentPrice" class="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                Precio Actual: ${{ currentPrice.toLocaleString() }}
              </div>
            </div>

            <div>
              <label class="block text-xs text-slate-400 mb-1">Capital a Invertir (USDT)</label>
              <div class="relative">
                <input v-model.number="modalData.settings.capital" type="number" class="input-field py-2.5 pl-9 font-mono text-sm" placeholder="150" required />
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-400 mb-1">Precio Mínimo</label>
                <input v-model.number="modalData.settings.lowerPrice" type="number" step="any" class="input-field py-2 text-sm font-mono" required />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">Precio Máximo</label>
                <input v-model.number="modalData.settings.upperPrice" type="number" step="any" class="input-field py-2 text-sm font-mono" required />
              </div>
            </div>

            <div>
              <label class="block text-xs text-slate-400 mb-1">Cantidad de Grillas (Líneas)</label>
              <input v-model.number="modalData.settings.gridLines" type="number" min="2" class="input-field py-2 text-sm" required />
            </div>

            <!-- Live Projections Section -->
            <div class="pt-4 mt-2 border-t border-slate-800/80 space-y-2">
              <div class="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-300 mb-3 flex items-start">
                <Orbit class="w-3.5 h-3.5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Al iniciar, el sistema comprará automáticamente el 50% de {{ modalData.pair.replace('USDT', '') }} a mercado para balancear la grilla.</span>
              </div>

              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-500">Inversión por Grilla:</span>
                <span :class="projections.investmentPerGrid < 5.5 ? 'text-red-400 font-bold' : 'text-slate-200'">
                  ${{ projections.investmentPerGrid.toFixed(2) }} USDT
                </span>
              </div>
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-500">Espaciado (Step):</span>
                <span class="text-slate-200">${{ projections.stepSize.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center text-[11px] font-bold">
                <span class="text-slate-400">Profit Neto Est. (por venta):</span>
                <span class="text-emerald-400">{{ projections.netProfitPercent.toFixed(2) }}% (~${{ projections.netProfitUsd.toFixed(2) }} USD)</span>
              </div>
              
              <div v-if="projections.investmentPerGrid < 5.5" class="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 leading-tight">
                ⚠️ **Inversión insuficiente:** Binance requiere al menos $5 por orden. Aumenta el capital o reduce las líneas.
              </div>
            </div>
          </div>

          <button type="submit" class="btn-primary w-full mt-6 flex justify-center py-3" :disabled="modalLoading">
            <Loader2 v-if="modalLoading" class="animate-spin w-5 h-5 mr-2" />
            <span>{{ isEditing ? 'Aplicar Configuración' : 'Desplegar Bot' }}</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Preview Start Modal -->
    <div v-if="showPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div class="glass-panel w-full max-w-md rounded-2xl p-6 relative">
        <button @click="showPreview = false" class="absolute top-5 right-5 text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>

        <h2 class="text-lg font-bold text-white mb-1">Confirmar Inicio del Bot</h2>
        <p class="text-xs text-slate-400 mb-5">Resumen de lo que sucederá al activar el motor</p>

        <div v-if="previewLoading" class="flex justify-center py-10">
          <Loader2 class="w-8 h-8 animate-spin text-primary" />
        </div>

        <div v-else-if="previewData" class="space-y-3">
          <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2.5">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Precio Actual</span>
              <span class="text-white font-mono">${{ previewData.currentPrice?.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Balance Existente ({{ previewData.baseAsset }})</span>
              <span class="text-white font-mono">{{ previewData.existingBalance?.toFixed(6) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Necesario para Ventas</span>
              <span class="text-white font-mono">{{ previewData.requiredAmount?.toFixed(6) }} {{ previewData.baseAsset }}</span>
            </div>

            <div class="border-t border-slate-800 pt-2">
              <div v-if="previewData.needsToBuy > 0" class="flex justify-between text-xs">
                <span class="text-amber-400 font-semibold">Se comprará a mercado</span>
                <span class="text-amber-400 font-mono font-bold">{{ previewData.needsToBuy?.toFixed(6) }} {{ previewData.baseAsset }} (~${{ previewData.estimatedCost?.toFixed(2) }})</span>
              </div>
              <div v-else class="text-xs text-emerald-400 font-semibold">
                ✓ Balance suficiente. No se necesita compra inicial.
              </div>
            </div>

            <div class="flex justify-between text-xs pt-1">
              <span class="text-slate-500">Órdenes de Compra</span>
              <span class="text-blue-400 font-mono">{{ previewData.buyLevels }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Órdenes de Venta</span>
              <span class="text-orange-400 font-mono">{{ previewData.sellLevels }}</span>
            </div>
          </div>

          <div class="flex space-x-3 mt-4">
            <button @click="showPreview = false" class="btn-outline flex-1 py-2.5 text-sm">Cancelar</button>
            <button @click="confirmStart" class="btn-primary flex-1 py-2.5 text-sm flex justify-center" :disabled="previewLoading">
              <Loader2 v-if="startingBot" class="animate-spin w-4 h-4 mr-2" />
              <span>Confirmar e Iniciar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import { useBotsStore } from '@/stores/bots';
import api from '@/api/axios';
import { 
  Plus, Loader2, Orbit, Cpu, Play, Pause, Square, Trash2, X, Sliders 
} from 'lucide-vue-next';

const botsStore = useBotsStore();

const loadingAction = ref<string | null>(null);
const showModal = ref(false);
const modalLoading = ref(false);
const isEditing = ref(false);
const editId = ref('');
const currentPrice = ref<number | null>(null);

const modalData = reactive({
  pair: 'BTCUSDT',
  type: 'GRID',
  settings: {
    capital: 150,
    lowerPrice: 0,
    upperPrice: 0,
    gridLines: 10
  } as any
});

const projections = computed(() => {
  const { capital, lowerPrice, upperPrice, gridLines } = modalData.settings;
  if (!capital || !lowerPrice || !upperPrice || !gridLines || gridLines < 2) {
    return { investmentPerGrid: 0, stepSize: 0, netProfitPercent: 0, netProfitUsd: 0 };
  }

  const investmentPerGrid = capital / gridLines;
  const stepSize = (upperPrice - lowerPrice) / gridLines;
  
  // Profit bruto estimado (%) = (Step / Precio Promedio)
  const avgPrice = (upperPrice + lowerPrice) / 2;
  const grossProfitPercent = (stepSize / avgPrice) * 100;
  
  // Descontamos comisiones de Binance (0.1% compra + 0.1% venta = 0.2% total)
  const netProfitPercent = Math.max(0, grossProfitPercent - 0.2);
  const netProfitUsd = (investmentPerGrid * netProfitPercent) / 100;

  return {
    investmentPerGrid,
    stepSize,
    netProfitPercent,
    netProfitUsd
  };
});

const statusColors: Record<string, any> = {
  'RUNNING': { text: 'text-emerald-400', bg: 'bg-emerald-400', glow: 'bg-emerald-500' },
  'PAUSED': { text: 'text-amber-400', bg: 'bg-amber-400', glow: 'bg-amber-500' },
  'STOPPED': { text: 'text-slate-400', bg: 'bg-slate-500', glow: 'bg-transparent' },
};

onMounted(() => {
  botsStore.fetchBots();
  // Auto-refresh cada 10s para ver stats live de bots activos
  refreshInterval = setInterval(() => {
    if (botsStore.bots.some(b => b.status === 'RUNNING')) {
      botsStore.refreshBots();
    }
  }, 10000);
});

let refreshInterval: ReturnType<typeof setInterval>;
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

// --- Preview Start ---
const showPreview = ref(false);
const previewLoading = ref(false);
const previewData = ref<any>(null);
const previewBotId = ref('');
const startingBot = ref(false);

const actionBot = async (id: string, action: 'start'|'pause'|'resume'|'stop') => {
  if (action === 'start') {
    // Mostrar preview modal en vez de confirm()
    previewBotId.value = id;
    showPreview.value = true;
    previewLoading.value = true;
    previewData.value = null;
    try {
      previewData.value = await botsStore.previewStart(id);
    } catch (e: any) {
      alert('Error al obtener preview: ' + (e.response?.data?.message || e.message));
      showPreview.value = false;
    } finally {
      previewLoading.value = false;
    }
    return;
  }

  loadingAction.value = id;
  try {
    await botsStore.actionBot(id, action);
  } catch (e: any) {
    const errorMsg = e.response?.data?.message || e.message || 'Error desconocido';
    alert(`Error al procesar la acción: ${errorMsg}`);
  } finally {
    loadingAction.value = null;
  }
};

const confirmStart = async () => {
  startingBot.value = true;
  try {
    await botsStore.actionBot(previewBotId.value, 'start');
    showPreview.value = false;
    await botsStore.refreshBots();
  } catch (e: any) {
    const errorMsg = e.response?.data?.message || e.message || 'Error desconocido';
    alert(`Error al iniciar el bot: ${errorMsg}`);
  } finally {
    startingBot.value = false;
  }
};

const deleteBot = async (id: string) => {
  if (confirm('¿Estás seguro que deseas eliminar e incinerar este Bot completamente?')) {
    await botsStore.deleteBot(id);
  }
};

const fetchCurrentPrice = async () => {
  try {
    const { data } = await api.get(`/bots/ticker/${modalData.pair}`);
    currentPrice.value = data.last;
    
    // Si es creación y los precios están en 0, sugerimos un rango del +- 5%
    if (!isEditing.value && (!modalData.settings.lowerPrice || modalData.settings.lowerPrice === 0)) {
      modalData.settings.lowerPrice = Number((data.last * 0.95).toFixed(2));
      modalData.settings.upperPrice = Number((data.last * 1.05).toFixed(2));
    }
  } catch (error) {
    console.error('Error fetching price:', error);
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  modalData.pair = 'BTCUSDT';
  modalData.type = 'GRID';
  modalData.settings = { 
    capital: 150, 
    lowerPrice: 0, 
    upperPrice: 0, 
    gridLines: 10 
  };
  showModal.value = true;
  fetchCurrentPrice();
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
