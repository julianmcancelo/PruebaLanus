<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Eye, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Loader2, FileText, Trash2 } from 'lucide-vue-next';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const selectedFile = ref<File | null>(null);
const pdfDoc = ref<any>(null);
const pageNum = ref(1);
const numPages = ref(0);
const scale = ref(1.0);
const isRendering = ref(false);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const handleFileSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  selectedFile.value = file;
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  pdfDoc.value = await loadingTask.promise;
  numPages.value = pdfDoc.value.numPages;
  pageNum.value = 1;
  renderPage();
};

const renderPage = async () => {
  if (!pdfDoc.value || !canvasRef.value) return;
  
  isRendering.value = true;
  try {
    const page = await pdfDoc.value.getPage(pageNum.value);
    const viewport = page.getViewport({ scale: scale.value });
    const canvas = canvasRef.value;
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
  } catch (err) {
    console.error('Error rendering page:', err);
  } finally {
    isRendering.value = false;
  }
};

const changePage = (offset: number) => {
  const newPage = pageNum.value + offset;
  if (newPage >= 1 && newPage <= numPages.value) {
    pageNum.value = newPage;
    renderPage();
  }
};

const changeZoom = (factor: number) => {
  scale.value = Math.max(0.5, Math.min(3.0, scale.value + factor));
  renderPage();
};

const downloadCurrent = () => {
  if (!selectedFile.value) return;
  const url = URL.createObjectURL(selectedFile.value);
  const link = document.createElement('a');
  link.href = url;
  link.download = selectedFile.value.name;
  link.click();
  URL.revokeObjectURL(url);
};

const reset = () => {
  selectedFile.value = null;
  pdfDoc.value = null;
  pageNum.value = 1;
  numPages.value = 0;
};
</script>

<template>
  <div class="pdf-tool-container glass-card animate-fade">
    <div class="tool-header">
      <div class="tool-icon"><Eye :size="24" /></div>
      <div>
        <h2>Visor de PDF</h2>
        <p>Visualiza y navega a través de tus documentos PDF.</p>
      </div>
    </div>

    <div v-if="!selectedFile" class="upload-zone" @click="$refs.fileInput.click()">
      <input 
        type="file" 
        ref="fileInput" 
        accept="application/pdf" 
        @change="handleFileSelect" 
        style="display: none" 
      />
      <Eye :size="48" class="upload-icon" />
      <h3>Selecciona un PDF para visualizar</h3>
      <p>Haz clic o arrastra un archivo</p>
    </div>

    <div v-else class="viewer-main">
      <div class="viewer-controls">
        <div class="control-group">
          <button @click="changePage(-1)" :disabled="pageNum <= 1" class="btn-icon">
            <ChevronLeft :size="20" />
          </button>
          <span class="page-info">Página {{ pageNum }} de {{ numPages }}</span>
          <button @click="changePage(1)" :disabled="pageNum >= numPages" class="btn-icon">
            <ChevronRight :size="20" />
          </button>
        </div>

        <div class="control-group">
          <button @click="changeZoom(-0.2)" class="btn-icon">
            <ZoomOut :size="20" />
          </button>
          <span class="zoom-info">{{ Math.round(scale * 100) }}%</span>
          <button @click="changeZoom(0.2)" class="btn-icon">
            <ZoomIn :size="20" />
          </button>
        </div>

        <div class="control-group">
          <button @click="downloadCurrent" class="btn-icon" title="Descargar">
            <Download :size="20" />
          </button>
          <button @click="reset" class="btn-icon delete" title="Cerrar">
            <Trash2 :size="20" />
          </button>
        </div>
      </div>

      <div class="canvas-wrapper">
        <Loader2 v-if="isRendering" class="spin loading-indicator" :size="48" />
        <canvas ref="canvasRef"></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-tool-container {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: calc(100vh - 150px);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tool-icon {
  background: var(--primary);
  padding: 12px;
  border-radius: 12px;
  display: flex;
}

.upload-zone {
  border: 2px dashed var(--glass-border);
  border-radius: 12px;
  padding: 60px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-zone:hover {
  border-color: var(--primary);
  background: rgba(99, 102, 241, 0.05);
}

.viewer-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow: hidden;
}

.viewer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid var(--glass-border);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-info, .zoom-info {
  font-size: 14px;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
}

.canvas-wrapper {
  flex: 1;
  overflow: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  position: relative;
  min-height: 400px;
}

canvas {
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  margin: 20px;
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-icon.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--primary);
  z-index: 5;
}

.spin {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
