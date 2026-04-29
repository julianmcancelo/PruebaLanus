<script setup lang="ts">
import { ref } from 'vue';
import { ClipboardCheck, Save, X, Car, AlertTriangle, CheckCircle2 } from 'lucide-vue-next';

const props = defineProps<{
  titles: any[]
}>();

const emit = defineEmits(['save', 'cancel']);

const dominio = ref('');
const fecha = ref(new Date().toISOString().split('T')[0]);
const resultado = ref('APROBADO');
const observaciones = ref('');

const checklist = ref([
  { id: '1', label: 'Pta. accionada desde cond. para desc. / asc. (Puerta derecha)', status: 'Bien', motivo: '' },
  { id: '2', label: 'Pta. accionada desde cond. para desc. / asc. (Puerta izquierda)', status: 'Bien', motivo: '' },
  { id: '3', label: 'Salida de Emer. indep. de la plataf. asc. / desc. (En Caso de Combi - L. Der. y Trasero)', status: 'Bien', motivo: '' },
  { id: '4', label: 'Vent. Vidrio Temp. / inastillable (Apertura 10 cm)', status: 'Bien', motivo: '' },
  { id: '5', label: 'Pisos rec. con mat. Antideslizables', status: 'Bien', motivo: '' },
  { id: '6', label: 'Dimens. de Banquetas (desde el piso 0.40 mts - ancho min 0.45mts Prof. medida horiz. 0.40 mts)', status: 'Bien', motivo: '' },
  { id: '7', label: 'Asientos: Fijos, Acolchados, Estructu. metalicas, revestimiento (Caucho o similar)', status: 'Bien', motivo: '' },
  { id: '8', label: 'Puerta Izquierda de la Carroceria', status: 'Bien', motivo: '' },
  { id: '9', label: 'Cinturones de Seguridad en todos los asientos', status: 'Bien', motivo: '' },
  { id: '10', label: 'Cabezales o apoya Cabeza en todos los asientos', status: 'Bien', motivo: '' },
  { id: '11', label: 'Espacios Libres', status: 'Bien', motivo: '' },
  { id: '12', label: 'Pintura (Carroceria baja y capot naranja N° 1054 IRAM - carroceria altatecho y parantes Color blanco)', status: 'Bien', motivo: '' },
  { id: '13', label: 'Leyenda de "Escolares" o "Niños" Tamaño minimo: 0,20 mts', status: 'Bien', motivo: '' }
]);

const handleSave = () => {
  if (!dominio.value) return;
  emit('save', {
    dominio: dominio.value,
    fecha: fecha.value,
    resultado: resultado.value,
    observaciones: observaciones.value,
    checklist: JSON.parse(JSON.stringify(checklist.value))
  });
};
</script>

<template>
  <div class="new-inspection glass-card animate-fade">
    <div class="tool-header">
      <div class="tool-icon"><ClipboardCheck :size="24" /></div>
      <div>
        <h2>Nueva Inspección Técnica</h2>
        <p>Registra el control técnico de un vehículo habilitado.</p>
      </div>
    </div>

    <div class="form-grid">
      <div class="form-group">
        <label>Vehículo (Dominio)</label>
        <select v-model="dominio" class="input-field">
          <option value="" disabled>Seleccionar vehículo...</option>
          <option v-for="t in titles" :key="t.id" :value="t.dominio">{{ t.dominio }} - {{ t.marca }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>Fecha de Inspección</label>
        <input type="date" v-model="fecha" class="input-field" />
      </div>

      <div class="form-group full-width">
        <label>Detalles y Observaciones del Vehículo</label>
        <div class="checklist-container">
          <div v-for="item in checklist" :key="item.id" class="check-row">
            <div class="check-label-cell">{{ item.label }}</div>
            <div class="check-status-cell">
              <button class="st-btn bien" :class="{ active: item.status === 'Bien' }" @click="item.status = 'Bien'">Bien</button>
              <button class="st-btn regul" :class="{ active: item.status === 'Regul' }" @click="item.status = 'Regul'">Regul</button>
              <button class="st-btn malo" :class="{ active: item.status === 'Malo' }" @click="item.status = 'Malo'">Malo</button>
            </div>
            <div class="check-motivo-cell">
              <input v-model="item.motivo" placeholder="Motivo/Obs" class="input-field mini" />
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Resultado General</label>
        <div class="result-selector">
          <button 
            class="res-btn pass" 
            :class="{ active: resultado === 'APROBADO' }" 
            @click="resultado = 'APROBADO'"
          >APROBADO</button>
          <button 
            class="res-btn warn" 
            :class="{ active: resultado === 'CONDICIONAL' }" 
            @click="resultado = 'CONDICIONAL'"
          >CONDICIONAL</button>
          <button 
            class="res-btn fail" 
            :class="{ active: resultado === 'RECHAZADO' }" 
            @click="resultado = 'RECHAZADO'"
          >RECHAZADO</button>
        </div>
      </div>

      <div class="form-group">
        <label>Observaciones</label>
        <textarea v-model="observaciones" class="input-field" rows="3" placeholder="Detalles adicionales..."></textarea>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-secondary" @click="$emit('cancel')">Cancelar</button>
      <button class="btn btn-primary" @click="handleSave">
        <Save :size="18" /> Guardar Inspección
      </button>
    </div>
  </div>
</template>

<style scoped>
.new-inspection { padding: 32px; display: flex; flex-direction: column; gap: 24px; max-width: 800px; margin: 0 auto; }
.tool-header { display: flex; align-items: center; gap: 16px; }
.tool-icon { background: var(--primary); padding: 12px; border-radius: 12px; display: flex; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group.full-width { grid-column: span 2; }
.form-group label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }

.input-field { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; padding: 12px; color: white; font-size: 14px; outline: none; transition: border-color 0.2s; }
.input-field:focus { border-color: var(--primary); }

.checklist-container { display: flex; flex-direction: column; gap: 4px; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 12px; }
.check-row { display: grid; grid-template-columns: 1fr 180px 150px; gap: 8px; align-items: center; padding: 6px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; }
.check-label-cell { font-size: 11px; line-height: 1.2; font-weight: 500; }
.check-status-cell { display: flex; gap: 2px; }
.st-btn { flex: 1; padding: 4px 0; font-size: 9px; font-weight: 700; border: 1px solid var(--glass-border); background: transparent; color: var(--text-muted); cursor: pointer; border-radius: 4px; }
.st-btn.bien.active { background: var(--accent); color: white; border-color: var(--accent); }
.st-btn.regul.active { background: #f59e0b; color: white; border-color: #f59e0b; }
.st-btn.malo.active { background: var(--danger); color: white; border-color: var(--danger); }
.input-field.mini { padding: 4px 8px; font-size: 11px; }

.result-selector { display: flex; gap: 10px; }
.res-btn { flex: 1; padding: 12px; font-size: 12px; font-weight: 800; border: 1px solid var(--glass-border); background: transparent; color: var(--text-muted); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.res-btn.pass.active { background: var(--accent); color: white; border-color: var(--accent); }
.res-btn.warn.active { background: #f59e0b; color: white; border-color: #f59e0b; }
.res-btn.fail.active { background: var(--danger); color: white; border-color: var(--danger); }

.actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
</style>
