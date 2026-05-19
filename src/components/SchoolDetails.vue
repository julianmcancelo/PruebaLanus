<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  X, School, User, Car, FileSignature, 
  ClipboardCheck, FileSpreadsheet, Eye, Printer, Hash, Sparkles, Loader2,
  MapPin, Map, Save
} from 'lucide-vue-next';

const props = defineProps<{
  school: any;
  habilitaciones: any[];
  people: any[];
  titles: any[];
}>();

const emit = defineEmits([
  'close', 
  'generate-resolution', 
  'print-inspection', 
  'print-inspection-excel',
  'view-hab',
  'enrich',
  'update-school'
]);

const editableNombre = ref(props.school.nombre || '');
const editableAddress = ref(props.school.domicilio || '');
const editableTelefono = ref(props.school.telefono || '');
const editableTipo = ref(props.school.tipo || 'Colegio');
const editableExpediente = ref(props.school.expediente || '');
const editableCuenta = ref(props.school.cuenta || '');
const isSavingAddress = ref(false);
const isEnriching = ref(false);

watch(() => props.school, (newSchool) => {
  if (newSchool) {
    editableNombre.value = newSchool.nombre || '';
    editableAddress.value = newSchool.domicilio || '';
    editableTelefono.value = newSchool.telefono || '';
    editableTipo.value = newSchool.tipo || 'Colegio';
    editableExpediente.value = newSchool.expediente || '';
    editableCuenta.value = newSchool.cuenta || '';
  }
}, { deep: true });

const mapUrl = computed(() => {
  if (!editableAddress.value) return '';
  const query = encodeURIComponent(`${editableAddress.value}, Lanús, Buenos Aires, Argentina`);
  return `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${query}`;
});

// Fallback map URL if no API key (using embed search which doesn't strictly need a key for basic use but it's better with one)
const simpleMapUrl = computed(() => {
  if (!editableAddress.value) return '';
  const query = encodeURIComponent(`${editableAddress.value}, Lanús`);
  return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
});

const saveSchoolFields = async () => {
  isSavingAddress.value = true;
  await emit('update-school', { 
    ...props.school, 
    nombre: editableNombre.value,
    domicilio: editableAddress.value,
    telefono: editableTelefono.value,
    tipo: editableTipo.value,
    expediente: editableExpediente.value,
    cuenta: editableCuenta.value
  });
  isSavingAddress.value = false;
};

const handleEnrich = async () => {
  isEnriching.value = true;
  await emit('enrich');
  // Update local ref after enrichment
  editableAddress.value = props.school.domicilio;
  isEnriching.value = false;
};

const getHabilitacionesForSchool = () => {
  if (!props.school?.id) return [];
  const strId = String(props.school.id);
  return props.habilitaciones.filter(h => 
    h.idColegios?.some((id: any) => String(id) === strId)
  );
};

const getPersonForHab = (hab: any) => {
  return props.people.find(p => String(p.id) === String(hab.idPersona));
};

