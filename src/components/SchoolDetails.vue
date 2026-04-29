<script setup lang="ts">
import { ref, computed } from 'vue';
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

const editableAddress = ref(props.school.domicilio || '');
const isSavingAddress = ref(false);
const isEnriching = ref(false);

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

const saveAddress = async () => {
  isSavingAddress.value = true;
  await emit('update-school', { ...props.school, domicilio: editableAddress.value });
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
  return props.habilitaciones.filter(h => h.idColegios?.includes(props.school.id));
};

const getPersonForHab = (hab: any) => {
  return props.people.find(p => p.id === hab.idPersona);
};

const getTitleForHab = (hab: any) => {
  return props.titles.find(t => t.dominio === hab.dominio);
};
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content glass-card animate-slide-up">
      <div class="modal-header">
        <div class="school-title">
          <div class="school-icon"><School :size="24" /></div>
          <div>
            <div class="title-with-action">
              <h2>Legajo de Colegio: {{ school.nombre }}</h2>
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
            
            <div class="address-edit-group">
              <MapPin :size="14" class="pin-icon" />
              <input 
                v-model="editableAddress" 
                type="text" 
                class="address-input" 
                placeholder="Ingresar domicilio..."
                @blur="saveAddress"
              />
              <button v-if="editableAddress !== school.domicilio" @click="saveAddress" class="save-mini-btn">
                <Save :size="14" />
              </button>
            </div>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')"><X :size="24" /></button>
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
          <div v-for="hab in getHabilitacionesForSchool()" :key="hab.id" class="hab-card glass-card">
            <div class="hab-header">
              <div class="domain-badge">{{ hab.dominio }}</div>
              <div class="hab-actions">
                <button class="mini-btn" title="Ver Detalles" @click="$emit('view-hab', hab)">
                  <Eye :size="14" />
                </button>
              </div>
            </div>

            <div class="hab-info">
              <div class="info-row">
                <User :size="14" />
                <span>{{ hab.titular }}</span>
              </div>
              <div class="info-row">
                <Hash :size="14" />
                <span>Expte: {{ hab.nroExpediente || 'S/D' }}</span>
              </div>
            </div>

            <div class="hab-footer">
              <button class="btn btn-primary btn-sm" @click="$emit('generate-resolution', hab)">
                <FileSignature :size="14" /> Resolución
              </button>
              <div class="dropdown">
                <button class="btn btn-secondary btn-sm">
                  <Printer :size="14" /> Planilla
                </button>
                <div class="dropdown-content">
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
  max-width: 900px;
  max-height: 92vh;
  background: white;
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  padding: 32px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.school-title {
  display: flex;
  align-items: center;
  gap: 20px;
}

.school-icon {
  background: var(--primary);
  padding: 14px;
  border-radius: 14px;
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.school-title h2 {
  margin: 0;
  font-size: 1.6rem;
  color: var(--text-main);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.title-with-action {
  display: flex;
  align-items: center;
  gap: 12px;
}

.enrich-btn {
  background: rgba(79, 70, 229, 0.05);
  border: 1px solid rgba(79, 70, 229, 0.1);
  color: var(--primary);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.enrich-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.enrich-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin { animation: rotate 1s linear infinite; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.close-btn {
  background: #f1f5f9;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: var(--text-main);
}

.modal-body {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
  background: #f8fafc;
}

.address-edit-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  background: white;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.address-edit-group:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.pin-icon { color: var(--primary); }

.address-input {
  background: none;
  border: none;
  color: var(--text-main);
  font-size: 0.95rem;
  font-weight: 600;
  width: 100%;
  outline: none;
}

.save-mini-btn {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  transition: all 0.2s;
}

.top-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  margin-bottom: 32px;
}

.map-container {
  height: 120px;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--border-light);
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.no-map {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid var(--border-light);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

.section-title {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-main);
  font-weight: 700;
}

.title-line {
  height: 2px;
  flex: 1;
  background: var(--border-light);
  border-radius: 2px;
}

.hab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.hab-card {
  padding: 24px;
  background: white;
  border-radius: 16px;
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.hab-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -8px rgba(0,0,0,0.1);
  border-color: var(--primary);
}

.hab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.domain-badge {
  background: #f1f5f9;
  color: var(--text-main);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.9rem;
  font-family: monospace;
  border: 1px solid var(--border-light);
}

.hab-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: var(--text-muted);
  font-weight: 500;
}

.info-row span {
  color: var(--text-main);
  font-weight: 600;
}

.hab-footer {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 0.85rem;
  flex: 1;
}

.dropdown-content {
  background: white;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.dropdown-content button {
  padding: 12px 16px;
  color: #475569;
  font-weight: 600;
}

.dropdown-content button:hover {
  background: #f8fafc;
  color: var(--primary);
}

.empty-state {
  padding: 60px 40px;
  background: white;
  border-radius: 16px;
  border: 1px dashed var(--border-light);
}

.mini-btn {
  background: #f1f5f9;
  border: 1px solid var(--border-light);
  color: var(--text-muted);
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s;
}

.mini-btn:hover {
  background: #e2e8f0;
  color: var(--text-main);
}
</style>
