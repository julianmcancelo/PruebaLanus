<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { FileUp, Loader2, AlertCircle, FileText, CheckCircle } from 'lucide-vue-next';
import { extractHabilitacionData } from '../services/habilitacionService';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const emit = defineEmits(['habilitacion-extracted']);

const images = ref<string[]>([]);
const isProcessing = ref(false);
const error = ref<string | null>(null);

const handleFileUpload = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;
  await processFiles(Array.from(files));
};

const handleDrop = async (e: DragEvent) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (files) await processFiles(Array.from(files));
};

const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  const pastedImages: File[] = [];
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) pastedImages.push(file);
    }
  }
  if (pastedImages.length > 0) await processFiles(pastedImages);
};

onMounted(() => window.addEventListener('paste', handlePaste));
onUnmounted(() => window.removeEventListener('paste', handlePaste));

const processFiles = async (files: File[]) => {
  error.value = null;
  for (const file of files) {
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          images.value.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          images.value.push((reader.result as string).split(',')[1]);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      error.value = 'Error al procesar archivo.';
    }
  }
};

const extractedResult = ref<any>(null);

const runExtraction = async () => {
  if (images.value.length === 0) return;
  isProcessing.value = true;
  try {
    const data = await extractHabilitacionData(images.value);
    extractedResult.value = {
      nroExpediente: '',
      nroLicencia: '',
      titular: '',
      idNumber: '',
      dominio: '',
      tipoTramite: '',
      tipoHabilitacion: 'Escolar',
      cargadoGestdoc: false,
      ...data
    };
    images.value = [];
  } catch (err) {
    error.value = 'Error en la extracción por IA.';
  } finally {
    isProcessing.value = false;
  }
};

const confirmSave = () => {
  if (extractedResult.value) {
    emit('habilitacion-extracted', extractedResult.value);
    extractedResult.value = null;
  }
};

const cancelResult = () => {
  extractedResult.value = null;
};

const removeImage = (index: number) => images.value.splice(index, 1);
</script>

<template>
  <div class="scanner-container glass-card animate-fade">
    <div class="tool-header">
      <div class="tool-icon"><FileText :size="24" /></div>
      <div>
        <h2>Escanear Carátula de Habilitación</h2>
        <p>Sube la carátula de GestDoc para extraer N° de Expediente y datos del titular.</p>
      </div>
    </div>

    <div 
      class="upload-zone" 
      @click="$refs.fileInput.click()"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <input type="file" ref="fileInput" multiple accept="image/*,application/pdf" @change="handleFileUpload" style="display: none" />
      <FileUp :size="48" class="upload-icon" />
      <h3>Arrastra o selecciona la Carátula</h3>
      <p>Soporta PDFs y fotos. También puedes pegar con <b>Ctrl + V</b></p>
    </div>

    <div v-if="images.length > 0 && !extractedResult" class="image-preview-grid">
      <div v-for="(img, idx) in images" :key="idx" class="preview-card">
        <img :src="`data:image/jpeg;base64,${img}`" />
        <button class="remove-btn" @click.stop="removeImage(idx)">×</button>
      </div>
    </div>

    <div v-if="extractedResult" class="extracted-preview animate-fade">
      <h3>Verificar Datos Extraídos</h3>
      <div class="preview-grid">
        <div class="field">
          <label>N° Expediente</label>
          <input v-model="extractedResult.nroExpediente" class="preview-input" />
        </div>
        <div class="field">
          <label>N° Licencia / Habilitación</label>
          <input v-model="extractedResult.nroLicencia" class="preview-input" placeholder="ej. 068-0056 o similar" />
        </div>
        <div class="field">
          <label>Titular (Nombre y Apellido)</label>
          <input v-model="extractedResult.titular" class="preview-input" />
        </div>
        <div class="field">
          <label>DNI / CUIT del Titular</label>
          <input v-model="extractedResult.idNumber" class="preview-input" placeholder="ej. 20-12345678-9" />
        </div>
        <div class="field">
          <label>Dominio (Patente)</label>
          <input v-model="extractedResult.dominio" class="preview-input" />
        </div>
        <div class="field">
          <label>Tipo de Trámite</label>
          <input v-model="extractedResult.tipoTramite" class="preview-input" placeholder="ej. HABILITACION, RENOVACION" />
        </div>
        <div class="field full-width">
          <label>Tipo de Habilitación</label>
          <div class="type-selector">
            <button 
              :class="{ active: extractedResult.tipoHabilitacion === 'Escolar' }"
              @click="extractedResult.tipoHabilitacion = 'Escolar'"
            >Transporte Escolar</button>
            <button 
              :class="{ active: extractedResult.tipoHabilitacion === 'Remis' }"
              @click="extractedResult.tipoHabilitacion = 'Remis'"
            >Remis</button>
            <button 
              :class="{ active: extractedResult.tipoHabilitacion === 'Punto Inicial - Terminal' }"
              @click="extractedResult.tipoHabilitacion = 'Punto Inicial - Terminal'"
            >Punto Inicial / Terminal</button>
          </div>
        </div>
        <div class="field full-width gestdoc-field">
          <label class="checkbox-label">
            <input type="checkbox" v-model="extractedResult.cargadoGestdoc" class="gestdoc-checkbox" />
            <span class="checkbox-text">¿Cargado en GestDoc? (Tildar si ya fue subido al sistema municipal)</span>
          </label>
        </div>
      </div>
      <div class="preview-actions">
        <button class="btn btn-secondary" @click="cancelResult">Descartar</button>
        <button class="btn btn-primary" @click="confirmSave">Confirmar y Guardar</button>
      </div>
    </div>

    <div class="actions" v-if="images.length > 0 && !extractedResult">
      <div v-if="error" class="error-msg"><AlertCircle :size="18" /> {{ error }}</div>
      <button class="btn btn-primary btn-large" :disabled="isProcessing" @click="runExtraction">
        <Loader2 v-if="isProcessing" class="spin" :size="20" />
        <span v-else>Extraer Datos de Carátula</span>
      </button>
    </div>

    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-content">
        <Loader2 class="spin" :size="48" />
        <h2>Analizando Carátula...</h2>
        <p>Buscando N° de Expediente y Licencia</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scanner-container { 
  padding: 40px; 
  display: flex; 
  flex-direction: column; 
  gap: 32px; 
  position: relative; 
  background: white;
  border-radius: 20px;
}

