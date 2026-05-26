<script setup lang="ts">
import { Trash2, ExternalLink, FileText, User, Car, Hash, Printer, ClipboardCheck, FileDown, AlertTriangle, FileSignature, CheckCircle2, AlertCircle, Calendar } from 'lucide-vue-next';

defineProps<{
  habilitaciones: any[],
  schools?: any[]
}>();

const emit = defineEmits(['delete', 'view', 'print', 'print-inspection', 'print-inspection-excel', 'generate-resolution', 'toggle-gestdoc', 'update-estado']);

const estadoClass = (estado: string) => {
  if (!estado) return 'iniciado';
  switch (estado) {
    case 'Resolución Armada': return 'resolucion-armada';
    case 'Tribunal de Faltas': return 'tribunal-faltas';
    case 'Resolución Formada': return 'resolucion-formada';
    case 'Trámite Finalizado': return 'tramite-finalizado';
    default: return 'iniciado';
  }
};

const formatHabilitacionDate = (timestamp: any) => {
  if (!timestamp) return '---';
  try {
    let date: Date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return '---';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return '---';
  }
};
</script>

<template>
  <div class="glass-card table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Expediente</th>
          <th>Titular</th>
          <th>Dominio / Licencia</th>
          <th>Estado</th>
          <th>GestDoc</th>
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
                <div class="gender-row">
                  <span class="gender">{{ hab.tipoTramite || 'Habilitación' }}</span>
                  <span v-if="hab.tipoHabilitacion" class="type-badge" :class="hab.tipoHabilitacion.toLowerCase()">
                    {{ hab.tipoHabilitacion }}
                  </span>
                </div>
                <div class="created-date-row">
                  <Calendar :size="11" />
                  <span>Creado: {{ formatHabilitacionDate(hab.timestamp) }}</span>
                </div>
                <div v-if="hab.idColegios?.length > 0" class="linked-entity-preview">
                  <School :size="10" />
                  <span>{{ schools?.find(s => String(s.id) === String(hab.idColegios[0]))?.nombre || '...' }}</span>
                  <span v-if="hab.idColegios.length > 1" class="more-count">+{{ hab.idColegios.length - 1 }}</span>
                </div>
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
            <select 
              :value="hab.estado || 'Iniciado'" 
              @change="emit('update-estado', { hab, estado: ($event.target as HTMLSelectElement).value })"
              @click.stop
              class="estado-select"
              :class="estadoClass(hab.estado)"
            >
              <option value="Iniciado">Iniciado</option>
              <option value="Resolución Armada">Resolución Armada</option>
              <option value="Tribunal de Faltas">Tribunal de Faltas</option>
              <option value="Resolución Formada">Resolución Formada</option>
              <option value="Trámite Finalizado">Trámite Finalizado</option>
            </select>
          </td>
          <td>
            <button 
              class="gestdoc-badge-btn" 
              :class="{ 'cargado': hab.cargadoGestdoc }"
              @click.stop="$emit('toggle-gestdoc', hab)"
              :title="hab.cargadoGestdoc ? 'Marcar como Pendiente' : 'Marcar como Cargado'"
            >
              <CheckCircle2 v-if="hab.cargadoGestdoc" :size="14" class="badge-icon" />
              <AlertCircle v-else :size="14" class="badge-icon" />
              <span>{{ hab.cargadoGestdoc ? 'Cargado' : 'Pendiente' }}</span>
            </button>
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
.gender-row { display: flex; align-items: center; gap: 8px; }
.gender { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.type-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
.type-badge.escolar { background: #fef3c7; color: #92400e; }
.type-badge.remis { background: #dcfce7; color: #166534; }
.linked-entity-preview { 
  display: flex; 
  align-items: center; 
  gap: 4px; 
  margin-top: 4px; 
  font-size: 11px; 
  color: var(--primary); 
  font-weight: 600;
  background: rgba(99, 102, 241, 0.05);
  padding: 2px 8px;
  border-radius: 6px;
  width: fit-content;
}
.more-count { color: var(--text-muted); font-size: 10px; font-weight: 700; }
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

.gestdoc-badge-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--border-light);
  background: #f1f5f9;
  color: #64748b;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  user-select: none;
}

.gestdoc-badge-btn:hover {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.gestdoc-badge-btn.cargado {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

.gestdoc-badge-btn.cargado:hover {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.3);
}

.badge-icon {
  flex-shrink: 0;
}

.created-date-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  font-weight: 600;
}

.estado-select {
  padding: 6px 16px 6px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  outline: none;
  font-family: 'Outfit', sans-serif;
  text-align-last: center;
  width: 100%;
  max-width: 150px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 10px;
  padding-right: 24px;
  appearance: none;
}

.estado-select:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.estado-select.iniciado {
  background-color: #f1f5f9;
  color: #64748b;
  border-color: #cbd5e1;
}
.estado-select.iniciado:hover {
  background-color: #e2e8f0;
}

.estado-select.resolucion-armada {
  background-color: rgba(249, 115, 22, 0.08);
  color: #c2410c;
  border-color: rgba(249, 115, 22, 0.2);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c2410c' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}
.estado-select.resolucion-armada:hover {
  background-color: rgba(249, 115, 22, 0.15);
}

.estado-select.tribunal-faltas {
  background-color: rgba(99, 102, 241, 0.08);
  color: #4338ca;
  border-color: rgba(99, 102, 241, 0.2);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234338ca' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}
.estado-select.tribunal-faltas:hover {
  background-color: rgba(99, 102, 241, 0.15);
}

.estado-select.resolucion-formada {
  background-color: rgba(20, 184, 166, 0.08);
  color: #0f766e;
  border-color: rgba(20, 184, 166, 0.2);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f766e' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}
.estado-select.resolucion-formada:hover {
  background-color: rgba(20, 184, 166, 0.15);
}

.estado-select.tramite-finalizado {
  background-color: rgba(16, 185, 129, 0.08);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}
.estado-select.tramite-finalizado:hover {
  background-color: rgba(16, 185, 129, 0.15);
}
</style>
