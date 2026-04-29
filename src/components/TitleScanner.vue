<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { FileUp, Loader2, AlertCircle, FileText, CheckCircle } from 'lucide-vue-next';
import { extractTitleData } from '../services/titleService';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const emit = defineEmits(['title-extracted']);

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
        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          images.value.push(canvas.toDataURL('image/jpeg').split(',')[1]);
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

const runExtraction = async () => {
  if (images.value.length === 0) return;
  isProcessing.value = true;
  try {
    const data = await extractTitleData(images.value);
    emit('title-extracted', data);
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
      <div class="tool-icon"><FileText :size="24" /></div>
      <div>
        <h2>Escanear Título Automotor</h2>
        <p>Sube las imágenes o el PDF del título digital para extraer todos los datos.</p>
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
      <h3>Haz clic para subir o arrastra los archivos</h3>
      <p>También puedes pegar imágenes con <b>Ctrl + V</b></p>
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
        <span v-else>Extraer Datos del Título</span>
      </button>
    </div>

    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-content">
        <Loader2 class="spin" :size="48" />
        <h2>Analizando Título...</h2>
        <p>Estamos extrayendo dominio, trámite y control web</p>
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

.spin { animation: rotate 1s linear infinite; color: var(--primary); }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
