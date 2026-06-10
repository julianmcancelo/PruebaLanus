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

<style>
@import '../wp-modal.css';
</style>
