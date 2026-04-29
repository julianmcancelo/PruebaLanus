<script setup lang="ts">
import { Trash2, ExternalLink, Car, Hash, FileText } from 'lucide-vue-next';

defineProps<{
  titles: any[]
}>();

defineEmits(['delete', 'view']);
</script>

<template>
  <div class="glass-card table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Dominio / Vehículo</th>
          <th>Titular</th>
          <th>Trámite / Control</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="title in titles" :key="title.id" class="person-row">
          <td>
            <div class="person-info">
              <div class="person-avatar"><Car :size="16" /></div>
              <div>
                <div class="name">{{ title.dominio }}</div>
                <div class="gender">{{ title.marca }} {{ title.modelo }}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="id-info">
              <div class="id-number">{{ title.titular }}</div>
              <div class="id-type">{{ title.cuilTitular }}</div>
            </div>
          </td>
          <td>
            <div class="address-group">
              <div class="address-info"><Hash :size="14" /> {{ title.tramite }}</div>
              <div class="address-info"><FileText :size="14" /> {{ title.controlWeb }}</div>
            </div>
          </td>
          <td>
            <div class="actions">
              <button class="action-btn view" title="Ver detalles" @click="$emit('view', title)">
                <ExternalLink :size="18" />
              </button>
              <button class="action-btn delete" @click="$emit('delete', title.id)" title="Eliminar">
                <Trash2 :size="18" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Reuse styles from PeopleTable */
.table-container { overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th { padding: 16px 24px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid var(--glass-border); }
.person-row { border-bottom: 1px solid var(--glass-border); transition: background 0.2s; }
.person-row:hover { background: rgba(255, 255, 255, 0.02); }
.data-table td { padding: 16px 24px; vertical-align: middle; }
.person-info { display: flex; align-items: center; gap: 12px; }
.person-avatar { width: 32px; height: 32px; background: rgba(99, 102, 241, 0.1); color: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.name { font-weight: 600; color: white; margin-bottom: 2px; }
.gender { font-size: 12px; color: var(--text-muted); }
.id-number { font-weight: 500; color: white; margin-bottom: 2px; }
.id-type { font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; }
.address-group { display: flex; flex-direction: column; gap: 2px; }
.address-info { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 13px; }
.actions { display: flex; gap: 8px; }
.action-btn { background: rgba(255, 255, 255, 0.05); border: none; color: var(--text-muted); padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { color: white; background: rgba(255, 255, 255, 0.1); }
.action-btn.delete:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
.action-btn.view:hover { color: var(--accent); background: rgba(16, 185, 129, 0.1); }
</style>
