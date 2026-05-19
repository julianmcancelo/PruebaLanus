<script setup lang="ts">
import { ref } from 'vue';
import { X, User, CreditCard, Calendar, MapPin, Hash, Globe, Map, Edit2, Save, Car, CheckCircle2, Building2, Users } from 'lucide-vue-next';

const props = defineProps<{
  person: any | null,
  linkedTitles?: any[]
}>();

const emit = defineEmits(['close', 'update']);

const isEditing = ref(false);
const editedPerson = ref<any>(null);

const startEditing = () => {
  editedPerson.value = { ...props.person };
  isEditing.value = true;
};

const handleSave = () => {
  emit('update', editedPerson.value);
  isEditing.value = false;
};
</script>

<template>
  <div v-if="person" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content animate-fade">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-top">
          <div class="header-main">
            <div v-if="!person.photo" class="avatar-icon">
              <User :size="28" />
            </div>
            <img v-else :src="`data:image/jpeg;base64,${person.photo}`" class="person-photo" alt="Foto" />
            <div class="person-info">
              <h2 v-if="!isEditing">
                <span v-if="person.tipoPersona === 'juridica'">[{{ person.tipoSocietario || 'S.A./S.R.L.' }}] {{ person.surname }}</span>
                <span v-else>{{ person.surname }}, {{ person.names }}</span>
              </h2>
              <div v-else class="edit-name-group" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                <div style="display: flex; gap: 8px; margin-bottom: 4px;">
                  <button 
                    type="button"
                    :style="{ 
                      flex: '1', 
                      padding: '8px', 
                      borderRadius: '10px', 
                      border: '1px solid',
                      borderColor: editedPerson.tipoPersona !== 'juridica' ? '#7c3aed' : '#cbd5e1',
                      background: editedPerson.tipoPersona !== 'juridica' ? '#f5f3ff' : 'white',
                      color: editedPerson.tipoPersona !== 'juridica' ? '#7c3aed' : '#64748b',
                      fontSize: '11px', 
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }"
                    @click="editedPerson.tipoPersona = 'fisica'"
                  >Persona Humana</button>
                  <button 
                    type="button"
                    :style="{ 
                      flex: '1', 
                      padding: '8px', 
                      borderRadius: '10px', 
                      border: '1px solid',
                      borderColor: editedPerson.tipoPersona === 'juridica' ? '#7c3aed' : '#cbd5e1',
                      background: editedPerson.tipoPersona === 'juridica' ? '#f5f3ff' : 'white',
                      color: editedPerson.tipoPersona === 'juridica' ? '#7c3aed' : '#64748b',
                      fontSize: '11px', 
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }"
                    @click="editedPerson.tipoPersona = 'juridica'"
                  >Jurídica (S.A. / S.R.L.)</button>
                </div>
                
                <div v-if="editedPerson.tipoPersona === 'juridica'" style="display: flex; gap: 8px; width: 100%;">
                  <select v-model="editedPerson.tipoSocietario" class="input-field" style="width: 130px; font-weight: 700;">
                    <option value="S.A.">S.A.</option>
                    <option value="S.R.L.">S.R.L.</option>
                    <option value="S.H.">Soc. de Hecho</option>
                    <option value="Cooperativa">Cooperativa</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <input v-model="editedPerson.surname" class="input-field" style="flex: 1;" placeholder="Razón Social..." />
                </div>
                
                <div v-else style="display: flex; gap: 8px; width: 100%;">
                  <input v-model="editedPerson.surname" class="input-field" placeholder="Apellido" />
                  <input v-model="editedPerson.names" class="input-field" placeholder="Nombres" />
                </div>
              </div>
              <span class="person-type">Ficha de {{ person.tipoPersona === 'juridica' ? 'Persona Jurídica' : 'Persona Humana' }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button v-if="!isEditing" class="btn-icon" @click="startEditing" title="Editar">
              <Edit2 :size="16" />
            </button>
            <button class="btn-icon close" @click="$emit('close')" title="Cerrar">
              <X :size="18" />
            </button>
          </div>
        </div>
        
        <div class="quick-info">
          <div class="info-chip">
            <CreditCard :size="14" />
            <span><strong>{{ person.tipoPersona === 'juridica' ? 'CUIT: ' : 'DNI: ' }}{{ person.idNumber }}</strong></span>
          </div>
          <div v-if="person.tipoPersona === 'juridica' && person.nroIgj" class="info-chip" style="background: rgba(124, 58, 237, 0.15); color: #7c3aed;">
            <Building2 :size="14" />
            <span>IGJ: <strong>{{ person.nroIgj }}</strong></span>
          </div>
          <div v-if="person.processNumber && person.tipoPersona !== 'juridica'" class="info-chip">
            <Hash :size="14" />
            <span>Trámite: <strong>{{ person.processNumber }}</strong></span>
          </div>
          <div v-if="linkedTitles?.length" class="info-chip vehicles">
            <Car :size="14" />
            <span>{{ linkedTitles.length }} vehículo{{ linkedTitles.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-body">
        <!-- Section: Datos Personales (Física) -->
        <div v-if="person.tipoPersona !== 'juridica'" class="data-section">
          <div class="section-header">
            <div class="section-icon purple">
              <User :size="18" />
            </div>
            <h3>Datos Personales</h3>
          </div>
          
          <div class="detail-grid">
            <div class="detail-item">
              <label>Fecha de Nacimiento</label>
              <span v-if="!isEditing">{{ person.birthDate || '---' }}</span>
              <input v-else v-model="editedPerson.birthDate" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Género</label>
              <span v-if="!isEditing">{{ person.gender || '---' }}</span>
              <input v-else v-model="editedPerson.gender" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Nacionalidad</label>
              <span v-if="!isEditing">{{ person.nationality || '---' }}</span>
              <input v-else v-model="editedPerson.nationality" class="input-field" />
            </div>
          </div>
        </div>

        <!-- Section: Inscripción IGJ & Estatuto (Jurídica) -->
        <div v-else class="data-section" style="border-left: 4px solid #7c3aed;">
          <div class="section-header">
            <div class="section-icon purple">
              <Building2 :size="18" />
            </div>
            <h3>Inscripción IGJ & Estatuto</h3>
          </div>
          
          <div class="detail-grid">
            <div class="detail-item">
              <label>N° Registro / Correlativo IGJ</label>
              <span v-if="!isEditing">{{ person.nroIgj || '---' }}</span>
              <input v-else v-model="editedPerson.nroIgj" class="input-field" placeholder="Ej: 1984224" />
            </div>
            
            <div class="detail-item">
              <label>Fecha de Inscripción IGJ</label>
              <span v-if="!isEditing">{{ person.fechaInscripcionIgj || '---' }}</span>
              <input v-else v-model="editedPerson.fechaInscripcionIgj" class="input-field" placeholder="DD/MM/YYYY" />
            </div>
            
            <div class="detail-item full-width">
              <label>Fecha de Estatuto / Contrato Social / Reformas</label>
              <span v-if="!isEditing">{{ person.fechaEstatuto || '---' }}</span>
              <input v-else v-model="editedPerson.fechaEstatuto" class="input-field" placeholder="Fecha del instrumento original..." />
            </div>
          </div>
        </div>

        <!-- Section: Representación Legal / Autoridades (Jurídica) -->
        <div v-if="person.tipoPersona === 'juridica'" class="data-section" style="border-left: 4px solid #16a34a;">
          <div class="section-header">
            <div class="section-icon green">
              <Users :size="18" />
            </div>
            <h3>Representación Legal / Autoridades</h3>
          </div>
          
          <div class="detail-grid">
            <div class="detail-item">
              <label>Representante Legal / Apoderado</label>
              <span v-if="!isEditing">{{ person.repNombre || '---' }}</span>
              <input v-else v-model="editedPerson.repNombre" class="input-field" placeholder="Nombre completo..." />
            </div>
            
            <div class="detail-item">
              <label>DNI del Representante</label>
              <span v-if="!isEditing">{{ person.repDni || '---' }}</span>
              <input v-else v-model="editedPerson.repDni" class="input-field" placeholder="Documento..." />
            </div>
            
            <div class="detail-item full-width">
              <label>Cargo / Rol</label>
              <span v-if="!isEditing">{{ person.repCargo || '---' }}</span>
              <select v-else v-model="editedPerson.repCargo" class="input-field">
                <option value="Presidente">Presidente</option>
                <option value="Socio Gerente">Socio Gerente</option>
                <option value="Apoderado">Apoderado / Mandatario</option>
                <option value="Director">Director</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section: Dirección -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon blue">
              <MapPin :size="18" />
            </div>
            <h3>Dirección</h3>
          </div>
          
          <div class="detail-grid">
            <div class="detail-item full-width">
              <label>Domicilio</label>
              <span v-if="!isEditing">{{ person.address || '---' }}</span>
              <input v-else v-model="editedPerson.address" class="input-field" placeholder="Calle y número" />
            </div>
            
            <div class="detail-item">
              <label>Localidad</label>
              <span v-if="!isEditing">{{ person.city || '---' }}</span>
              <input v-else v-model="editedPerson.city" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Provincia</label>
              <span v-if="!isEditing">{{ person.province || '---' }}</span>
              <input v-else v-model="editedPerson.province" class="input-field" />
            </div>
          </div>
        </div>

        <!-- Section: Vehículos -->
        <div v-if="linkedTitles && linkedTitles.length > 0" class="data-section">
          <div class="section-header">
            <div class="section-icon green">
              <Car :size="18" />
            </div>
            <h3>Vehículos Vinculados</h3>
          </div>
          
          <div class="vehicles-list">
            <div v-for="title in linkedTitles" :key="title.id" class="vehicle-item">
              <div class="vehicle-plate">{{ title.dominio }}</div>
              <div class="vehicle-info">
                <span class="vehicle-name">{{ title.marca }} {{ title.modelo }}</span>
                <span v-if="title.tipo" class="vehicle-type">{{ title.tipo }}</span>
              </div>
              <div class="linked-badge">
                <CheckCircle2 :size="14" />
                Vinculado
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
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
  max-width: 720px; 
  display: flex; 
  flex-direction: column; 
  max-height: 94vh; 
  background: white;
  border-radius: 24px;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Header */
.modal-header {
  background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
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

.avatar-icon {
  background: rgba(255,255,255,0.2);
  padding: 12px;
  border-radius: 14px;
  backdrop-filter: blur(4px);
}

.person-photo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
  border: 3px solid rgba(255,255,255,0.3);
}

.person-info h2 {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.person-type {
  font-size: 12px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
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

.info-chip strong { font-weight: 700; }
.info-chip.vehicles { background: rgba(34, 197, 94, 0.25); }

.edit-name-group {
  display: flex;
  gap: 8px;
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

.section-header h3 {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-item label {
  font-size: 10px;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.detail-item span {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

/* Vehicles */
.vehicles-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vehicle-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.vehicle-plate {
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.05em;
  font-family: monospace;
}

.vehicle-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.vehicle-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.vehicle-type {
  font-size: 12px;
  color: #64748b;
}

.linked-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  background: #dcfce7;
  color: #16a34a;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px 32px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.footer-section {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
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
  background: #f1f5f9;
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
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    border-radius: 20px 20px 0 0;
    max-height: 96vh;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-item.full-width {
    grid-column: span 1;
  }
}
</style>
