<script setup lang="ts">
import { Trash2, ExternalLink, ClipboardCheck, Calendar, Car, AlertTriangle, CheckCircle2, Printer } from 'lucide-vue-next';

defineProps<{
  inspections: any[]
}>();

defineEmits(['delete', 'view', 'print']);

const getResultClass = (res: string) => {
  if (res === 'APROBADO') return 'badge-success';
  if (res === 'CONDICIONAL') return 'badge-warning';
  return 'badge-danger';
};
</script>

<template>
  <div class="glass-card table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Vehículo</th>
          <th>Resultado</th>
          <th>Observaciones</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ins in inspections" :key="ins.id" class="person-row">
          <td>
            <div class="person-info">
              <div class="person-avatar"><Calendar :size="16" /></div>
              <div>
                <div class="name">{{ ins.fecha }}</div>
                <div class="gender">Técnica</div>
              </div>
            </div>
          </td>
          <td>
            <div class="id-info">
              <div class="id-number"><Car :size="14" /> {{ ins.dominio }}</div>
            </div>
          </td>
          <td>
            <span class="badge" :class="getResultClass(ins.resultado)">
              {{ ins.resultado }}
            </span>
          </td>
          <td class="obs-cell">
            <div class="observaciones">{{ ins.observaciones || 'Sin observaciones' }}</div>
          </td>
          <td>
            <div class="actions">
              <button class="action-btn print" title="Imprimir PDF" @click="$emit('print', ins)">
                <Printer :size="18" />
              </button>
              <button class="action-btn view" title="Ver detalles" @click="$emit('view', ins)">
                <ExternalLink :size="18" />
              </button>
              <button class="action-btn delete" @click="$emit('delete', ins.id)" title="Eliminar">
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
.id-number { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--primary); }
.badge { font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; }
.badge-success { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.badge-warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.badge-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.obs-cell { max-width: 200px; }
.observaciones { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.actions { display: flex; gap: 8px; }
.action-btn { background: rgba(255, 255, 255, 0.05); border: none; color: var(--text-muted); padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { color: white; background: rgba(255, 255, 255, 0.1); }
.action-btn.delete:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
.action-btn.view:hover { color: var(--accent); background: rgba(16, 185, 129, 0.1); }
.action-btn.print:hover { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
</style>
