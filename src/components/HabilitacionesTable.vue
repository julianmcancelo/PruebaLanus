<script setup lang="ts">
import { Trash2, ExternalLink, FileText, User, Car, Hash, Printer, ClipboardCheck, FileDown, AlertTriangle, FileSignature } from 'lucide-vue-next';

defineProps<{
  habilitaciones: any[]
}>();

defineEmits(['delete', 'view', 'print', 'print-inspection', 'print-inspection-excel', 'generate-resolution']);
</script>

<template>
  <div class="glass-card table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Expediente</th>
          <th>Titular</th>
          <th>Dominio / Licencia</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="hab in habilitaciones" :key="hab.id" class="person-row">
          <td>
            <div class="person-info">
              <div class="person-avatar"><FileText :size="16" /></div>
              <div>
                <div class="name">{{ hab.nroExpediente }}</div>
                <div class="gender">{{ hab.tipoTramite || 'Habilitación' }}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="id-info">
              <div class="name-row">
                <div class="id-number">{{ hab.titular }}</div>
                <AlertTriangle v-if="!hab.email || !hab.phone" :size="14" class="contact-alert" title="Faltan datos de contacto" />
              </div>
              <div class="id-type">{{ hab.idNumber }}</div>
            </div>
          </td>
          <td>
            <div class="address-group">
              <div class="address-info"><Car :size="14" /> {{ hab.dominio || '---' }}</div>
              <div class="address-info"><Hash :size="14" /> Lic: {{ hab.nroLicencia || '---' }}</div>
            </div>
          </td>
          <td>
            <div class="actions">
              <button class="action-btn view" title="Ver detalles" @click="$emit('view', hab)">
                <ExternalLink :size="18" />
              </button>
              <button class="action-btn print" title="Imprimir Certificado" @click="$emit('print', hab)">
                <Printer :size="18" />
              </button>
              <button class="action-btn print" title="Imprimir Acta PDF" @click="$emit('print-inspection', hab)">
                <ClipboardCheck :size="18" />
              </button>
              <button class="action-btn print" title="Imprimir Acta Excel" @click="$emit('print-inspection-excel', hab)">
                <FileDown :size="18" />
              </button>
              <button class="action-btn print" title="Generar Resolución DOCX" @click="$emit('generate-resolution', hab)">
                <FileSignature :size="18" />
              </button>
              <button class="action-btn delete" @click="$emit('delete', hab.id)" title="Eliminar">
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
.data-table th { 
  padding: 16px 24px; 
  font-size: 12px; 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 0.05em; 
  color: var(--text-muted); 
  background: #f8fafc;
  border-bottom: 1px solid var(--border-light); 
}
.person-row { 
  border-bottom: 1px solid var(--border-light); 
  transition: all 0.2s; 
}
.person-row:hover { 
  background: #f1f5f9; 
}
.data-table td { 
  padding: 16px 24px; 
  vertical-align: middle; 
}
.person-info { display: flex; align-items: center; gap: 12px; }
.person-avatar { 
  width: 40px; 
  height: 40px; 
  background: rgba(79, 70, 229, 0.1); 
  color: var(--primary); 
  border-radius: 10px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}
.name { 
  font-weight: 700; 
  color: var(--text-main); 
  margin-bottom: 2px; 
  font-size: 15px;
}
.gender { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.id-number { 
  font-weight: 700; 
  color: var(--text-main); 
  margin-bottom: 2px; 
  font-size: 14px;
}
.name-row { display: flex; align-items: center; gap: 8px; }
.contact-alert { color: var(--danger); animation: pulse 2s infinite; }
.id-type { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; font-family: monospace; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
.address-group { display: flex; flex-direction: column; gap: 2px; }
.address-info { display: flex; align-items: center; gap: 6px; color: #475569; font-size: 13px; font-weight: 500; }

.actions { display: flex; gap: 8px; }
.action-btn { 
  background: white; 
  border: 1px solid var(--border-light); 
  color: var(--text-muted); 
  padding: 8px; 
  border-radius: 10px; 
  cursor: pointer; 
  transition: all 0.2s; 
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.action-btn:hover { color: var(--text-main); background: #f8fafc; }
.action-btn.delete:hover { color: var(--danger); background: rgba(239, 68, 68, 0.05); border-color: var(--danger); }
.action-btn.view:hover { color: var(--accent); background: rgba(16, 185, 129, 0.05); border-color: var(--accent); }
.action-btn.print:hover { color: var(--primary); background: rgba(79, 70, 229, 0.05); border-color: var(--primary); }
</style>
