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
  gap: 32px;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 20px;
}

.welcome-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin-bottom: 4px;
}

.welcome-header p {
  font-size: 15px;
  color: #64748b;
}

.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.action-btn.primary {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.action-btn.primary:hover {
  background: #4338ca;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.purple .stat-icon { background: #ede9fe; color: #7c3aed; }
.stat-card.blue .stat-icon { background: #dbeafe; color: #2563eb; }
.stat-card.indigo .stat-icon { background: #e0e7ff; color: #4f46e5; }
.stat-card.green .stat-icon { background: #dcfce7; color: #16a34a; }
.stat-card.orange .stat-icon { background: #ffedd5; color: #ea580c; }

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  margin-top: 4px;
}

.stat-arrow {
  font-size: 20px;
  color: #cbd5e1;
  transition: all 0.2s;
}

.stat-card:hover .stat-arrow {
  color: #4f46e5;
  transform: translateX(4px);
}

/* Activity Section */
.activity-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4f46e5;
}

.header-left h2 {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.activity-item:hover {
  background: #f8fafc;
}

.activity-type {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.activity-type.persona { background: #7c3aed; }
.activity-type.título { background: #2563eb; }
.activity-type.habilitación { background: #4f46e5; }

.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.activity-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.activity-date {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.empty-activity {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
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
