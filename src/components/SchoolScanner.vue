<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { FileUp, Loader2, AlertCircle, School } from 'lucide-vue-next';
import { extractSchoolData } from '../services/schoolService';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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

const runExtraction = async () => {
  if (images.value.length === 0) return;
  isProcessing.value = true;
  try {
    const data = await extractSchoolData(images.value);
    emit('school-extracted', data);
    images.value = [];
  } catch (err) {
    error.value = 'Error en la extracción por IA.';
  } finally {
    isProcessing.value = false;
  }
};

const removeImage = (index: number) => images.value.splice(index, 1);
</script>

<template>
  <div class="scanner-container glass-card animate-fade">
    <div class="tool-header">
      <div class="tool-icon"><School :size="24" /></div>
      <div>
        <h2>Escanear Certificado de Colegio</h2>
        <p>Sube el certificado del colegio para registrar la relación laboral con el transportista.</p>
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
      <h3>Arrastra o selecciona el Certificado</h3>
      <p>Soporta PDFs y fotos. También puedes pegar con <b>Ctrl + V</b></p>
    </div>

    <div v-if="images.length > 0" class="image-preview-grid">
      <div v-for="(img, idx) in images" :key="idx" class="preview-card">
        <img :src="`data:image/jpeg;base64,${img}`" />
        <button class="remove-btn" @click.stop="removeImage(idx)">×</button>
      </div>
    </div>

    <div class="actions" v-if="images.length > 0">
      <div v-if="error" class="error-msg"><AlertCircle :size="18" /> {{ error }}</div>
      <button class="btn btn-primary btn-large" :disabled="isProcessing" @click="runExtraction">
        <Loader2 v-if="isProcessing" class="spin" :size="20" />
        <span v-else>Extraer Datos del Colegio</span>
      </button>
    </div>

    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-content">
        <Loader2 class="spin" :size="48" />
        <h2>Analizando Certificado...</h2>
        <p>Buscando nombre del Colegio y datos del vehículo</p>
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
.spin { animation: rotate 1s linear infinite; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
