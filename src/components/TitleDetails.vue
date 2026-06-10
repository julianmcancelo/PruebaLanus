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

<style>
@import '../wp-modal.css';
</style>
