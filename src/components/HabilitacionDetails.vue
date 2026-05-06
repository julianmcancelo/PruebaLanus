<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, FileText, User, Car, Hash, Save, Edit2, Calendar, School, Mail, Phone, AlertTriangle, Printer, ClipboardCheck, FileDown, FileSignature, Gavel, MapPin, Clock, CheckCircle2, AlertCircle, Shield, Users } from 'lucide-vue-next';

const props = defineProps<{
  hab: any | null,
  linkedPerson?: any,
  linkedTitle?: any,
  personVehicles?: any[],
  occupiedDominios?: string[],
  people?: any[],
  schools?: any[]
}>();

const emit = defineEmits(['close', 'update', 'print', 'print-inspection', 'print-inspection-excel', 'generate-resolution', 'generate-elevacion']);

const isEditing = ref(false);
const editedHab = ref<any>(null);

const startEditing = () => {
  editedHab.value = { 
    ...props.hab,
    idColegios: props.hab.idColegios || []
  };
  isEditing.value = true;
};

const getPersonName = (id: any) => {
  if (!id) return '---';
  const p = props.people?.find(p => String(p.id) === String(id));
  return p ? `${p.surname}, ${p.names}` : '---';
};

const getSchoolName = (id: any) => {
  if (!id) return '---';
  const s = props.schools?.find(s => String(s.id) === String(id));
  return s ? s.nombre : '---';
};

const toggleSchool = (id: any) => {
  if (!editedHab.value.idColegios) editedHab.value.idColegios = [];
  const strId = String(id);
  const idx = editedHab.value.idColegios.findIndex((i: any) => String(i) === strId);
  if (idx > -1) editedHab.value.idColegios.splice(idx, 1);
  else editedHab.value.idColegios.push(id);
};

const selectVehicle = (dominio: string) => {
  if (isEditing.value) {
    editedHab.value.dominio = dominio;
  } else {
    const updated = { ...props.hab, dominio };
    emit('update', updated);
  }
};

const isOccupied = (dominio: string) => {
  if (!props.occupiedDominios) return false;
  return props.occupiedDominios.includes(dominio.replace(/\W/g, '').toUpperCase());
};

const handleSave = () => {
  emit('update', editedHab.value);
  isEditing.value = false;
};

const habStatus = computed(() => {
  const issues: string[] = [];
  if (!props.hab.email) issues.push('Email');
  if (!props.hab.phone) issues.push('Teléfono');
  if (!props.linkedPerson) issues.push('Titular no vinculado');
  if (!props.linkedTitle) issues.push('Vehículo no vinculado');
  
  if (issues.length === 0) return { label: 'Completa', icon: CheckCircle2, color: 'success' };
  if (issues.length <= 2) return { label: `${issues.length} pendientes`, icon: AlertCircle, color: 'warning' };
  return { label: `${issues.length} pendientes`, icon: AlertTriangle, color: 'danger' };
});

const linkedSchools = computed(() => {
  if (!props.hab?.idColegios) return [];
  return props.hab.idColegios.map((id: any) => props.schools?.find(s => String(s.id) === String(id))).filter(Boolean);
});
</script>

