<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { FileUp, Loader2, AlertCircle, School, Building2 } from 'lucide-vue-next';
import { extractEntityData } from '../services/schoolService';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const emit = defineEmits(['school-extracted']);

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
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        images.value.push(canvas.toDataURL('image/jpeg').split(',')[1]);
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
    const data = await extractEntityData(images.value);
    extractedResult.value = data;
    images.value = [];
  } catch (err) {
    error.value = 'Error en la extracción por IA.';
  } finally {
    isProcessing.value = false;
  }
};

const confirmSave = () => {
  if (extractedResult.value) {
    emit('school-extracted', extractedResult.value);
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
      <div class="tool-icon">
        <School v-if="!extractedResult || extractedResult.tipo === 'Colegio'" :size="24" />
        <Building2 v-else :size="24" />
      </div>
      <div>
        <h2>Escanear Certificado (Colegio/Remisería)</h2>
        <p>Sube el certificado para registrar la vinculación con el transportista.</p>
      </div>
    </div>

    <div 
      v-if="!images.length && !extractedResult"
      class="upload-zone" 
      @click="$refs.fileInput.click()"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <input type="file" ref="fileInput" multiple accept="image/*,application/pdf" @change="handleFileUpload" style="display: none" />
      <FileUp :size="48" class="upload-icon" />
      <h3>Arrastra o selecciona el Certificado</h3>
      <p>Soporta PDFs y fotos. También puedes pegar con <b>Ctrl + V</b></p>
    </div>

    <div v-if="images.length > 0 && !extractedResult" class="image-preview-grid">
      <div v-for="(img, idx) in images" :key="idx" class="preview-card">
        <img :src="`data:image/jpeg;base64,${img}`" />
        <button class="remove-btn" @click.stop="removeImage(idx)">×</button>
      </div>
    </div>

    <div v-if="extractedResult" class="extracted-preview animate-fade">
      <h3>Verificar Vinculación</h3>
      <div class="preview-grid">
        <div class="field">
          <label>Nombre de la Entidad</label>
          <input v-model="extractedResult.nombre" class="preview-input" />
        </div>
        <div class="field">
          <label>Dirección</label>
          <input v-model="extractedResult.domicilio" class="preview-input" />
        </div>
        <div class="field">
          <label>Dominio Vinculado</label>
          <input v-model="extractedResult.dominio" class="preview-input" />
        </div>
        <div class="field">
          <label>Tipo de Entidad</label>
          <div class="type-selector">
            <button 
              :class="{ active: extractedResult.tipo === 'Colegio' }"
              @click="extractedResult.tipo = 'Colegio'"
            >Colegio</button>
            <button 
              :class="{ active: extractedResult.tipo === 'Remiseria' }"
              @click="extractedResult.tipo = 'Remiseria'"
            >Remisería / Agencia</button>
          </div>
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
        <span v-else>Extraer Datos del Certificado</span>
      </button>
    </div>

    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-content">
        <Loader2 class="spin" :size="48" />
        <h2>Analizando Certificado...</h2>
        <p>Buscando nombre de la entidad y datos del vehículo</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scanner-container { padding: 32px; display: flex; flex-direction: column; gap: 24px; position: relative; }
.tool-header { display: flex; align-items: center; gap: 16px; }
.tool-icon { background: var(--primary); padding: 12px; border-radius: 12px; display: flex; }
.upload-zone { border: 2px dashed var(--glass-border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; }
.upload-zone:hover { border-color: var(--primary); background: rgba(99,102,241,0.05); }
.image-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px; margin-top: 16px; }
.preview-card { position: relative; aspect-ratio: 0.7; border-radius: 8px; overflow: hidden; border: 1px solid var(--glass-border); }
.preview-card img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; }
.actions { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.btn-large { width: 100%; max-width: 400px; padding: 16px; font-size: 16px; }
.loading-overlay { position: absolute; inset: 0; background: rgba(15,23,42,0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10; border-radius: 16px; }
.loading-content { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.extracted-preview { background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid var(--border-light); margin-top: 16px; }
.extracted-preview h3 { font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 20px; }
.preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.preview-input { background: white; border: 1px solid var(--border-light); padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; color: var(--text-main); }

.type-selector { display: flex; gap: 8px; }
.type-selector button { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border-light); background: white; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
.type-selector button.active { background: var(--primary); color: white; border-color: var(--primary); }

.preview-actions { display: flex; justify-content: flex-end; gap: 12px; }

.spin { animation: rotate 1s linear infinite; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
