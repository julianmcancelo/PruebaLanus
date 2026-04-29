<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { FileUp, Loader2, CheckCircle, AlertCircle } from 'lucide-vue-next';
import { extractDniData, type DniData } from '../services/dniService';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const emit = defineEmits(['person-extracted']);

const frontImage = ref<string | null>(null);
const backImage = ref<string | null>(null);
const isProcessing = ref(false);
const error = ref<string | null>(null);

onMounted(() => {
  window.addEventListener('paste', handlePaste);
});

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste);
});

const pdfToImage = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL('image/jpeg').split(',')[1];
};

const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  const images: File[] = [];
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) images.push(file);
    }
  }

  if (images.length === 0) return;

  if (images.length === 1) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (!frontImage.value) frontImage.value = base64;
      else if (!backImage.value) backImage.value = base64;
      else frontImage.value = base64;
    };
    reader.readAsDataURL(images[0]);
  } else {
    processBulkFiles(images);
  }
};

const handleDrop = async (e: DragEvent) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;
  
  if (files.length === 1) {
    const file = files[0];
    if (file.type === 'application/pdf') {
      const base64 = await pdfToImage(file);
      if (!frontImage.value) frontImage.value = base64;
      else if (!backImage.value) backImage.value = base64;
      else frontImage.value = base64;
    } else {
      const base64 = await fileToBase64(file);
      if (!frontImage.value) frontImage.value = base64;
      else if (!backImage.value) backImage.value = base64;
      else frontImage.value = base64;
    }
  } else {
    processBulkFiles(Array.from(files));
  }
};

const handleFileUpload = async (e: Event, side: 'front' | 'back') => {
  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;

  if (files.length === 1) {
    const file = files[0];
    error.value = null;
    try {
      if (file.type === 'application/pdf') {
        const base64 = await pdfToImage(file);
        if (side === 'front') frontImage.value = base64;
        else backImage.value = base64;
      } else {
        const base64 = await fileToBase64(file);
        if (side === 'front') frontImage.value = base64;
        else backImage.value = base64;
      }
    } catch (err) {
      console.error(err);
      error.value = 'Error al procesar el archivo.';
    }
  } else {
    processBulkFiles(Array.from(files));
  }
};

const processBulkFiles = async (files: File[]) => {
  isProcessing.value = true;
  error.value = null;
  
  try {
    const pdfs = files.filter(f => f.type === 'application/pdf');
    const images = files.filter(f => f.type.startsWith('image/'));

    for (const pdfFile of pdfs) {
      const base64 = await pdfToImage(pdfFile);
      const data = await extractDniData(base64, base64);
      emit('person-extracted', { ...data, photo: base64 });
    }

    for (let i = 0; i < images.length; i += 2) {
      const front = await fileToBase64(images[i]);
      const back = images[i+1] ? await fileToBase64(images[i+1]) : front;
      const data = await extractDniData(front, back);
      emit('person-extracted', { ...data, photo: front });
    }
    
    reset();
  } catch (err) {
    console.error(err);
    error.value = 'Error en el procesamiento masivo.';
  } finally {
    isProcessing.value = false;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const processDni = async () => {
  if (!frontImage.value || !backImage.value) {
    error.value = 'Debes subir ambas caras del documento.';
    return;
  }

  isProcessing.value = true;
  error.value = null;

  try {
    const data = await extractDniData(frontImage.value, backImage.value);
    emit('person-extracted', { ...data, photo: frontImage.value });
    reset();
  } catch (err) {
    console.error(err);
    error.value = 'Error al procesar el documento.';
  } finally {
    isProcessing.value = false;
  }
};

const reset = () => {
  frontImage.value = null;
  backImage.value = null;
  error.value = null;
};
</script>

<template>
  <div 
    class="scanner-container glass-card animate-fade"
    @dragover.prevent
    @drop.prevent="handleDrop"
  >
    <div class="upload-grid">
      <!-- Front Side -->
      <div class="upload-box" :class="{ filled: frontImage }">
        <input type="file" id="front-dni" @change="e => handleFileUpload(e, 'front')" accept="image/*,application/pdf" />
        <label for="front-dni">
          <div v-if="!frontImage" class="upload-placeholder">
            <FileUp :size="40" />
            <span>Frente del DNI</span>
            <p>Imagen, PDF o <b>Pegar</b></p>
          </div>
          <img v-else :src="`data:image/jpeg;base64,${frontImage}`" alt="Frente" class="preview-img" />
        </label>
      </div>

      <!-- Back Side -->
      <div class="upload-box" :class="{ filled: backImage }">
        <input type="file" id="back-dni" @change="e => handleFileUpload(e, 'back')" accept="image/*,application/pdf" />
        <label for="back-dni">
          <div v-if="!backImage" class="upload-placeholder">
            <FileUp :size="40" />
            <span>Dorso del DNI</span>
            <p>Imagen, PDF o <b>Pegar</b></p>
          </div>
          <img v-else :src="`data:image/jpeg;base64,${backImage}`" alt="Dorso" class="preview-img" />
        </label>
      </div>
    </div>

    <div class="actions">
      <div v-if="error" class="error-msg">
        <AlertCircle :size="18" /> {{ error }}
      </div>
      
      <button 
        class="btn btn-primary btn-large" 
        :disabled="isProcessing || !frontImage || !backImage"
        @click="processDni"
      >
        <Loader2 v-if="isProcessing" class="spin" :size="20" />
        <span v-else>Procesar y Extraer Datos</span>
      </button>
    </div>

    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-content">
        <Loader2 class="spin" :size="48" />
        <h2>Analizando Documento...</h2>
        <p>GPT-4o mini está extrayendo la información</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scanner-container {
  padding: 40px;
  position: relative;
  overflow: hidden;
  background: white;
  border-radius: 20px;
}

.upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 40px;
}

.upload-box {
  aspect-ratio: 1.6;
  border: 2px dashed var(--border-light);
  border-radius: 16px;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background: #f8fafc;
}

.upload-box:hover {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.upload-box.filled {
  border-style: solid;
  border-color: #bbf7d0;
  background: white;
}

input[type="file"] {
  display: none;
}

label {
  width: 100%;
  height: 100%;
  display: flex;
  cursor: pointer;
}

.upload-placeholder {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-muted);
}

.upload-placeholder span {
  font-weight: 700;
  color: var(--text-main);
  font-size: 16px;
}

.upload-placeholder p {
  font-size: 13px;
  color: #64748b;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.btn-large {
  width: 100%;
  max-width: 440px;
  justify-content: center;
  padding: 18px;
  font-size: 16px;
  font-weight: 700;
}

.error-msg {
  color: var(--danger);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  background: #fff1f2;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
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
}

.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-content h2 {
  color: var(--text-main);
  font-weight: 800;
}

.loading-content p {
  color: var(--text-muted);
  font-weight: 600;
}

.spin {
  animation: rotate 1s linear infinite;
  color: var(--primary);
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
