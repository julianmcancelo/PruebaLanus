<script setup lang="ts">
import { ref } from 'vue';
import { X, Car, Hash, FileText, User, MapPin, Calendar, Globe, Save, Edit2 } from 'lucide-vue-next';

const props = defineProps<{
  title: any | null,
  linkedPerson?: any
}>();

const emit = defineEmits(['close', 'update']);

const isEditing = ref(false);
const editedTitle = ref<any>(null);

const startEditing = () => {
  editedTitle.value = { ...props.title };
  isEditing.value = true;
};

const handleSave = () => {
  emit('update', editedTitle.value);
  isEditing.value = false;
};
</script>

<template>
  <div v-if="title" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content glass-card animate-fade">
      <div class="modal-header">
        <div class="user-badge"><Car :size="32" /></div>
        <div class="header-info">
          <h2 v-if="!isEditing">{{ title.dominio }} - {{ title.marca }}</h2>
          <div v-else class="edit-name-group">
            <input v-model="editedTitle.dominio" class="input-field small" placeholder="Dominio" />
            <input v-model="editedTitle.marca" class="input-field small" placeholder="Marca" />
          </div>
          <p>Título del Automotor</p>
        </div>
        <div class="header-actions">
          <button v-if="!isEditing" class="btn-icon" @click="startEditing"><Edit2 :size="18" /></button>
          <button class="close-btn" @click="$emit('close')"><X :size="24" /></button>
        </div>
      </div>

      <div class="details-grid">
        <div class="section-title">Datos del Trámite</div>
        <div class="detail-item">
          <div class="detail-icon"><Hash :size="20" /></div>
          <div class="detail-data">
            <label>N° de Trámite</label>
            <span v-if="!isEditing">{{ title.tramite }}</span>
            <input v-else v-model="editedTitle.tramite" class="input-field small" />
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><FileText :size="20" /></div>
          <div class="detail-data">
            <label>N° de Control Web</label>
            <span v-if="!isEditing">{{ title.controlWeb }}</span>
            <input v-else v-model="editedTitle.controlWeb" class="input-field small" />
          </div>
        </div>
        <div class="detail-item full-width">
          <div class="detail-icon"><MapPin :size="20" /></div>
          <div class="detail-data">
            <label>Registro Seccional</label>
            <span v-if="!isEditing">{{ title.registroSeccional }}</span>
            <input v-else v-model="editedTitle.registroSeccional" class="input-field small" />
          </div>
        </div>

        <div v-if="linkedPerson" class="section-title">Propietario Registrado</div>
        <div v-if="linkedPerson" class="detail-item full-width">
          <div class="detail-icon"><User :size="20" /></div>
          <div class="detail-data">
            <label>Persona en Base de Datos</label>
            <div class="linked-person-card">
              <div class="p-info">
                <strong>{{ linkedPerson.surname }}, {{ linkedPerson.names }}</strong>
                <span>DNI: {{ linkedPerson.idNumber }}</span>
              </div>
              <div class="p-tag">VINCULADO</div>
            </div>
          </div>
        </div>

        <div class="section-title">Datos del Titular (del Título)</div>
        <div class="detail-item full-width">
          <div class="detail-icon"><User :size="20" /></div>
          <div class="detail-data">
            <label>Nombre Completo</label>
            <span v-if="!isEditing">{{ title.titular }}</span>
            <input v-else v-model="editedTitle.titular" class="input-field small" />
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><Hash :size="20" /></div>
          <div class="detail-data">
            <label>CUIL / CUIT</label>
            <span v-if="!isEditing">{{ title.cuilTitular }}</span>
            <input v-else v-model="editedTitle.cuilTitular" class="input-field small" />
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><MapPin :size="20" /></div>
          <div class="detail-data">
            <label>Provincia</label>
            <span v-if="!isEditing">{{ title.provincia }}</span>
            <input v-else v-model="editedTitle.provincia" class="input-field small" />
          </div>
        </div>

        <div class="section-title">Datos del Vehículo</div>
        <div class="detail-item">
          <div class="detail-icon"><Car :size="20" /></div>
          <div class="detail-data">
            <label>Modelo</label>
            <span v-if="!isEditing">{{ title.modelo }}</span>
            <input v-else v-model="editedTitle.modelo" class="input-field small" />
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><Calendar :size="20" /></div>
          <div class="detail-data">
            <label>Año Fabricación / Modelo</label>
            <span v-if="!isEditing">{{ title.anioFabricacion }} / {{ title.anioModelo }}</span>
            <div v-else class="edit-name-group">
              <input v-model="editedTitle.anioFabricacion" class="input-field small" placeholder="Fab" />
              <input v-model="editedTitle.anioModelo" class="input-field small" placeholder="Mod" />
            </div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><Calendar :size="20" /></div>
          <div class="detail-data">
            <label>Inscripción Inicial</label>
            <span v-if="!isEditing">{{ title.fechaInscripcion }}</span>
            <input v-else v-model="editedTitle.fechaInscripcion" class="input-field small" placeholder="DD/MM/YYYY" />
          </div>
        </div>
        <div class="detail-item full-width">
          <div class="detail-icon"><FileText :size="20" /></div>
          <div class="detail-data">
            <label>Motor / Chasis</label>
            <span v-if="!isEditing">{{ title.motor }} / {{ title.chasis }}</span>
            <div v-else class="edit-name-group">
              <input v-model="editedTitle.motor" class="input-field small" placeholder="Motor" />
              <input v-model="editedTitle.chasis" class="input-field small" placeholder="Chasis" />
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="isEditing" class="btn btn-primary" @click="handleSave"><Save :size="18" /> Guardar</button>
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
  max-width: 700px; 
  padding: 40px; 
  display: flex; 
  flex-direction: column; 
  gap: 24px; 
  max-height: 92vh; 
  overflow-y: auto; 
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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

