<script setup lang="ts">
import { Trash2, Eye, Car, Hash, Calendar, Tag } from 'lucide-vue-next';

defineProps<{
  titles: any[]
}>();

defineEmits(['delete', 'view']);
</script>

<template>
  <div class="glass-card table-wrapper animate-fade">
    <table class="data-table">
      <thead>
        <tr>
          <th>Vehículo / Patente</th>
          <th>Detalles Técnicos</th>
          <th>Titular</th>
          <th>Trámite</th>
          <th class="text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="title in titles" :key="title.id" class="row-hover">
          <td>
            <div class="vehicle-cell">
              <div class="domain-badge">{{ title.dominio }}</div>
              <div class="vehicle-type">
                <Tag :size="12" />
                <span>{{ title.tipo || 'Particular' }}</span>
              </div>
            </div>
          </td>
          <td>
            <div class="tech-info">
              <div class="model-name">{{ title.marca }} {{ title.modelo }}</div>
              <div class="year-info">
                <Calendar :size="12" />
                <span>Año: {{ title.anioModelo || title.anioFabricacion || '---' }}</span>
              </div>
            </div>
          </td>
          <td>
            <div class="owner-info">
              <div class="owner-name">{{ title.titular }}</div>
              <div class="owner-cuil">{{ title.cuilTitular }}</div>
            </div>
          </td>
          <td>
            <div class="process-info">
              <div class="process-item"><Hash :size="12" /> {{ title.tramite || '---' }}</div>
              <div class="process-sub">Control: {{ title.controlWeb || '---' }}</div>
            </div>
          </td>
          <td class="text-right">
            <div class="action-group">
              <button class="btn-icon view" title="Ver detalles" @click="$emit('view', title)">
                <Eye :size="16" />
              </button>
              <button class="btn-icon delete" @click="$emit('delete', title.id)" title="Eliminar">
                <Trash2 :size="16" />
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="titles.length === 0">
          <td colspan="5" class="empty-row">No hay títulos registrados.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  overflow: hidden;
  border: 1px solid var(--border-light);
  background: white;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8fafc;
  padding: 12px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-light);
}

.data-table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-light);
  vertical-align: middle;
}

.row-hover:hover {
  background-color: rgba(79, 70, 229, 0.02);
}

/* Vehicle Cell */
.vehicle-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.domain-badge {
  background: #f1f5f9;
  color: #0f172a;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: 'Monospace', monospace;
  font-weight: 800;
  font-size: 14px;
  border: 1px solid #cbd5e1;
  width: fit-content;
  box-shadow: inset 0 1px 0 rgba(255,255,255,1);
}

.vehicle-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
}

/* Tech Info */
.tech-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.model-name {
  font-weight: 700;
  color: var(--text-main);
  font-size: 14px;
}

.year-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

/* Owner Info */
.owner-info {
  display: flex;
  flex-direction: column;
}

.owner-name {
  font-weight: 600;
  color: var(--text-main);
  font-size: 13px;
}

.owner-cuil {
  font-size: 11px;
  color: var(--text-muted);
  font-family: monospace;
}

/* Process Info */
.process-info {
  display: flex;
  flex-direction: column;
}

.process-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.process-sub {
  font-size: 11px;
  color: var(--text-muted);
}

/* Actions */
.text-right { text-align: right; }

.action-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-icon {
  background: #f1f5f9;
  border: none;
  color: var(--text-muted);
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: var(--text-main);
  color: white;
}

.btn-icon.view:hover {
  background: var(--primary);
  color: white;
}

.btn-icon.delete:hover {
  background: var(--danger);
  color: white;
}

.empty-row {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  font-size: 14px;
}
</style>
