<script setup lang="ts">
import { computed } from 'vue';
import { Users, Car, FileText, School, ClipboardCheck, Plus, Upload, Zap, TrendingUp } from 'lucide-vue-next';

const props = defineProps<{
  people: any[];
  titles: any[];
  habilitaciones: any[];
  schools: any[];
  inspections: any[];
}>();

const emit = defineEmits(['navigate']);

const stats = computed(() => [
  { label: 'Personas', value: props.people.length, icon: Users, color: 'purple', tab: 'registry' },
  { label: 'Títulos', value: props.titles.length, icon: Car, color: 'blue', tab: 'titles_list' },
  { label: 'Habilitaciones', value: props.habilitaciones.length, icon: FileText, color: 'indigo', tab: 'hab_list' },
  { label: 'Colegios', value: props.schools.length, icon: School, color: 'green', tab: 'school_list' },
  { label: 'Inspecciones', value: props.inspections.length, icon: ClipboardCheck, color: 'orange', tab: 'insp_list' },
]);

const recentActivity = computed(() => {
  const all = [
    ...props.people.map(p => ({ type: 'Persona', name: `${p.surname}, ${p.names}`, date: p.timestamp, tab: 'registry' })),
    ...props.titles.map(t => ({ type: 'Título', name: `${t.marca} ${t.modelo} (${t.dominio})`, date: t.timestamp, tab: 'titles_list' })),
    ...props.habilitaciones.map(h => ({ type: 'Habilitación', name: `Exp ${h.nroExpediente}`, date: h.timestamp, tab: 'hab_list' })),
  ].sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 8);
  
  return all;
});

const formatDate = (ts: any) => {
  if (!ts) return 'Reciente';
  const d = new Date(ts);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};
</script>

<template>
  <div class="dashboard animate-fade">
    <!-- Welcome Header -->
    <div class="welcome-header">
      <div>
        <h1>Panel de Control</h1>
        <p>Resumen general del sistema de gestión municipal</p>
      </div>
      <div class="quick-actions">
        <button class="action-btn primary" @click="emit('navigate', 'scan')">
          <Plus :size="16" /> Nueva Persona
        </button>
        <button class="action-btn" @click="emit('navigate', 'titles_scan')">
          <Upload :size="16" /> Escanear Título
        </button>
        <button class="action-btn" @click="emit('navigate', 'hab_scan')">
          <Zap :size="16" /> Nueva Habilitación
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card" :class="stat.color" @click="emit('navigate', stat.tab)">
        <div class="stat-icon">
          <component :is="stat.icon" :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
        <div class="stat-arrow">→</div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section">
      <div class="section-header">
        <div class="header-left">
          <TrendingUp :size="20" />
          <h2>Actividad Reciente</h2>
        </div>
      </div>
      
      <div class="activity-list">
        <div v-if="recentActivity.length === 0" class="empty-activity">
          <p>No hay registros todavía. Empezá escaneando un documento.</p>
        </div>
        
        <div v-for="(item, idx) in recentActivity" :key="idx" class="activity-item" @click="emit('navigate', item.tab)">
          <div class="activity-type" :class="item.type.toLowerCase()">
            {{ item.type.charAt(0) }}
          </div>
          <div class="activity-details">
            <span class="activity-name">{{ item.name }}</span>
            <span class="activity-date">{{ formatDate(item.date) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.welcome-header h1 {
  font-size: 23px;
  font-weight: 400;
  color: var(--wp-text, #1d2327);
  letter-spacing: 0;
  margin-bottom: 2px;
}

.welcome-header p {
  font-size: 13px;
  color: var(--wp-text-secondary, #50575e);
}

.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #c3c4c7;
  background: #f6f7f7;
  color: #2271b1;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
  height: 30px;
}

.action-btn:hover {
  border-color: #2271b1;
  background: #f0f0f1;
  box-shadow: none;
  transform: none;
}

.action-btn.primary {
  background: #2271b1;
  color: white;
  border-color: #2271b1;
}

.action-btn.primary:hover {
  background: #135e96;
  border-color: #135e96;
}

/* Stats Grid - WP Dashboard Widgets */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  background: #fff;
  border: 1px solid #c3c4c7;
  box-shadow: 0 1px 1px rgba(0,0,0,0.04);
}

.stat-card {
  background: white;
  border: none;
  border-right: 1px solid #c3c4c7;
  border-radius: 0;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.1s;
}

.stat-card:last-child {
  border-right: none;
}

.stat-card:hover {
  background: #f0f6fc;
  transform: none;
  box-shadow: none;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.purple .stat-icon { background: #f0f6fc; color: #2271b1; }
.stat-card.blue .stat-icon { background: #f0f6fc; color: #2271b1; }
.stat-card.indigo .stat-icon { background: #f0f6fc; color: #2271b1; }
.stat-card.green .stat-icon { background: #edfaef; color: #00a32a; }
.stat-card.orange .stat-icon { background: #fcf0f1; color: #d63638; }

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 400;
  color: #1d2327;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #50575e;
  font-weight: 400;
  margin-top: 2px;
}

.stat-arrow {
  font-size: 16px;
  color: #c3c4c7;
  transition: color 0.1s;
}

.stat-card:hover .stat-arrow {
  color: #2271b1;
  transform: none;
}

/* Activity Section - WP Widget */
.activity-section {
  background: white;
  border: 1px solid #c3c4c7;
  border-radius: 0;
  padding: 0;
  box-shadow: 0 1px 1px rgba(0,0,0,0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
  padding: 8px 12px;
  border-bottom: 1px solid #c3c4c7;
  background: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1d2327;
}

.header-left h2 {
  font-size: 14px;
  font-weight: 600;
  color: #1d2327;
  margin: 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 0;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid #f0f0f1;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: #f0f6fc;
}

.activity-type {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.activity-type.persona { background: #2271b1; }
.activity-type.título { background: #2271b1; }
.activity-type.habilitación { background: #2271b1; }

.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.activity-name {
  font-size: 13px;
  font-weight: 400;
  color: #2271b1;
}

.activity-item:hover .activity-name {
  color: #135e96;
  text-decoration: underline;
}

.activity-date {
  font-size: 12px;
  color: #787c82;
  margin-top: 1px;
}

.empty-activity {
  padding: 30px;
  text-align: center;
  color: #787c82;
  font-size: 13px;
}

@media (max-width: 768px) {
  .welcome-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
