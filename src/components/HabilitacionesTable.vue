<script setup lang="ts">
import { ref, computed } from 'vue';
import { Trash2, ExternalLink, FileText, User, Car, Hash, Printer, ClipboardCheck, FileDown, AlertTriangle, FileSignature, CheckCircle2, AlertCircle, Calendar, School, Layers, BadgeAlert, CheckCircle, Flame } from 'lucide-vue-next';

const props = defineProps<{
  habilitaciones: any[],
  schools?: any[]
}>();

const emit = defineEmits(['delete', 'view', 'print', 'print-inspection', 'print-inspection-excel', 'generate-resolution', 'toggle-gestdoc', 'update-estado']);

// Dynamic Filter State
const activeFilter = ref<'all' | 'gestdoc_pending' | 'tribunal' | 'finalized'>('all');

const filteredHabs = computed(() => {
  if (activeFilter.value === 'gestdoc_pending') {
    return props.habilitaciones.filter(h => !h.cargadoGestdoc);
  }
  if (activeFilter.value === 'tribunal') {
    return props.habilitaciones.filter(h => h.estado === 'Tribunal de Faltas');
  }
  if (activeFilter.value === 'finalized') {
    return props.habilitaciones.filter(h => h.estado === 'Trámite Finalizado');
  }
  return props.habilitaciones;
});

// Stats Counters
const stats = computed(() => {
  const all = props.habilitaciones.length;
  const gestdocPending = props.habilitaciones.filter(h => !h.cargadoGestdoc).length;
  const tribunal = props.habilitaciones.filter(h => h.estado === 'Tribunal de Faltas').length;
  const finalized = props.habilitaciones.filter(h => h.estado === 'Trámite Finalizado').length;
  return { all, gestdocPending, tribunal, finalized };
});

const getEstados = (tipo: string) => {
  if (tipo === 'Punto Inicial - Terminal') {
    return [
      'Tribunal de Faltas - Emite Informe Libre Deuda',
      'Dir. Gral. de Movilidad y Transporte - Inspección',
      'Dir Gral Mov y Transp - Certifica Documentación',
      'Dir Gral Mov y Transporte - Emite Constancia',
      'S Seguridad y Ord. Urbano - Fima Constancia',
      'Dir Gral Mov y Transp-Entrega Constancia y Archiva'
    ];
  }
  if (tipo === 'Escolar') {
    return [
      'Dir. Mov y Transporte - Verifica Doc. y Sellados',
      'Tribunal de Faltas - Informe Libre Deuda',
      'P1 Dir. Mov. y Transporte - Informe Psicotécnico',
      'P1 Dir. Mov y Transporte - Informe Vehicular',
      'Dir. Mov. y Transporte - Verifica Informes',
      'Dir. Mov. y Transporte - Confecciona Resolución',
      'S Legal y Técnica - Revisión',
      'S Legal y Técnica - Prepara Res. para la Firma',
      'S S Ordenamiento Urbano - Firma Resolución',
      'S Legal y Técnica - Control Resolución',
      'S Seguridad y Ord Urbano - Firma Resolución',
      'S Legal y Técnica - Protocoliza Resolución',
      'Dir Mov y Transp - Notifica, Entrega Cred. y Resol'
    ];
  }
  return [
    'Iniciado',
    'Resolución Armada',
    'Tribunal de Faltas',
    'Resolución Formada',
    'Trámite Finalizado'
  ];
};

const estadoClass = (estado: string, tipo?: string) => {
  if (!estado) return 'iniciado';
  if (tipo === 'Punto Inicial - Terminal') {
    const idx = getEstados(tipo).indexOf(estado);
    switch (idx) {
      case 0: return 'iniciado';
      case 1: return 'resolucion-armada';
      case 2: return 'tribunal-faltas';
      case 3: return 'resolucion-formada';
      case 4: return 'firma-constancia';
      case 5: return 'tramite-finalizado';
      default: return 'iniciado';
    }
  }
  if (tipo === 'Escolar') {
    const idx = getEstados(tipo).indexOf(estado);
    if (idx === 0) return 'iniciado';
    if (idx >= 1 && idx <= 3) return 'resolucion-armada';
    if (idx === 4) return 'tribunal-faltas';
    if (idx >= 5 && idx <= 10) return 'resolucion-formada';
    if (idx === 11) return 'tramite-finalizado';
    return 'iniciado';
  }
  switch (estado) {
    case 'Resolución Armada': return 'resolucion-armada';
    case 'Tribunal de Faltas': return 'tribunal-faltas';
    case 'Resolución Formada': return 'resolucion-formada';
    case 'Trámite Finalizado': return 'tramite-finalizado';
    default: return 'iniciado';
  }
};

