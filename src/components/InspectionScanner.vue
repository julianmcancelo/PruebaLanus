<script setup lang="ts">
import { ref } from 'vue';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Scissors } from 'lucide-vue-next';
import { extractInspectionData } from '../services/inspectionService';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// PDF Worker setup
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const emit = defineEmits(['inspection-extracted']);

const isDragging = ref(false);
const isProcessing = ref(false);
const error = ref<string | null>(null);

const extractedResult = ref<any>(null);

const processFiles = async (files: FileList | File[]) => {
  isProcessing.value = true;
  error.value = null;

  try {
    for (const file of files) {
      let images: string[] = [];

      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context!, viewport }).promise;
          images.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
        }
      } else {
        const base64 = await fileToBase64(file);
        images.push(base64.split(',')[1]);
      }

      const extractedData = await extractInspectionData(images);
      extractedResult.value = extractedData;
    }
  } catch (err: any) {
    console.error(err);
    error.value = 'Error al procesar el acta de inspección. Verifica el formato.';
  } finally {
    isProcessing.value = false;
  }
};

const confirmSave = () => {
  if (extractedResult.value) {
    emit('inspection-extracted', extractedResult.value);
    extractedResult.value = null;
  }
};

const cancelResult = () => {
  extractedResult.value = null;
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files) {
    processFiles(e.dataTransfer.files);
  }
};

const handleFileInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    processFiles(target.files);
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
</script>

<template>
  <div class="scanner-container animate-fade">
    <div 
      v-if="!extractedResult"
      class="drop-zone"
      :class="{ dragging: isDragging, processing: isProcessing }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="$refs.fileInput.click()"
    >
      <input 
        type="file" 
        ref="fileInput" 
        class="hidden" 
        accept="image/*,application/pdf" 
        multiple
        @change="handleFileInput"
      >
      
      <div v-if="!isProcessing" class="drop-content">
        <div class="icon-stack">
          <FileText class="icon-bg" :size="64" />
          <Upload class="icon-main" :size="32" />
        </div>
        <h3>Cargar Acta de Inspección (Escolar/Remis)</h3>
        <p>Arrastra el PDF del acta o haz clic para subir</p>
        <div class="format-badges">
          <span>PDF</span>
          <span>JPG</span>
          <span>PNG</span>
        </div>
      </div>

      <div v-else class="processing-content">
        <Loader2 class="spinner" :size="48" />
        <h3>Analizando Acta Técnica...</h3>
        <p>La IA está extrayendo el checklist y los datos del vehículo</p>
      </div>
    </div>

    <div v-if="extractedResult" class="extracted-preview animate-fade">
      <div class="preview-header">
        <CheckCircle :size="24" class="success-icon" />
        <h3>Verificar Acta de Inspección</h3>
      </div>
      
      <div class="preview-grid">
        <div class="field">
          <label>Dominio</label>
          <input v-model="extractedResult.dominio" class="preview-input" />
        </div>
        <div class="field">
          <label>Fecha</label>
          <input v-model="extractedResult.fecha" class="preview-input" type="date" />
        </div>
        <div class="field">
          <label>Resultado</label>
          <input v-model="extractedResult.resultado" class="preview-input" />
        </div>
        <div class="field">
          <label>Tipo de Inspección</label>
          <div class="type-selector">
            <button 
              :class="{ active: extractedResult.tipo === 'Escolar' }"
              @click="extractedResult.tipo = 'Escolar'"
            >Escolar</button>
            <button 
              :class="{ active: extractedResult.tipo === 'Remis' }"
              @click="extractedResult.tipo = 'Remis'"
            >Remis</button>
          </div>
        </div>
      </div>

      <div class="checklist-preview">
        <h4>Resumen de Checklist ({{ extractedResult.checklist?.length || 0 }} ítems)</h4>
        <div class="checklist-mini-grid">
          <div v-for="(item, idx) in extractedResult.checklist?.slice(0, 6)" :key="idx" class="mini-item">
            <span class="dot" :class="item.status.toLowerCase()"></span>
            <span class="label">{{ item.label }}</span>
          </div>
          <div v-if="extractedResult.checklist?.length > 6" class="mini-more">...y {{ extractedResult.checklist.length - 6 }} más</div>
        </div>
      </div>

      <div class="preview-actions">
        <button class="btn-secondary" @click="cancelResult">Descartar</button>
        <button class="btn-primary" @click="confirmSave">Confirmar y Guardar Inspección</button>
      </div>
    </div>

    <div v-if="error" class="error-toast animate-slide-up">
      <AlertCircle :size="20" />
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<style scoped>
.scanner-container { width: 100%; max-width: 800px; margin: 0 auto; }
.drop-zone { background: rgba(255, 255, 255, 0.03); border: 2px dashed var(--glass-border); border-radius: 24px; padding: 64px; text-align: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
.drop-zone:hover { border-color: var(--primary); background: rgba(99, 102, 241, 0.05); transform: translateY(-2px); }
.drop-zone.dragging { border-color: var(--accent); background: rgba(16, 185, 129, 0.05); transform: scale(1.02); }
.drop-zone.processing { cursor: wait; border-color: var(--primary); }

.drop-content { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.icon-stack { position: relative; display: flex; align-items: center; justify-content: center; }
.icon-bg { color: rgba(255, 255, 255, 0.05); }
.icon-main { position: absolute; color: var(--primary); }

.extracted-preview { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 24px; padding: 32px; backdrop-filter: blur(10px); }
.preview-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.success-icon { color: var(--accent); }
.preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.preview-input { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 12px; padding: 12px 16px; color: white; font-size: 15px; }

.type-selector { display: flex; gap: 8px; }
.type-selector button { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: var(--text-muted); font-weight: 600; cursor: pointer; transition: all 0.2s; }
.type-selector button.active { background: var(--primary); color: white; border-color: var(--primary); }

.checklist-preview { background: rgba(0,0,0,0.2); border-radius: 16px; padding: 20px; margin-bottom: 24px; margin-top: 24px; }
.checklist-preview h4 { font-size: 13px; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; }
.checklist-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mini-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: white; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.bien { background: var(--accent); }
.dot.regul { background: var(--warning); }
.dot.malo { background: var(--danger); }
.mini-more { grid-column: span 2; font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.preview-actions { display: flex; justify-content: flex-end; gap: 12px; }
.btn-primary { background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; }
.btn-secondary { background: transparent; color: white; border: 1px solid var(--glass-border); padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; }

.spinner { color: var(--primary); animation: spin 2s linear infinite; }

h3 { font-size: 20px; font-weight: 700; color: white; margin: 0; }
p { color: var(--text-muted); font-size: 15px; margin: 0; }

.format-badges { display: flex; gap: 10px; margin-top: 10px; }
.format-badges span { background: rgba(255, 255, 255, 0.1); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; color: var(--text-muted); }

.error-toast { margin-top: 20px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--danger); padding: 12px 20px; border-radius: 12px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.hidden { display: none; }
</style>
