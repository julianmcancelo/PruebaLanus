<script setup lang="ts">
import { ref } from 'vue';
import { X, Car, Hash, FileText, User, MapPin, Calendar, Edit2, Save, CheckCircle2 } from 'lucide-vue-next';

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
    <div class="modal-content animate-fade">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-top">
          <div class="header-main">
            <div class="car-icon">
              <Car :size="28" />
            </div>
            <div class="car-info">
              <h2 v-if="!isEditing">{{ title.dominio }}</h2>
              <input v-else v-model="editedTitle.dominio" class="input-field plate-input" placeholder="Dominio" />
              <span class="car-type">{{ title.marca }} {{ title.modelo }}</span>
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
        
        <!-- Quick Info -->
        <div class="quick-info">
          <div v-if="title.tramite" class="info-chip">
            <Hash :size="14" />
            <span>Trámite: <strong>{{ title.tramite }}</strong></span>
          </div>
          <div v-if="title.controlWeb" class="info-chip">
            <FileText :size="14" />
            <span>Control: <strong>{{ title.controlWeb }}</strong></span>
          </div>
          <div v-if="linkedPerson" class="info-chip owner">
            <User :size="14" />
            <span>{{ linkedPerson.surname }}, {{ linkedPerson.names }}</span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-body">
        <!-- Section: Trámite -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon indigo">
              <FileText :size="18" />
            </div>
            <h3>Datos del Trámite</h3>
          </div>
          
          <div class="detail-grid">
            <div class="detail-item">
              <label>N° de Trámite</label>
              <span v-if="!isEditing">{{ title.tramite || '---' }}</span>
              <input v-else v-model="editedTitle.tramite" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Control Web</label>
              <span v-if="!isEditing">{{ title.controlWeb || '---' }}</span>
              <input v-else v-model="editedTitle.controlWeb" class="input-field" />
            </div>
            
            <div class="detail-item full-width">
              <label>Registro Seccional</label>
              <span v-if="!isEditing">{{ title.registroSeccional || '---' }}</span>
              <input v-else v-model="editedTitle.registroSeccional" class="input-field" />
            </div>
          </div>
        </div>

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
              </div>
            </div>
            <div class="linked-badge success">
              <CheckCircle2 :size="14" />
              Vinculado
            </div>
          </div>
          
          <div class="detail-grid" style="margin-top: 12px;">
            <div class="detail-item full-width">
              <label>Nombre del Titular</label>
              <span v-if="!isEditing">{{ title.titular || '---' }}</span>
              <input v-else v-model="editedTitle.titular" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>CUIL / CUIT</label>
              <span v-if="!isEditing">{{ title.cuilTitular || '---' }}</span>
              <input v-else v-model="editedTitle.cuilTitular" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Provincia</label>
              <span v-if="!isEditing">{{ title.provincia || '---' }}</span>
              <input v-else v-model="editedTitle.provincia" class="input-field" />
            </div>
          </div>
        </div>

        <!-- Section: Vehículo -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon blue">
              <Car :size="18" />
            </div>
            <h3>Datos del Vehículo</h3>
          </div>
          
          <div class="detail-grid">
            <div class="detail-item">
              <label>Marca</label>
              <span v-if="!isEditing">{{ title.marca || '---' }}</span>
              <input v-else v-model="editedTitle.marca" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Modelo</label>
              <span v-if="!isEditing">{{ title.modelo || '---' }}</span>
              <input v-else v-model="editedTitle.modelo" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Año Fabricación</label>
              <span v-if="!isEditing">{{ title.anioFabricacion || '---' }}</span>
              <input v-else v-model="editedTitle.anioFabricacion" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Año Modelo</label>
              <span v-if="!isEditing">{{ title.anioModelo || '---' }}</span>
              <input v-else v-model="editedTitle.anioModelo" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Fecha Inscripción</label>
              <span v-if="!isEditing">{{ title.fechaInscripcion || '---' }}</span>
              <input v-else v-model="editedTitle.fechaInscripcion" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Tipo</label>
              <span v-if="!isEditing">{{ title.tipo || '---' }}</span>
              <input v-else v-model="editedTitle.tipo" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Motor</label>
              <span v-if="!isEditing" class="mono">{{ title.motor || '---' }}</span>
              <input v-else v-model="editedTitle.motor" class="input-field" />
            </div>
            
            <div class="detail-item">
              <label>Chasis</label>
              <span v-if="!isEditing" class="mono">{{ title.chasis || '---' }}</span>
              <input v-else v-model="editedTitle.chasis" class="input-field" />
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
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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

.car-icon {
  background: rgba(255,255,255,0.2);
  padding: 12px;
  border-radius: 14px;
  backdrop-filter: blur(4px);
}

.car-info h2 {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.05em;
  font-family: monospace;
  margin: 0;
}

.car-type {
  font-size: 12px;
  opacity: 0.8;
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

.btn-icon:hover { background: rgba(255,255,255,0.25); }
.btn-icon.close:hover { background: rgba(239, 68, 68, 0.4); }

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
.info-chip.owner { background: rgba(34, 197, 94, 0.25); }

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

.section-icon.indigo { background: #e0e7ff; color: #4f46e5; }
.section-icon.purple { background: #ede9fe; color: #7c3aed; }
.section-icon.blue { background: #dbeafe; color: #2563eb; }

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

.detail-item .mono {
  font-family: monospace;
  font-weight: 700;
}

/* Linked Card */
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

.linked-content { flex: 1; min-width: 0; }
.linked-name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
.linked-meta { display: flex; gap: 12px; flex-wrap: wrap; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #64748b; font-weight: 500; }

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
  flex-shrink: 0;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px 32px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.footer-section { display: flex; gap: 8px; }

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

.action-btn:hover { border-color: #cbd5e1; background: #f1f5f9; }
.action-btn.save { background: #16a34a; color: white; border-color: #16a34a; }
.action-btn.save:hover { background: #15803d; }
.action-btn.close-btn { background: #1e293b; color: white; border-color: #1e293b; }
.action-btn.close-btn:hover { background: #334155; }

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
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.plate-input {
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    border-radius: 20px 20px 0 0;
    max-height: 96vh;
  }
  
  .detail-grid { grid-template-columns: 1fr; }
  .detail-item.full-width { grid-column: span 1; }
}
</style>