.tool-header { display: flex; align-items: center; gap: 20px; }
.tool-icon { 
  background: var(--primary); 
  padding: 14px; 
  border-radius: 14px; 
  display: flex; 
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.tool-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.tool-header p {
  color: var(--text-muted);
  font-weight: 500;
}

.upload-zone { 
  border: 2px dashed var(--border-light); 
  border-radius: 16px; 
  padding: 50px; 
  text-align: center; 
  cursor: pointer; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  background: #f8fafc;
}

.upload-zone:hover { 
  border-color: var(--primary); 
  background: white; 
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.upload-zone h3 {
  color: var(--text-main);
  font-weight: 700;
  margin: 16px 0 8px;
}

.upload-zone p {
  color: var(--text-muted);
  font-weight: 500;
}

.upload-icon { color: var(--primary); opacity: 0.8; }

.image-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; margin-top: 8px; }
.preview-card { 
  position: relative; 
  aspect-ratio: 0.7; 
  border-radius: 12px; 
  overflow: hidden; 
  border: 1px solid var(--border-light); 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.preview-card img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn { position: absolute; top: 6px; right: 6px; background: rgba(15, 23, 42, 0.6); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; backdrop-filter: blur(4px); font-size: 18px; display: flex; align-items: center; justify-content: center; }
.remove-btn:hover { background: var(--danger); }

.actions { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.btn-large { width: 100%; max-width: 440px; padding: 18px; font-size: 16px; font-weight: 700; }

.error-msg {
  color: var(--danger);
  background: #fff1f2;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-overlay { 
  position: absolute; 
  inset: 0; 
  background: rgba(255, 255, 255, 0.95); 
  backdrop-filter: blur(8px); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 10; 
  border-radius: 20px; 
}

.loading-content { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.loading-content h2 { color: var(--text-main); font-weight: 800; }
.loading-content p { color: var(--text-muted); font-weight: 600; }

.extracted-preview { background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid var(--border-light); }
.extracted-preview h3 { font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 20px; }
.preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full-width { grid-column: span 2; }
.field label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.preview-input { background: white; border: 1px solid var(--border-light); padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; color: var(--text-main); }

.type-selector { display: flex; gap: 8px; }
.type-selector button { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border-light); background: white; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
.type-selector button.active { background: var(--primary); color: white; border-color: var(--primary); }

.preview-actions { display: flex; justify-content: flex-end; gap: 12px; }

.spin { animation: rotate 1s linear infinite; color: var(--primary); }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.gestdoc-field {
  margin-top: 8px;
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}
.gestdoc-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid var(--border-light);
  accent-color: var(--primary);
  cursor: pointer;
}
.checkbox-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}
</style>