const getProgressPercentage = (estado: string, tipo?: string) => {
  if (!estado) return 20;
  const estados = getEstados(tipo || '');
  const idx = estados.indexOf(estado);
  if (idx === -1) return 20;
  return Math.round(((idx + 1) / estados.length) * 100);
};

const getProgressColor = (estado: string, tipo?: string) => {
  if (!estado) return '#64748b'; // slate
  if (tipo === 'Punto Inicial - Terminal') {
    const idx = getEstados(tipo).indexOf(estado);
    switch (idx) {
      case 0: return '#64748b'; // slate
      case 1: return '#eab308'; // yellow
      case 2: return '#f97316'; // orange
      case 3: return '#6366f1'; // indigo
      case 4: return '#14b8a6'; // teal
      case 5: return '#10b981'; // emerald
      default: return '#64748b';
    }
  }
  if (tipo === 'Escolar') {
    const idx = getEstados(tipo).indexOf(estado);
    if (idx === 0) return '#64748b'; // slate
    if (idx >= 1 && idx <= 3) return '#eab308'; // yellow
    if (idx === 4) return '#6366f1'; // indigo
    if (idx >= 5 && idx <= 10) return '#14b8a6'; // teal
    if (idx === 11) return '#10b981'; // emerald
    return '#64748b';
  }
  switch (estado) {
    case 'Iniciado': return '#64748b'; // slate
    case 'Resolución Armada': return '#f97316'; // orange
    case 'Tribunal de Faltas': return '#6366f1'; // indigo
    case 'Resolución Formada': return '#14b8a6'; // teal
    case 'Trámite Finalizado': return '#10b981'; // emerald
    default: return '#64748b';
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
  <div class="habilitaciones-wrapper">
    <!-- Premium Interactive Dashboard Stats Row -->
    <div class="stats-dashboard-row">
      <div 
        class="stat-card card-indigo" 
        :class="{ active: activeFilter === 'all' }"
        @click="activeFilter = 'all'"
      >
        <div class="stat-icon-wrapper"><Layers :size="20" /></div>
        <div class="stat-content">
          <span class="stat-label">Total Habilitaciones</span>
          <span class="stat-number">{{ stats.all }}</span>
        </div>
        <div class="stat-badge">Ver todos</div>
      </div>
      
      <div 
        class="stat-card card-orange" 
        :class="{ active: activeFilter === 'gestdoc_pending' }"
        @click="activeFilter = 'gestdoc_pending'"
      >
        <div class="stat-icon-wrapper"><BadgeAlert :size="20" /></div>
        <div class="stat-content">
          <span class="stat-label">GestDoc Pendientes</span>
          <span class="stat-number">{{ stats.gestdocPending }}</span>
        </div>
        <div v-if="stats.gestdocPending > 0" class="stat-pulse-dot"></div>
        <div class="stat-badge">Revisar</div>
      </div>
      
      <div 
        class="stat-card card-red" 
        :class="{ active: activeFilter === 'tribunal' }"
        @click="activeFilter = 'tribunal'"
      >
        <div class="stat-icon-wrapper"><Flame :size="20" /></div>
        <div class="stat-content">
          <span class="stat-label">En Tribunal de Faltas</span>
          <span class="stat-number">{{ stats.tribunal }}</span>
        </div>
        <div class="stat-badge">Urgente</div>
      </div>
      
      <div 
        class="stat-card card-green" 
        :class="{ active: activeFilter === 'finalized' }"
        @click="activeFilter = 'finalized'"
      >
        <div class="stat-icon-wrapper"><CheckCircle :size="20" /></div>
        <div class="stat-content">
          <span class="stat-label">Habilitaciones Finalizadas</span>
          <span class="stat-number">{{ stats.finalized }}</span>
        </div>
        <div class="stat-badge">Completadas</div>
      </div>
    </div>

    <!-- Habilitaciones Table Card -->
    <div class="glass-card table-container animate-slide-up">
      <div class="table-header-title">
        <h3>Registros de Habilitación Oficiales</h3>
        <p v-if="activeFilter !== 'all'" class="filter-indicator">
          Filtrado por: <strong>{{ activeFilter === 'gestdoc_pending' ? 'Pendientes en GestDoc' : activeFilter === 'tribunal' ? 'Tribunal de Faltas' : 'Finalizados' }}</strong>
          <span class="clear-filter" @click="activeFilter = 'all'">Mostrar todos</span>
        </p>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Expediente</th>
            <th>Titular / Contratante</th>
            <th>Dominio / Licencia</th>
            <th>Estado Habilitación</th>
            <th>Gestdoc Oficial</th>
            <th>Acciones Integradas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hab in filteredHabs" :key="hab.id" class="person-row">
            <td>
              <div class="person-info">
                <div class="person-avatar" :class="hab.tipoHabilitacion ? hab.tipoHabilitacion.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-avatar' : 'escolar-avatar'">
                  <FileText :size="18" />
                </div>
                <div>
                  <div class="name">{{ hab.nroExpediente }}</div>
                  <div class="gender-row">
                    <span class="gender">{{ hab.tipoTramite || 'Habilitación' }}</span>
                    <span v-if="hab.tipoHabilitacion" class="type-badge" :class="hab.tipoHabilitacion.toLowerCase().replace(/[^a-z0-9]+/g, '-')">
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
                <div class="address-info font-bold"><Car :size="14" style="color: #6366f1;" /> {{ hab.dominio || '---' }}</div>
                <div class="address-info"><Hash :size="14" /> Lic: {{ hab.nroLicencia || '---' }}</div>
              </div>
            </td>
            <td>
              <div class="estado-cell-wrapper">
                <select 
                  :value="hab.estado || (hab.tipoHabilitacion === 'Punto Inicial - Terminal' ? 'Tribunal de Faltas - Emite Informe Libre Deuda' : 'Iniciado')" 
                  @change="emit('update-estado', { hab, estado: ($event.target as HTMLSelectElement).value })"
                  @click.stop
                  class="estado-select"
                  :class="estadoClass(hab.estado, hab.tipoHabilitacion)"
                >
                  <option v-for="est in getEstados(hab.tipoHabilitacion)" :key="est" :value="est">
                    {{ est }}
                  </option>
                </select>
                
                <!-- Dynamic Pipeline Progress Bar -->
                <div class="pipeline-progress-bar">
                  <div class="progress-bg">
                    <div 
                      class="progress-fill" 
                      :style="{ 
                        width: getProgressPercentage(hab.estado, hab.tipoHabilitacion) + '%',
                        backgroundColor: getProgressColor(hab.estado, hab.tipoHabilitacion),
                        boxShadow: `0 0 8px ${getProgressColor(hab.estado, hab.tipoHabilitacion)}80`
                      }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ getProgressPercentage(hab.estado, hab.tipoHabilitacion) }}% Completado</span>
                </div>
              </div>
            </td>
            <td>
              <button 
                class="gestdoc-badge-btn" 
                :class="{ 'cargado': hab.cargadoGestdoc }"
                @click.stop="$emit('toggle-gestdoc', hab)"
                :title="hab.cargadoGestdoc ? 'Marcar como Pendiente' : 'Marcar como Cargado'"
              >
                <div v-if="hab.cargadoGestdoc" class="green-glow-pulse"></div>
                <div v-else class="amber-glow-pulse"></div>
                
                <CheckCircle2 v-if="hab.cargadoGestdoc" :size="13" class="badge-icon" />
                <AlertCircle v-else :size="13" class="badge-icon" />
                <span>{{ hab.cargadoGestdoc ? 'Cargado' : 'Pendiente' }}</span>
              </button>
            </td>
            <td>
              <div class="actions">
                <button class="action-btn view" title="Ver Ficha y Firmar" @click="$emit('view', hab)">
                  <ExternalLink :size="16" />
                </button>
                <button class="action-btn print" title="Imprimir Certificado PDF" @click="$emit('print', hab)">
                  <Printer :size="16" />
                </button>
                <button class="action-btn print-inspection" title="Imprimir Acta Inspección" @click="$emit('print-inspection', hab)">
                  <ClipboardCheck :size="16" />
                </button>
                <button class="action-btn excel" title="Exportar Acta Excel" @click="$emit('print-inspection-excel', hab)">
                  <FileDown :size="16" />
                </button>
                <button class="action-btn docx" title="Generar Resolución Word" @click="$emit('generate-resolution', hab)">
                  <FileSignature :size="16" />
                </button>
                <button class="action-btn delete" @click="$emit('delete', hab.id)" title="Eliminar Registro">
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredHabs.length === 0">
            <td colspan="6" class="empty-table-state">
              <div class="empty-content">
                <AlertCircle :size="32" class="empty-icon" />
                <h4>No se encontraron habilitaciones</h4>
                <p>No hay registros que coincidan con la categoría de filtro seleccionada.</p>
                <button class="btn btn-secondary" @click="activeFilter = 'all'">Restaurar filtro</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.habilitaciones-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

