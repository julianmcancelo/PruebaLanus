<script setup lang="ts">
import { ref } from 'vue';
import { X, FileText, User, Car, Hash, Save, Edit2, Calendar, School, Mail, Phone, AlertTriangle, Printer, ClipboardCheck, FileDown, FileSignature, Gavel } from 'lucide-vue-next';

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

const getPersonName = (id: number) => {
  const p = props.people?.find(p => p.id === id);
  return p ? `${p.surname}, ${p.names}` : '---';
};

const getSchoolName = (id: number) => {
  const s = props.schools?.find(s => s.id === id);
  return s ? s.nombre : '---';
};

const toggleSchool = (id: number) => {
  if (!editedHab.value.idColegios) editedHab.value.idColegios = [];
  const idx = editedHab.value.idColegios.indexOf(id);
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
</script>

<template>
  <div v-if="hab" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content glass-card animate-fade">
      <div class="modal-header">
        <div class="hab-badge"><FileText :size="32" /></div>
        <div class="header-info">
          <h2 v-if="!isEditing">Exp: {{ hab.nroExpediente }}</h2>
          <input v-else v-model="editedHab.nroExpediente" class="input-field small" />
          <p>{{ hab.tipoTramite || 'Habilitación de Transporte' }}</p>
        </div>
        <div class="header-actions">
          <button v-if="!isEditing" class="btn-icon" @click="startEditing"><Edit2 :size="18" /></button>
          <button class="close-btn" @click="$emit('close')"><X :size="24" /></button>
        </div>
      </div>

      <div class="details-grid">
        <div class="section-title">Datos del Expediente</div>
        <div class="detail-item">
          <div class="detail-icon"><Hash :size="20" /></div>
          <div class="detail-data">
            <label>N° de Expediente (GestDoc)</label>
            <span v-if="!isEditing">{{ hab.nroExpediente }}</span>
            <input v-else v-model="editedHab.nroExpediente" class="input-field small" />
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><Calendar :size="20" /></div>
          <div class="detail-data">
            <label>N° de Licencia</label>
            <span v-if="!isEditing">{{ hab.nroLicencia || '---' }}</span>
            <input v-else v-model="editedHab.nroLicencia" class="input-field small" />
          </div>
        </div>

        <div class="section-title">Vínculos con Base de Datos</div>
        
        <!-- Linked Titular -->
        <div class="detail-item full-width">
          <div class="detail-icon"><User :size="20" /></div>
          <div class="detail-data">
            <label>Titular de la Habilitación</label>
            <div v-if="linkedPerson" class="linked-card success">
              <div class="p-info">
                <strong>{{ linkedPerson.surname }}, {{ linkedPerson.names }}</strong>
                <span>DNI: {{ linkedPerson.idNumber }}</span>
              </div>
              <div class="p-tag">VINCULADO</div>
            </div>
            <div v-else class="manual-data">
              <span v-if="!isEditing">{{ hab.titular }}</span>
              <input v-else v-model="editedHab.titular" class="input-field small" placeholder="Nombre manual" />
              <p class="hint">No se encontró coincidencia en Personas</p>
            </div>
          </div>
        </div>

        <!-- Linked Vehicle -->
        <div class="detail-item full-width">
          <div class="detail-icon"><Car :size="20" /></div>
          <div class="detail-data">
            <label>Vehículo Asociado</label>
            
            <!-- If already linked -->
            <div v-if="linkedTitle" class="linked-card success">
              <div class="p-info">
                <strong>{{ linkedTitle.dominio }}</strong>
                <span>{{ linkedTitle.marca }} {{ linkedTitle.modelo }}</span>
              </div>
              <div class="p-tag">VINCULADO</div>
            </div>

            <!-- If not linked but owner has vehicles -->
            <div v-else-if="personVehicles && personVehicles.length > 0" class="vehicle-selector">
              <p class="hint">El titular tiene {{ personVehicles.length }} vehículos. Selecciona uno:</p>
              <div class="vehicle-chips">
                <button 
                  v-for="v in personVehicles" 
                  :key="v.id" 
                  class="vehicle-chip"
                  :class="{ occupied: isOccupied(v.dominio) }"
                  :disabled="isOccupied(v.dominio)"
                  @click="selectVehicle(v.dominio)"
                >
                  <Car :size="14" /> {{ v.dominio }}
                  <span v-if="isOccupied(v.dominio)" class="occ-badge">OCUPADO</span>
                </button>
              </div>
            </div>

            <!-- Fallback manual -->
            <div v-else class="manual-data">
              <span v-if="!isEditing">{{ hab.dominio || '---' }}</span>
              <input v-else v-model="editedHab.dominio" class="input-field small" placeholder="Dominio manual" />
              <p class="hint">No se encontró coincidencia en Títulos</p>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="section-title">Datos de Contacto</div>
        <div class="detail-item" :class="{ warning: !hab.email }">
          <div class="detail-icon"><Mail :size="20" /></div>
          <div class="detail-data">
            <label>Correo Electrónico</label>
            <span v-if="!isEditing">{{ hab.email || 'NO CARGADO' }}</span>
            <input v-else v-model="editedHab.email" class="input-field small" placeholder="ejemplo@correo.com" />
            <div v-if="!isEditing && !hab.email" class="missing-alert"><AlertTriangle :size="12" /> Dato obligatorio faltante</div>
          </div>
        </div>
        <div class="detail-item" :class="{ warning: !hab.phone }">
          <div class="detail-icon"><Phone :size="20" /></div>
          <div class="detail-data">
            <label>Teléfono de Contacto</label>
            <span v-if="!isEditing">{{ hab.phone || 'NO CARGADO' }}</span>
            <input v-else v-model="editedHab.phone" class="input-field small" placeholder="Número de contacto" />
            <div v-if="!isEditing && !hab.phone" class="missing-alert"><AlertTriangle :size="12" /> Dato obligatorio faltante</div>
          </div>
        </div>

        <!-- Driver & Attendant -->
        <div class="section-title">Personal a Bordo</div>
        <div class="detail-item">
          <div class="detail-icon"><User :size="20" /></div>
          <div class="detail-data">
            <label>Chofer</label>
            <span v-if="!isEditing">{{ getPersonName(hab.idChofer) }}</span>
            <select v-else v-model="editedHab.idChofer" class="input-field small">
              <option :value="undefined">--- Seleccionar ---</option>
              <option v-for="p in people" :key="p.id" :value="p.id">{{ p.surname }}, {{ p.names }}</option>
            </select>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon"><User :size="20" /></div>
          <div class="detail-data">
            <label>Celador/a</label>
            <span v-if="!isEditing">{{ getPersonName(hab.idCelador) }}</span>
            <select v-else v-model="editedHab.idCelador" class="input-field small">
              <option :value="undefined">--- Seleccionar ---</option>
              <option v-for="p in people" :key="p.id" :value="p.id">{{ p.surname }}, {{ p.names }}</option>
            </select>
          </div>
        </div>

        <div class="section-title">Relación con Colegios</div>
        <div class="detail-item full-width">
          <div class="detail-icon"><School :size="20" /></div>
          <div class="detail-data">
            <label>Colegios Vinculados</label>
            <div v-if="!isEditing" class="linked-grid">
              <div v-for="id in (hab.idColegios || [])" :key="id" class="linked-card small">
                <School :size="14" /> <span>{{ getSchoolName(id) }}</span>
              </div>
              <span v-if="!(hab.idColegios?.length)" class="hint">Sin colegios vinculados</span>
            </div>
            <div v-else class="school-selector-grid">
              <button 
                v-for="s in schools" 
                :key="s.id" 
                class="school-chip"
                :class="{ active: editedHab.idColegios?.includes(s.id) }"
                @click="toggleSchool(s.id)"
              >
                {{ s.nombre }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" style="margin-right: 8px;" @click="$emit('print', hab)">
          <Printer :size="18" /> Certificado
        </button>
        <button class="btn btn-secondary" style="margin-right: 8px;" @click="$emit('print-inspection', hab)">
          <ClipboardCheck :size="18" /> Acta PDF
        </button>
        <button class="btn btn-secondary" style="margin-right: 8px;" @click="$emit('print-inspection-excel', hab)">
          <FileDown :size="18" /> Acta Excel
        </button>
        <button class="btn btn-secondary" style="margin-right: 8px;" title="Generar Resolución DOCX" @click="$emit('generate-resolution', hab)">
          <FileSignature :size="18" /> Res. DOCX
        </button>
        <button class="btn btn-secondary" style="margin-right: auto;" title="Generar Elevación a Tribunal" @click="$emit('generate-elevacion', hab)">
          <Gavel :size="18" /> Elevación
        </button>
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

.hab-badge { 
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
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
.detail-data { flex: 1; }
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

.linked-card { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  background: white; 
  border: 1px solid #dcfce7; 
  padding: 16px; 
  border-radius: 14px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  background: linear-gradient(to right, white, #f0fdf4);
}

.linked-card.success {
  border-color: #bbf7d0;
}

.p-info { display: flex; flex-direction: column; }
.p-info strong { font-size: 16px; color: var(--text-main); font-weight: 800; }
.p-info span { font-size: 13px; color: var(--text-muted); font-weight: 600; }
.p-tag { 
  font-size: 10px; 
  font-weight: 800; 
  background: var(--accent); 
  color: white; 
  padding: 6px 12px; 
  border-radius: 8px; 
  letter-spacing: 0.05em;
}

.hint { font-size: 12px; color: var(--text-muted); font-style: italic; margin-top: 4px; font-weight: 500; }

.vehicle-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.vehicle-chip { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding: 8px 16px; 
  background: white; 
  border: 1px solid var(--border-light); 
  border-radius: 12px; 
  color: var(--text-main); 
  cursor: pointer; 
  transition: all 0.2s; 
  font-size: 14px; 
  font-weight: 700; 
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.vehicle-chip:hover:not(:disabled) { 
  background: #f8fafc; 
  border-color: var(--primary); 
  color: var(--primary);
  transform: translateY(-1px);
}
.vehicle-chip.occupied { opacity: 0.5; cursor: not-allowed; border-style: dashed; background: #f1f5f9; }
.occ-badge { font-size: 9px; background: var(--danger); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 4px; }

.school-selector-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.school-chip { 
  padding: 8px 16px; 
  background: white; 
  border: 1px solid var(--border-light); 
  border-radius: 10px; 
  color: var(--text-muted); 
  cursor: pointer; 
  transition: all 0.2s; 
  font-size: 13px; 
  font-weight: 600;
}
.school-chip.active { 
  background: var(--primary); 
  color: white; 
  border-color: var(--primary); 
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}
.linked-card.small { padding: 6px 12px; font-size: 13px; }

.detail-item.warning { 
  background: #fff1f2; 
  border-radius: 12px; 
  border: 1px solid #fecdd3; 
  padding: 12px; 
}
.detail-item.warning .detail-icon { background: white; color: var(--danger); }
.missing-alert { font-size: 10px; color: var(--danger); font-weight: 800; margin-top: 6px; display: flex; align-items: center; gap: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

.modal-footer { 
  display: flex; 
  justify-content: flex-end; 
  margin-top: 32px; 
  padding-top: 24px;
  border-top: 1px solid var(--border-light);
  background: white;
  z-index: 5;
}

.input-field.small { 
  padding: 8px 12px; 
  font-size: 15px; 
  width: 100%; 
  background: #f8fafc; 
  border: 1px solid var(--border-light); 
  color: var(--text-main); 
  border-radius: 10px; 
  font-weight: 600;
  outline: none;
}
.input-field.small:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}
</style>
