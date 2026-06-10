<script setup lang="ts">
import { computed } from 'vue';
import { Users, Car, FileText, School, ClipboardCheck, Plus, Upload, Zap, TrendingUp, AlertCircle, Calendar, ShieldCheck, Activity } from 'lucide-vue-next';

const props = defineProps<{
  people: any[];
  titles: any[];
  habilitaciones: any[];
  schools: any[];
  inspections: any[];
}>();

const emit = defineEmits(['navigate']);

const stats = computed(() => [
  { label: 'Personas', value: props.people.length, icon: Users, bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', tab: 'registry' },
  { label: 'Títulos', value: props.titles.length, icon: Car, bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', tab: 'titles_list' },
  { label: 'Expedientes', value: props.habilitaciones.length, icon: FileText, bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', tab: 'hab_list' },
  { label: 'Inspecciones', value: props.inspections.length, icon: ClipboardCheck, bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', tab: 'insp_list' },
]);

const vehiculosStats = computed(() => {
  const remis = props.habilitaciones.filter(h => h.tipoHabilitacion?.toLowerCase() === 'remis').length;
  const escolar = props.habilitaciones.filter(h => h.tipoHabilitacion?.toLowerCase() === 'escolar').length;
  const total = remis + escolar || 1;
  return { remis, escolar, remisPct: Math.round((remis/total)*100), escolarPct: Math.round((escolar/total)*100) };
});

const pendingInspections = computed(() => {
  const inspectedDominios = props.inspections.map(i => i.dominio);
  return props.habilitaciones
    .filter(h => !inspectedDominios.includes(h.dominio))
    .slice(0, 4); // Show top 4
});

const recentActivity = computed(() => {
  const all = [
    ...props.people.map(p => ({ type: 'Persona', name: `${p.surname}, ${p.names}`, date: p.timestamp, tab: 'registry', icon: Users, color: '#4f46e5' })),
    ...props.titles.map(t => ({ type: 'Título', name: `${t.marca} ${t.modelo} (${t.dominio})`, date: t.timestamp, tab: 'titles_list', icon: Car, color: '#2563eb' })),
    ...props.habilitaciones.map(h => ({ type: 'Habilitación', name: `Exp ${h.nroExpediente}`, date: h.timestamp, tab: 'hab_list', icon: FileText, color: '#7c3aed' })),
  ].sort((a, b) => {
    // sort safely handling possible nulls
    const d1 = a.date?.seconds || a.date || 0;
    const d2 = b.date?.seconds || b.date || 0;
    return d2 - d1;
  }).slice(0, 5);
  
  return all;
});

const formatDate = (ts: any) => {
  if (!ts) return 'Reciente';
  // handle firestore timestamp
  const dateObj = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
};
</script>

<template>
  <div class="dashboard-container animate-fade">
    <div class="dashboard-header">
      <div class="header-content">
        <h1>Centro de Comando</h1>
        <p>Monitor en tiempo real del sistema de habilitaciones de transporte</p>
      </div>
      <div class="header-date">
        <Calendar :size="16" />
        {{ new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) }}
      </div>
    </div>

    <!-- MAIN GRID BENTO BOX -->
    <div class="bento-grid">
      
      <!-- Quick Actions (Spans 2 columns) -->
      <div class="bento-card col-span-2 quick-actions-card">
        <h3 class="card-title"><Zap :size="18" /> Acciones Rápidas</h3>
        <div class="actions-grid">
          <button class="action-btn primary-action" @click="emit('navigate', 'scan')">
            <div class="action-icon"><Users :size="24" /></div>
            <div class="action-text">
              <h4>Nueva Persona</h4>
              <p>Escanear DNI</p>
            </div>
            <Plus :size="20" class="arrow-icon" />
          </button>

          <button class="action-btn secondary-action" @click="emit('navigate', 'titles_scan')">
            <div class="action-icon"><Car :size="24" /></div>
            <div class="action-text">
              <h4>Nuevo Vehículo</h4>
              <p>Escanear Título</p>
            </div>
            <Upload :size="20" class="arrow-icon" />
          </button>

          <button class="action-btn tertiary-action" @click="emit('navigate', 'hab_scan')">
            <div class="action-icon"><ShieldCheck :size="24" /></div>
            <div class="action-text">
              <h4>Habilitación</h4>
              <p>Iniciar Expediente</p>
            </div>
            <FileText :size="20" class="arrow-icon" />
          </button>
        </div>
      </div>

      <!-- Stats Grid (Spans 2 columns) -->
      <div class="bento-card col-span-2 stats-card-container">
        <div class="stats-grid-inner">
          <div v-for="stat in stats" :key="stat.label" class="stat-bubble" :style="{ background: stat.bg }" @click="emit('navigate', stat.tab)">
            <div class="stat-bubble-icon">
              <component :is="stat.icon" :size="28" />
            </div>
            <div class="stat-bubble-info">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vehicle Distribution Chart -->
      <div class="bento-card chart-card">
        <h3 class="card-title"><Activity :size="18" /> Distribución de Flota</h3>
        <div class="chart-container">
          <div class="chart-bar-wrap">
            <div class="chart-label">
              <span>Remises</span>
              <strong>{{ vehiculosStats.remisPct }}%</strong>
            </div>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: vehiculosStats.remisPct + '%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }"></div>
            </div>
          </div>
          <div class="chart-bar-wrap mt-4">
            <div class="chart-label">
              <span>Escolares</span>
              <strong>{{ vehiculosStats.escolarPct }}%</strong>
            </div>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: vehiculosStats.escolarPct + '%', background: 'linear-gradient(90deg, #10b981, #34d399)' }"></div>
            </div>
          </div>
          <div class="chart-summary">
            Total activos: {{ vehiculosStats.remis + vehiculosStats.escolar }} vehículos
          </div>
        </div>
      </div>

      <!-- Pending Inspections -->
      <div class="bento-card alerts-card">
        <h3 class="card-title text-orange"><AlertCircle :size="18" /> Inspecciones Pendientes</h3>
        <div class="alerts-list">
          <div v-if="pendingInspections.length === 0" class="empty-state">
            <ShieldCheck :size="32" class="empty-icon" />
            <p>¡Todo al día! No hay inspecciones pendientes.</p>
          </div>
          
          <div v-for="hab in pendingInspections" :key="hab.id" class="alert-item" @click="emit('navigate', 'insp_new')">
            <div class="alert-icon-wrapper">
              <Car :size="16" />
            </div>
            <div class="alert-info">
              <span class="alert-title">Dominio: {{ hab.dominio }}</span>
              <span class="alert-desc">{{ hab.tipoHabilitacion || 'Vehículo' }} - Exp: {{ hab.nroExpediente }}</span>
            </div>
            <div class="alert-action">Inspeccionar</div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bento-card activity-card col-span-2">
        <div class="card-header-flex">
          <h3 class="card-title"><TrendingUp :size="18" /> Últimos Movimientos</h3>
          <button class="btn-text" @click="emit('navigate', 'hab_list')">Ver todo</button>
        </div>
        
        <div class="modern-activity-list">
          <div v-if="recentActivity.length === 0" class="empty-state">
            <p>Sin actividad reciente registrada.</p>
          </div>
          
          <div v-for="(item, idx) in recentActivity" :key="idx" class="modern-activity-item" @click="emit('navigate', item.tab)">
            <div class="activity-icon-modern" :style="{ backgroundColor: item.color + '15', color: item.color }">
              <component :is="item.icon" :size="18" />
            </div>
            <div class="activity-details-modern">
              <span class="activity-name-modern">{{ item.name }}</span>
              <span class="activity-type-badge">{{ item.type }}</span>
            </div>
            <div class="activity-time-modern">
              {{ formatDate(item.date) }}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 10px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.03em;
  margin-bottom: 4px;
}

.header-content p {
  color: #64748b;
  font-size: 15px;
}

.header-date {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  grid-auto-rows: minmax(180px, auto);
}

.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-4 { grid-column: span 4; }

.bento-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  position: relative;
}