const getTitleForHab = (hab: any) => {
  if (!hab.dominio) return null;
  const cleanDom = hab.dominio.replace(/\W/g, '').toUpperCase();
  return props.titles.find(t => {
    if (!t.dominio) return false;
    return t.dominio.replace(/\W/g, '').toUpperCase() === cleanDom;
  });
};
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content glass-card animate-slide-up">
      <div class="modal-header">
        <div class="school-title" style="width: 100%;">
          <div class="school-icon"><School :size="24" /></div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
            <div class="title-with-action" style="display: flex; align-items: center; gap: 16px; width: 100%; flex-wrap: wrap;">
              <input 
                v-model="editableNombre" 
                type="text" 
                style="font-size: 1.6rem; font-weight: 800; color: #0f172a; border: none; background: none; border-bottom: 2px dashed #cbd5e1; outline: none; flex: 1; min-width: 300px; padding: 4px 0;" 
                placeholder="Nombre del Colegio o Remisería..."
                @blur="saveSchoolFields"
              />
              
              <select 
                v-model="editableTipo" 
                style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 8px 16px; font-size: 13px; font-weight: 700; color: #475569; outline: none; cursor: pointer; transition: all 0.2s;"
                @change="saveSchoolFields"
              >
                <option value="Colegio">Colegio</option>
                <option value="Remiseria">Remisería / Agencia</option>
              </select>

              <button 
                class="enrich-btn" 
                @click="handleEnrich" 
                :disabled="isEnriching"
                title="Completar datos con IA (Lanús)"
              >
                <Loader2 v-if="isEnriching" class="spin" :size="16" />
                <Sparkles v-else :size="16" />
                <span>{{ isEnriching ? 'Buscando...' : 'Completar con IA' }}</span>
              </button>
            </div>
            
            <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap; width: 100%;">
              <div class="address-edit-group" style="display: flex; align-items: center; gap: 10px; background: #f1f5f9; padding: 10px 18px; border-radius: 14px; flex: 1.5; min-width: 250px; border: 1px solid #cbd5e1;">
                <MapPin :size="14" class="pin-icon" />
                <input 
                  v-model="editableAddress" 
                  type="text" 
                  class="address-input" 
                  placeholder="Ingresar domicilio..."
                  @blur="saveSchoolFields"
                  style="background: none; border: none; font-size: 0.95rem; font-weight: 600; color: #334155; width: 100%; outline: none;"
                />
              </div>

              <div class="phone-edit-group" style="display: flex; align-items: center; gap: 10px; background: #f1f5f9; padding: 10px 18px; border-radius: 14px; flex: 1; min-width: 180px; border: 1px solid #cbd5e1;">
                <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Teléfono:</span>
                <input 
                  v-model="editableTelefono" 
                  type="text" 
                  placeholder="Ingresar teléfono..."
                  @blur="saveSchoolFields"
                  style="background: none; border: none; font-size: 0.95rem; font-weight: 600; color: #334155; width: 100%; outline: none;"
                />
              </div>
            </div>

            <div v-if="editableTipo === 'Remiseria'" class="remis-fields-group" style="display: flex; gap: 16px; flex-wrap: wrap;">
              <div class="input-mini-group" style="display: flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 8px 14px; border-radius: 12px; border: 1px solid #cbd5e1;">
                <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Expediente:</span>
                <input 
                  v-model="editableExpediente" 
                  type="text" 
                  style="background: none; border: none; font-size: 13px; font-weight: 700; color: #1e293b; outline: none; width: 140px;" 
                  placeholder="Ej: 4063-1234/2026"
                  @blur="saveSchoolFields"
                />
              </div>
              <div class="input-mini-group" style="display: flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 8px 14px; border-radius: 12px; border: 1px solid #cbd5e1;">
                <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Cuenta/Habilitación:</span>
                <input 
                  v-model="editableCuenta" 
                  type="text" 
                  style="background: none; border: none; font-size: 13px; font-weight: 700; color: #1e293b; outline: none; width: 80px;" 
                  placeholder="Ej: 1234"
                  @blur="saveSchoolFields"
                />
              </div>
            </div>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')" style="margin-left: 20px;"><X :size="24" /></button>
      </div>

      <div class="modal-body">
        <div class="top-layout">
          <div class="stats-column">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ getHabilitacionesForSchool().length }}</div>
                <div class="stat-label">Unidades Vinculadas</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ school.telefono ? 'Sí' : 'No' }}</div>
                <div class="stat-label">Teléfono: {{ school.telefono || '---' }}</div>
              </div>
            </div>
          </div>
          
          <div class="map-column">
            <div class="map-container glass-card">
              <iframe
                v-if="editableAddress"
                width="100%"
                height="120"
                frameborder="0"
                scrolling="no"
                marginheight="0"
                marginwidth="0"
                :src="simpleMapUrl"
              ></iframe>
              <div v-else class="no-map">
                <Map :size="32" />
                <span>Sin ubicación</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section-title">
          <h3>Unidades de Transporte (Habilitaciones)</h3>
          <div class="title-line"></div>
        </div>

        <div v-if="getHabilitacionesForSchool().length === 0" class="empty-state">
          <Car :size="48" />
          <p>No hay unidades vinculadas a este colegio actualmente.</p>
        </div>

        <div class="hab-grid">
          <div v-for="hab in getHabilitacionesForSchool()" :key="hab.id" class="hab-card-premium animate-fade">
            <div class="hab-card-header">
              <div class="hab-badge-main">
                <Car :size="18" />
                <span>{{ hab.dominio }}</span>
              </div>
              <button class="view-details-btn" @click="$emit('view-hab', hab)">
                <Eye :size="16" />
              </button>
            </div>

            <div class="hab-card-content">
              <div class="hab-main-info">
                <div class="hab-titular">
                  <User :size="14" />
                  <span>{{ hab.titular }}</span>
                </div>
                <div class="hab-expte">
                  <Hash :size="14" />
                  <span>Expte: {{ hab.nroExpediente || 'S/D' }}</span>
                </div>
              </div>

              <div class="hab-actions-row">
                <button class="btn-action-primary" @click="$emit('generate-resolution', hab)">
                  <FileSignature :size="16" />
                  <span>Resolución</span>
                </button>
                
                <div class="action-dropdown-container">
                  <button class="btn-action-secondary">
                    <Printer :size="16" />
                    <span>Planilla</span>
                  </button>
                  <div class="action-dropdown-menu">
                    <button @click="$emit('print-inspection', hab)">
                      <ClipboardCheck :size="14" /> PDF Simple
                    </button>
                    <button @click="$emit('print-inspection-excel', hab)">
                      <FileSpreadsheet :size="14" /> Excel Oficial
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 950px;
  max-height: 90vh;
  background: #f8fafc;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.modal-header {
  padding: 40px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.school-title {
  display: flex;
  align-items: center;
  gap: 24px;
}