.header-actions { position: absolute; top: 0; right: 0; display: flex; gap: 8px; }

.btn-icon, .close-btn { 
  background: #f1f5f9; 
  border: none; 
  color: var(--text-muted); 
  cursor: pointer; 
  padding: 8px; 
  border-radius: 10px;
  transition: all 0.2s;
}

.btn-icon:hover, .close-btn:hover { 
  background: #e2e8f0;
  color: var(--text-main); 
}

.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

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

.detail-item { display: flex; gap: 16px; }
.detail-item.full-width { grid-column: span 2; }
.detail-icon { 
  background: #f1f5f9; 
  padding: 10px; 
  border-radius: 12px; 
  color: var(--primary); 
  display: flex; 
  height: fit-content; 
}

.linked-person-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to right, white, #f0fdf4);
  border: 1px solid #bbf7d0;
  padding: 16px;
  border-radius: 14px;
  width: 100%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.p-info {
  display: flex;
  flex-direction: column;
}

.p-info strong {
  font-size: 16px;
  color: var(--text-main);
  font-weight: 800;
}

.p-info span {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
}

.p-tag {
  font-size: 10px;
  font-weight: 800;
  background: var(--accent);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  letter-spacing: 0.05em;
}

.detail-data label { 
  display: block; 
  font-size: 11px; 
  text-transform: uppercase; 
  color: var(--text-muted); 
  margin-bottom: 4px; 
  font-weight: 700; 
}
.detail-data span { 
  font-size: 16px; 
  font-weight: 700; 
  color: var(--text-main);
}

.modal-footer { display: flex; justify-content: flex-end; margin-top: 12px; }
.input-field.small { 
  padding: 8px 12px; 
  font-size: 15px; 
  width: 100%; 
  background: #f8fafc; 
  border: 1px solid var(--border-light); 
  color: var(--text-main); 
  border-radius: 10px; 
  font-weight: 600;
}
.edit-name-group { display: flex; gap: 8px; }
</style>