<template>
  <div v-if="hab" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content animate-fade">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-top">
          <div class="header-main">
            <div class="exp-icon">
              <FileText :size="28" />
            </div>
            <div class="exp-info">
              <h2 v-if="!isEditing">{{ hab.nroExpediente || 'Sin Expediente' }}</h2>
              <input v-else v-model="editedHab.nroExpediente" class="input-field" placeholder="N° Expediente" />
              <span class="exp-type">{{ hab.tipoTramite || 'Habilitación de Transporte' }}</span>
            </div>
          </div>
          <div class="header-actions">
            <div class="status-badge" :class="habStatus.color">
              <component :is="habStatus.icon" :size="14" />
              <span>{{ habStatus.label }}</span>
            </div>
            <button v-if="!isEditing" class="btn-icon" @click="startEditing" title="Editar">
              <Edit2 :size="16" />
            </button>
            <button class="btn-icon close" @click="$emit('close')" title="Cerrar">
              <X :size="18" />
            </button>
          </div>
        </div>
        
        <!-- Quick Info Bar -->
        <div class="quick-info">
          <div class="info-chip">
            <Calendar :size="14" />
            <span>Licencia: <strong>{{ hab.nroLicencia || '---' }}</strong></span>
          </div>
          <div v-if="hab.dominio" class="info-chip dominio">
            <Car :size="14" />
            <span><strong>{{ hab.dominio }}</strong></span>
          </div>
          <div v-if="linkedSchools.length > 0" class="info-chip schools">
            <School :size="14" />
            <span>{{ linkedSchools.length }} colegio{{ linkedSchools.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-body">
        <!-- Section: Titular -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon purple">
              <User :size="18" />
            </div>
            <h3>Titular</h3>
          </div>
          
          <div v-if="linkedPerson" class="linked-card success">
            <div class="linked-avatar">
              {{ linkedPerson.surname?.charAt(0) || 'U' }}{{ linkedPerson.names?.charAt(0) || '' }}
            </div>
            <div class="linked-content">
              <div class="linked-name">{{ linkedPerson.surname }}, {{ linkedPerson.names }}</div>
              <div class="linked-meta">
                <span class="meta-item"><Hash :size="12" /> DNI: {{ linkedPerson.idNumber }}</span>
                <span v-if="linkedPerson.birthDate" class="meta-item"><Calendar :size="12" /> {{ linkedPerson.birthDate }}</span>
              </div>
              <div v-if="linkedPerson.address" class="linked-address">
                <MapPin :size="12" /> {{ linkedPerson.address }}{{ linkedPerson.city ? `, ${linkedPerson.city}` : '' }}
              </div>
            </div>
            <div class="linked-badge success">
              <CheckCircle2 :size="14" />
              Vinculado
            </div>
          </div>
          
          <div v-else class="unlinked-card">
            <AlertCircle :size="20" />
            <div class="unlinked-info">
              <span v-if="!isEditing">{{ hab.titular || 'Sin datos del titular' }}</span>
              <input v-else v-model="editedHab.titular" class="input-field" placeholder="Nombre del titular" />
              <small>No se encontró coincidencia en Personas</small>
            </div>
          </div>
        </div>

        <!-- Section: Vehículo -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon blue">
              <Car :size="18" />
            </div>
            <h3>Vehículo</h3>
          </div>
          
          <div v-if="linkedTitle" class="linked-card success">
            <div class="vehicle-plate">{{ linkedTitle.dominio }}</div>
            <div class="linked-content">
              <div class="linked-name">{{ linkedTitle.marca }} {{ linkedTitle.modelo }}</div>
              <div class="linked-meta">
                <span v-if="linkedTitle.anioModelo" class="meta-item">Año: {{ linkedTitle.anioModelo }}</span>
                <span v-if="linkedTitle.tipo" class="meta-item">{{ linkedTitle.tipo }}</span>
                <span v-if="linkedTitle.motor" class="meta-item">Motor: {{ linkedTitle.motor }}</span>
              </div>
            </div>
            <div class="linked-badge success">
              <CheckCircle2 :size="14" />
              Vinculado
            </div>
          </div>
          
          <div v-else-if="personVehicles && personVehicles.length > 0" class="vehicle-selector">
            <p class="selector-hint">El titular tiene {{ personVehicles.length }} vehículo{{ personVehicles.length > 1 ? 's' : '' }}. Seleccioná uno:</p>
            <div class="vehicle-grid">
              <button 
                v-for="v in personVehicles" 
                :key="v.id" 
                class="vehicle-option"
                :class="{ occupied: isOccupied(v.dominio) }"
                :disabled="isOccupied(v.dominio)"
                @click="selectVehicle(v.dominio)"
              >
                <div class="vehicle-plate-small">{{ v.dominio }}</div>
                <div class="vehicle-desc">{{ v.marca }} {{ v.modelo }}</div>
                <span v-if="isOccupied(v.dominio)" class="occ-badge">Ocupado</span>
              </button>
            </div>
          </div>
          
          <div v-else class="unlinked-card">
            <AlertCircle :size="20" />
            <div class="unlinked-info">
              <span v-if="!isEditing">{{ hab.dominio || 'Sin vehículo asociado' }}</span>
              <input v-else v-model="editedHab.dominio" class="input-field" placeholder="Dominio (patente)" />
              <small>No se encontró coincidencia en Títulos</small>
            </div>
          </div>
        </div>

        <!-- Section: Contacto -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon green">
              <Phone :size="18" />
            </div>
            <h3>Contacto</h3>
          </div>
          
          <div class="contact-grid">
            <div class="contact-item" :class="{ missing: !hab.email }">
              <div class="contact-icon">
                <Mail :size="18" />
              </div>
              <div class="contact-data">
                <label>Email</label>
                <span v-if="!isEditing">{{ hab.email || 'No cargado' }}</span>
                <input v-else v-model="editedHab.email" class="input-field" placeholder="email@ejemplo.com" />
              </div>
              <div v-if="!isEditing && !hab.email" class="missing-tag">
                <AlertTriangle :size="12" /> Faltante
              </div>
            </div>
            
            <div class="contact-item" :class="{ missing: !hab.phone }">
              <div class="contact-icon">
                <Phone :size="18" />
              </div>
              <div class="contact-data">
                <label>Teléfono</label>
                <span v-if="!isEditing">{{ hab.phone || 'No cargado' }}</span>
                <input v-else v-model="editedHab.phone" class="input-field" placeholder="11-1234-5678" />
              </div>
              <div v-if="!isEditing && !hab.phone" class="missing-tag">
                <AlertTriangle :size="12" /> Faltante
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Personal -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon orange">
              <Users :size="18" />
            </div>
            <h3>Personal a Bordo</h3>
          </div>
          
          <div class="staff-grid">
            <div class="staff-card">
              <div class="staff-label">Chofer</div>
              <div v-if="!isEditing" class="staff-value">
                {{ getPersonName(hab.idChofer) }}
              </div>
              <select v-else v-model="editedHab.idChofer" class="input-field">
                <option :value="undefined">Seleccionar...</option>
                <option v-for="p in people" :key="p.id" :value="p.id">{{ p.surname }}, {{ p.names }}</option>
              </select>
            </div>
            
            <div class="staff-card">
              <div class="staff-label">Celador/a</div>
              <div v-if="!isEditing" class="staff-value">
                {{ getPersonName(hab.idCelador) }}
              </div>
              <select v-else v-model="editedHab.idCelador" class="input-field">
                <option :value="undefined">Seleccionar...</option>
                <option v-for="p in people" :key="p.id" :value="p.id">{{ p.surname }}, {{ p.names }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section: Colegios -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon indigo">
              <School :size="18" />
            </div>
            <h3>Colegios Vinculados</h3>
          </div>
          
          <div v-if="!isEditing" class="schools-list">
            <div v-if="linkedSchools.length > 0" class="school-item" v-for="school in linkedSchools" :key="school.id">
              <div class="school-icon">
                <School :size="16" />
              </div>
              <div class="school-info">
                <span class="school-name">{{ school.nombre }}</span>
                <span v-if="school.domicilio" class="school-address">{{ school.domicilio }}</span>
              </div>
            </div>
            <div v-else class="empty-state">
              <School :size="24" />
              <span>Sin colegios vinculados</span>
            </div>
          </div>
          
          <div v-else class="school-selector-grid">
            <button 
              v-for="s in schools" 
              :key="s.id" 
              class="school-chip"
              :class="{ active: editedHab.idColegios?.includes(s.id) }"
              @click="toggleSchool(s.id)"
            >
              <School :size="14" />
              {{ s.nombre }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <div class="footer-section">
          <button class="action-btn primary" @click="$emit('print', hab)">
            <Printer :size="16" /> Certificado
          </button>
          <button class="action-btn" @click="$emit('print-inspection', hab)">
            <ClipboardCheck :size="16" /> Acta PDF
          </button>
          <button class="action-btn" @click="$emit('print-inspection-excel', hab)">
            <FileDown :size="16" /> Acta Excel
          </button>
        </div>
        <div class="footer-section">
          <button class="action-btn accent" @click="$emit('generate-resolution', hab)">
            <FileSignature :size="16" /> Resolución
          </button>
          <button class="action-btn danger" @click="$emit('generate-elevacion', hab)">
            <Gavel :size="16" /> Elevación
          </button>
        </div>
        <div class="footer-section">
          <button v-if="isEditing" class="action-btn save" @click="handleSave">
            <Save :size="16" /> Guardar
          </button>
          <button v-else class="action-btn close-btn" @click="$emit('close')">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { 
  position: fixed; 
  inset: 0; 
  background: rgba(15, 23, 42, 0.5); 
  backdrop-filter: blur(8px); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 100; 
  padding: 20px; 
}

.modal-content { 
  width: 100%; 
  max-width: 780px; 
  display: flex; 
  flex-direction: column; 
  max-height: 94vh; 
  background: white;
  border-radius: 24px;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1);
  overflow: hidden;
}

/* Header */
.modal-header {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  padding: 28px 32px 20px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.exp-icon {
  background: rgba(255,255,255,0.2);
  padding: 12px;
  border-radius: 14px;
  backdrop-filter: blur(4px);
}

.exp-info h2 {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.exp-type {
  font-size: 12px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
}

.status-badge.success {
  background: rgba(34, 197, 94, 0.3);
}

.status-badge.warning {
  background: rgba(251, 191, 36, 0.3);
}

.status-badge.danger {
  background: rgba(239, 68, 68, 0.3);
}

.btn-icon {
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: rgba(255,255,255,0.25);
}

.btn-icon.close:hover {
  background: rgba(239, 68, 68, 0.4);
}

.quick-info {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.info-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  font-size: 13px;
  backdrop-filter: blur(4px);
}

.info-chip strong {
  font-weight: 700;
}

.info-chip.dominio {
  background: rgba(255,255,255,0.25);
  font-weight: 700;
}

.info-chip.schools {
  background: rgba(34, 197, 94, 0.25);
}

/* Body */
.modal-body {
  padding: 24px 32px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-section {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-icon {
  padding: 8px;
  border-radius: 10px;
  display: flex;
}

.section-icon.purple { background: #ede9fe; color: #7c3aed; }
.section-icon.blue { background: #dbeafe; color: #2563eb; }
.section-icon.green { background: #dcfce7; color: #16a34a; }
.section-icon.orange { background: #ffedd5; color: #ea580c; }
.section-icon.indigo { background: #e0e7ff; color: #4f46e5; }

.section-header h3 {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin: 0;
}

/* Linked Cards */
.linked-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border: 1px solid #bbf7d0;
  padding: 16px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.linked-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  flex-shrink: 0;
}

.linked-content {
  flex: 1;
  min-width: 0;
}

.linked-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.linked-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.linked-address {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  margin-top: 6px;
}

.linked-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.linked-badge.success {
  background: #dcfce7;
  color: #16a34a;
}

.vehicle-plate {
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.05em;
  font-family: monospace;
  flex-shrink: 0;
}

/* Unlinked */
.unlinked-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: white;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  color: #64748b;
}

.unlinked-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.unlinked-info span {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.unlinked-info small {
  font-size: 12px;
  color: #94a3b8;
}

/* Vehicle Selector */
.vehicle-selector {
  margin-top: 4px;
}

.selector-hint {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
}

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.vehicle-option {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.vehicle-option:hover:not(:disabled) {
  border-color: #4f46e5;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
  transform: translateY(-2px);
}

.vehicle-option.occupied {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f1f5f9;
}

.vehicle-plate-small {
  font-family: monospace;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.vehicle-desc {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.occ-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 9px;
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
}

/* Contact */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  position: relative;
}

.contact-item.missing {
  border-color: #fecdd3;
  background: #fff1f2;
}

.contact-icon {
  padding: 8px;
  background: #f1f5f9;
  border-radius: 10px;
  color: #4f46e5;
}

.contact-item.missing .contact-icon {
  background: #fee2e2;
  color: #ef4444;
}

.contact-data {
  flex: 1;
  min-width: 0;
}

.contact-data label {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.contact-data span {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.missing-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #ef4444;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 8px;
  background: #fee2e2;
  border-radius: 6px;
}

/* Staff */
.staff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.staff-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.staff-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.staff-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

/* Schools */
.schools-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.school-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.school-icon {
  padding: 8px;
  background: #e0e7ff;
  border-radius: 10px;
  color: #4f46e5;
}

.school-info {
  display: flex;
  flex-direction: column;
}

.school-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.school-address {
  font-size: 12px;
  color: #64748b;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: #94a3b8;
  font-size: 14px;
}

.school-selector-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.school-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 600;
}

.school-chip.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-section {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.action-btn.primary {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.action-btn.primary:hover {
  background: #4338ca;
}

.action-btn.accent {
  background: #0ea5e9;
  color: white;
  border-color: #0ea5e9;
}

.action-btn.accent:hover {
  background: #0284c7;
}

.action-btn.danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.action-btn.danger:hover {
  background: #dc2626;
}

.action-btn.save {
  background: #16a34a;
  color: white;
  border-color: #16a34a;
}

.action-btn.save:hover {
  background: #15803d;
}

.action-btn.close-btn {
  background: #1e293b;
  color: white;
  border-color: #1e293b;
}

.action-btn.close-btn:hover {
  background: #334155;
}

/* Input */
.input-field {
  width: 100%;
  padding: 10px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: all 0.2s;
}

.input-field:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

select.input-field {
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    border-radius: 20px 20px 0 0;
    max-height: 96vh;
  }
  
  .contact-grid,
  .staff-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .footer-section {
    justify-content: center;
  }
}
</style>