.bento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header-flex .card-title {
  margin-bottom: 0;
}

.btn-text {
  background: none;
  border: none;
  color: #3b82f6;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.btn-text:hover {
  text-decoration: underline;
}

.text-orange { color: #ea580c; }

/* Quick Actions */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.action-btn:hover {
  transform: scale(1.02);
}

.primary-action { background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); color: #4338ca; }
.secondary-action { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); color: #1d4ed8; }
.tertiary-action { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); color: #6d28d9; }

.action-icon {
  background: white;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.action-text h4 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.action-text p { font-size: 13px; opacity: 0.8; }
.arrow-icon { position: absolute; top: 20px; right: 20px; opacity: 0.3; transition: opacity 0.2s, transform 0.2s; }
.action-btn:hover .arrow-icon { opacity: 1; transform: translateX(3px) translateY(-3px); }

/* Stats Bubble */
.stats-card-container {
  background: transparent;
  box-shadow: none;
  border: none;
  padding: 0;
}
.stats-card-container:hover { transform: none; }

.stats-grid-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  height: 100%;
}

.stat-bubble {
  border-radius: 24px;
  padding: 24px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
  overflow: hidden;
}

.stat-bubble::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

.stat-bubble:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 14px 20px -5px rgba(0,0,0,0.15);
}