/* Stats dashboard top row */
.stats-dashboard-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  width: 100%;
}

.stat-card {
  background: white;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  opacity: 0.3;
  transition: all 0.25s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.08);
}

.stat-card.active {
  border-color: transparent;
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.15);
}

.stat-card.active::after {
  height: 6px;
  opacity: 1;
}

.stat-icon-wrapper {
  padding: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
}

.stat-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.stat-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-number {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.1;
  margin-top: 4px;
}

.stat-badge {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0.8;
  letter-spacing: 0.03em;
}

/* Card Themes */
.card-indigo { border-left: 4px solid #6366f1; }
.card-indigo::after { background: #6366f1; }
.card-indigo .stat-icon-wrapper { background: rgba(99, 102, 241, 0.08); color: #6366f1; }
.card-indigo.active { background: linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%); border: 1.5px solid #6366f1; }
.card-indigo .stat-badge { background: rgba(99, 102, 241, 0.08); color: #6366f1; }

.card-orange { border-left: 4px solid #f97316; }
.card-orange::after { background: #f97316; }
.card-orange .stat-icon-wrapper { background: rgba(249, 115, 22, 0.08); color: #f97316; }
.card-orange.active { background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%); border: 1.5px solid #f97316; }
.card-orange .stat-badge { background: rgba(249, 115, 22, 0.08); color: #f97316; }

.card-red { border-left: 4px solid #ef4444; }
.card-red::after { background: #ef4444; }
.card-red .stat-icon-wrapper { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
.card-red.active { background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%); border: 1.5px solid #ef4444; }
.card-red .stat-badge { background: rgba(239, 68, 68, 0.08); color: #ef4444; }

.card-green { border-left: 4px solid #10b981; }
.card-green::after { background: #10b981; }
.card-green .stat-icon-wrapper { background: rgba(16, 185, 129, 0.08); color: #10b981; }
.card-green.active { background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%); border: 1.5px solid #10b981; }
.card-green .stat-badge { background: rgba(16, 185, 129, 0.08); color: #10b981; }

.stat-pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #f97316;
  border-radius: 50%;
  position: absolute;
  top: 15px;
  right: 15px;
  box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
  animation: pulse-dot 1.5s infinite cubic-bezier(0.66, 0, 0, 1);
}

@keyframes pulse-dot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
}

/* Table Container & Layout */
.table-container { 
  overflow: hidden; 
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-light);
}

.table-header-title {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: linear-gradient(to right, #ffffff, #f8fafc);
}

.table-header-title h3 {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.filter-indicator {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-filter {
  color: #6366f1;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 4px;
}

.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th { 
  padding: 14px 24px; 
  font-size: 11px; 
  font-weight: 800; 
  text-transform: uppercase; 
  letter-spacing: 0.05em; 
  color: #64748b; 
  background: #f8fafc;
  border-bottom: 1px solid var(--border-light); 
}

.person-row { 
  border-bottom: 1px solid var(--border-light); 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
}

.person-row:hover { 
  background: #f8fafc; 
  transform: scale(1.002);
}

.data-table td { 
  padding: 16px 24px; 
  vertical-align: middle; 
}

.person-info { display: flex; align-items: center; gap: 14px; }
.person-avatar { 
  width: 42px; 
  height: 42px; 
  border-radius: 12px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}

.person-avatar.escolar-avatar { background: rgba(245, 158, 11, 0.08); color: #d97706; }
.person-avatar.remis-avatar { background: rgba(16, 185, 129, 0.08); color: #10b981; }
.person-avatar.punto-inicial-terminal-avatar { background: rgba(99, 102, 241, 0.08); color: #6366f1; }

.name { 
  font-weight: 800; 
  color: var(--text-main); 
  margin-bottom: 2px; 
  font-size: 14px;
}

.gender-row { display: flex; align-items: center; gap: 8px; }
.gender { font-size: 11px; color: var(--text-muted); font-weight: 600; }
.type-badge { font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.02em; }
.type-badge.escolar { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.type-badge.remis { background: rgba(16, 185, 129, 0.1); color: #059669; }
.type-badge.punto-inicial-terminal { background: rgba(99, 102, 241, 0.1); color: #6366f1; }

.linked-entity-preview { 
  display: flex; 
  align-items: center; 
  gap: 4px; 
  margin-top: 5px; 
  font-size: 10px; 
  color: #6366f1; 
  font-weight: 700;
  background: rgba(99, 102, 241, 0.05);
  padding: 2px 8px;
  border-radius: 6px;
  width: fit-content;
  border: 1px solid rgba(99, 102, 241, 0.1);
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

.more-count { color: var(--text-muted); font-size: 9px; font-weight: 800; }
.id-number { 
  font-weight: 800; 
  color: var(--text-main); 
  margin-bottom: 2px; 
  font-size: 13.5px;
}

.name-row { display: flex; align-items: center; gap: 8px; }
.contact-alert { color: var(--danger); animation: pulse 2.2s infinite; }
.id-type { font-size: 11px; font-weight: 700; color: #64748b; font-family: monospace; }

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.address-group { display: flex; flex-direction: column; gap: 4px; }
.address-info { display: flex; align-items: center; gap: 6px; color: #475569; font-size: 12.5px; font-weight: 600; }

/* Status cell & pipeline progress bar */
.estado-cell-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 130px;
}

.pipeline-progress-bar {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.progress-bg {
  width: 100%;
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
}

.estado-select {
  padding: 5px 24px 5px 12px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  outline: none;
  font-family: 'Outfit', sans-serif;
  text-align-last: center;
  width: 100%;
  max-width: 140px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 9px;
  appearance: none;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.estado-select:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
}

.estado-select.iniciado {
  background-color: #f1f5f9;
  color: #64748b;
  border-color: #cbd5e1;
}

.estado-select.resolucion-armada {
  background-color: rgba(249, 115, 22, 0.08);
  color: #c2410c;
  border-color: rgba(249, 115, 22, 0.2);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c2410c' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}

.estado-select.tribunal-faltas {
  background-color: rgba(99, 102, 241, 0.08);
  color: #4338ca;
  border-color: rgba(99, 102, 241, 0.2);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234338ca' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}

.estado-select.resolucion-formada {
  background-color: rgba(20, 184, 166, 0.08);
  color: #0f766e;
  border-color: rgba(20, 184, 166, 0.2);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f766e' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}

.estado-select.tramite-finalizado {
  background-color: rgba(16, 185, 129, 0.08);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}

/* Gestdoc Live indicator badge */
.gestdoc-badge-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--border-light);
  background: #f1f5f9;
  color: #64748b;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  user-select: none;
  position: relative;
  text-transform: uppercase;
  letter-spacing: 0.02em;
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

/* Pulsing indicators inside badge */
.green-glow-pulse {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.8);
  animation: pulse-green 1.6s infinite;
}

.amber-glow-pulse {
  width: 6px;
  height: 6px;
  background: #f59e0b;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.8);
  animation: pulse-amber 1.6s infinite;
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

@keyframes pulse-amber {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
  70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

/* Actions Column styling */
.actions { display: flex; gap: 6px; }
.action-btn { 
  background: white; 
  border: 1px solid var(--border-light); 
  color: var(--text-muted); 
  padding: 8px; 
  border-radius: 10px; 
  cursor: pointer; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover { 
  color: var(--text-main); 
  background: #f8fafc;
  transform: translateY(-1.5px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.action-btn.view:hover { color: #10b981; background: rgba(16, 185, 129, 0.06); border-color: #10b981; }
.action-btn.print:hover { color: #6366f1; background: rgba(99, 102, 241, 0.06); border-color: #6366f1; }
.action-btn.print-inspection:hover { color: #f59e0b; background: rgba(245, 158, 11, 0.06); border-color: #f59e0b; }
.action-btn.excel:hover { color: #0f766e; background: rgba(15, 118, 110, 0.06); border-color: #0f766e; }
.action-btn.docx:hover { color: #2563eb; background: rgba(37, 99, 235, 0.06); border-color: #2563eb; }
.action-btn.delete:hover { color: var(--danger); background: rgba(239, 68, 68, 0.06); border-color: var(--danger); }

/* Empty state design */
.empty-table-state {
  padding: 60px 0;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 320px;
  margin: 0 auto;
}

.empty-icon {
  color: #94a3b8;
  animation: bounce 2s infinite;
}

.empty-content h4 {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.empty-content p {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Animations */
.animate-slide-up {
  animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
