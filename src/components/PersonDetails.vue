<script setup lang="ts">
import { ref } from 'vue';
import { X, User, CreditCard, Calendar, MapPin, Hash, Globe, Map, Edit2, Save, Car } from 'lucide-vue-next';
import type { PersonRecord } from '../services/dbService';

const props = defineProps<{
  person: PersonRecord | null,
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
    <div class="modal-content glass-card animate-fade">
      <div class="modal-header">
        <div class="user-badge" v-if="!person.photo">
          <User :size="32" />
        </div>
        <img v-else :src="`data:image/jpeg;base64,${person.photo}`" class="person-photo" alt="Foto" />
        <div class="header-info">
          <h2 v-if="!isEditing">{{ person.surname }}, {{ person.names }}</h2>
          <div v-else class="edit-name-group">
            <input v-model="editedPerson.surname" class="input-field small" placeholder="Apellido" />
            <input v-model="editedPerson.names" class="input-field small" placeholder="Nombres" />
          </div>
          <p>Ficha de Persona</p>
        </div>
        <div class="header-actions">
          <button v-if="!isEditing" class="btn-icon" @click="startEditing" title="Editar">
            <Edit2 :size="18" />
          </button>
          <button class="close-btn" @click="$emit('close')">
            <X :size="24" />
          </button>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-icon"><CreditCard :size="20" /></div>
          <div class="detail-data">
            <label>DNI / Documento</label>
            <span v-if="!isEditing">{{ person.idNumber }}</span>
            <input v-else v-model="editedPerson.idNumber" class="input-field small" />
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon"><Hash :size="20" /></div>
          <div class="detail-data">
            <label>N° de Trámite</label>
            <span v-if="!isEditing">{{ person.processNumber || 'No disponible' }}</span>
            <input v-else v-model="editedPerson.processNumber" class="input-field small" />
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon"><Calendar :size="20" /></div>
          <div class="detail-data">
            <label>Fecha de Nacimiento</label>
            <span v-if="!isEditing">{{ person.birthDate }}</span>
            <input v-else v-model="editedPerson.birthDate" class="input-field small" />
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon"><Globe :size="20" /></div>
          <div class="detail-data">
            <label>Nacionalidad / Sexo</label>
            <span v-if="!isEditing">{{ person.nationality }} • {{ person.gender }}</span>
            <div v-else class="edit-row">
              <input v-model="editedPerson.nationality" class="input-field small" />
              <input v-model="editedPerson.gender" class="input-field small" />
            </div>
          </div>
        </div>

        <div class="detail-item full-width">
          <div class="detail-icon"><MapPin :size="20" /></div>
          <div class="detail-data">
            <label>Domicilio</label>
            <span v-if="!isEditing">{{ person.address }}</span>
            <input v-else v-model="editedPerson.address" class="input-field small" />
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon"><Map :size="20" /></div>
          <div class="detail-data">
            <label>Localidad</label>
            <span v-if="!isEditing">{{ person.city || 'No disponible' }}</span>
            <input v-else v-model="editedPerson.city" class="input-field small" />
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon"><Hash :size="20" /></div>
          <div class="detail-data">
            <label>Provincia</label>
            <span v-if="!isEditing">{{ person.province || 'No disponible' }}</span>
            <input v-else v-model="editedPerson.province" class="input-field small" />
          </div>
        </div>

        <div v-if="linkedTitles && linkedTitles.length > 0" class="section-title linked-section">Vehículos Vinculados</div>
        <div v-if="linkedTitles && linkedTitles.length > 0" class="linked-grid">
          <div v-for="title in linkedTitles" :key="title.id" class="linked-card">
            <Car :size="16" />
            <span>{{ title.dominio }} - {{ title.marca }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="isEditing" class="btn btn-primary" @click="handleSave">
          <Save :size="18" /> Guardar Cambios
        </button>
        <button v-else class="btn" @click="$emit('close')">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 600px;
  padding: 40px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
}

.user-badge {
  background: var(--primary);
  padding: 14px;
  border-radius: 14px;
  display: flex;
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.person-photo {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-info h2 {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.header-info p {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 600;
}

.header-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: #f1f5f9;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.2s;
}

.btn-icon:hover {
  color: var(--text-main);
  background: #e2e8f0;
}

.close-btn {
  background: #f1f5f9;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: var(--text-main);
}

.section-title {
  grid-column: span 2;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--primary);
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 8px;
  margin-top: 16px;
  letter-spacing: 0.05em;
}

.linked-grid {
  grid-column: span 2;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.linked-card {
  background: #f8fafc;
  border: 1px solid var(--border-light);
  padding: 10px 14px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-main);
  font-weight: 600;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.detail-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-icon {
  background: #f1f5f9;
  padding: 10px;
  border-radius: 12px;
  color: var(--primary);
  display: flex;
}

.detail-data label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 4px;
  font-weight: 700;
}

.detail-data span {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