.school-icon {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 16px rgba(79, 70, 229, 0.2);
}

.school-title h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin: 0;
}

.title-with-action {
  display: flex;
  align-items: center;
  gap: 16px;
}

.enrich-btn {
  background: rgba(79, 70, 229, 0.08);
  border: 1px solid rgba(79, 70, 229, 0.15);
  color: #4f46e5;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.enrich-btn:hover {
  background: #4f46e5;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);
}

.address-edit-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  background: #f1f5f9;
  padding: 10px 18px;
  border-radius: 14px;
  border: 1px solid transparent;
  transition: all 0.2s;
  width: fit-content;
  min-width: 400px;
}

.address-edit-group:focus-within {
  background: white;
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.address-input {
  background: none;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  width: 100%;
  outline: none;
}

.modal-body {
  padding: 40px;
  overflow-y: auto;
  flex: 1;
}

.top-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 28px;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: #4f46e5;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 900;
  color: #4f46e5;
  line-height: 1;
}

.map-container {
  height: 140px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: white;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.section-title h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
}

.title-line {
  height: 2px;
  width: 100%;
  background: linear-gradient(to right, #e2e8f0, transparent);
}

/* CARDS PREMIUM */
.hab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.hab-card-premium {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.hab-card-premium:hover {
  transform: translateY(-8px);
  border-color: #4f46e5;
  box-shadow: 0 20px 40px -12px rgba(79, 70, 229, 0.15);
}

.hab-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hab-badge-main {
  background: #f1f5f9;
  padding: 8px 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-family: monospace;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}

.view-details-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f1f5f9;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-details-btn:hover {
  background: #0f172a;
  color: white;
}

.hab-main-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hab-titular, .hab-expte {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
}

.hab-titular span {
  color: #0f172a;
  font-weight: 700;
}

.hab-actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.btn-action-primary {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-action-primary:hover {
  background: #4338ca;
  box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
}

.btn-action-secondary {
  background: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 12px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.action-dropdown-container {
  position: relative;
}

.action-dropdown-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 8px;
  min-width: 180px;
  display: none;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
  z-index: 10;
}

.action-dropdown-container:hover .action-dropdown-menu {
  display: block;
}

.action-dropdown-menu button {
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border: none;
  background: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.action-dropdown-menu button:hover {
  background: #f1f5f9;
  color: #4f46e5;
}

.close-btn {
  background: #f1f5f9;
  border: none;
  color: #64748b;
  padding: 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.empty-state {
  padding: 80px 40px;
  text-align: center;
  color: #94a3b8;
}

.empty-state p {
  margin-top: 16px;
  font-weight: 600;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade {
  animation: fadeIn 0.4s ease-out forwards;
}
</style>