.stat-bubble-icon {
  background: rgba(255,255,255,0.2);
  width: 50px;
  height: 50px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.stat-value { font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 4px; display: block; }
.stat-label { font-size: 14px; font-weight: 500; opacity: 0.9; }

/* Chart Area */
.chart-container { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.chart-bar-wrap { margin-bottom: 16px; }
.mt-4 { margin-top: 16px; }
.chart-label { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px; }
.progress-bg { height: 10px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }
.chart-summary { margin-top: auto; padding-top: 16px; border-top: 1px dashed #e2e8f0; font-size: 13px; color: #64748b; font-weight: 500; text-align: center; }

/* Alerts */
.alerts-list { display: flex; flex-direction: column; gap: 12px; }
.alert-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.alert-item:hover { background: #ffedd5; transform: translateX(4px); }
.alert-icon-wrapper { background: #fdba74; color: #c2410c; padding: 8px; border-radius: 8px; }
.alert-info { flex: 1; display: flex; flex-direction: column; }
.alert-title { font-size: 13px; font-weight: 700; color: #9a3412; }
.alert-desc { font-size: 12px; color: #c2410c; }
.alert-action { font-size: 12px; font-weight: 600; color: #ea580c; background: white; padding: 4px 8px; border-radius: 4px; }

/* Activity Modern */
.modern-activity-list { display: flex; flex-direction: column; gap: 12px; }
.modern-activity-item { display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: 16px; cursor: pointer; transition: background 0.2s; }
.modern-activity-item:hover { background: #f8fafc; }
.activity-icon-modern { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.activity-details-modern { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.activity-name-modern { font-size: 14px; font-weight: 600; color: #1e293b; }
.activity-type-badge { align-self: flex-start; font-size: 11px; font-weight: 600; padding: 2px 8px; background: #e2e8f0; color: #475569; border-radius: 20px; }
.activity-time-modern { font-size: 13px; color: #94a3b8; font-weight: 500; }

.empty-state { padding: 40px 20px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty-icon { opacity: 0.5; margin-bottom: 8px; }

/* Responsive Grid */
@media (max-width: 1200px) {
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
  .col-span-2 { grid-column: span 2; }
  .stats-grid-inner { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .bento-grid { grid-template-columns: 1fr; }
  .col-span-2, .col-span-3, .col-span-4 { grid-column: span 1; }
  .actions-grid { grid-template-columns: 1fr; }
  .stats-grid-inner { grid-template-columns: 1fr; }
  .dashboard-header { flex-direction: column; align-items: flex-start; gap: 16px; }
}
</style>
