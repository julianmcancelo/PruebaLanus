<script setup lang="ts">
import { ref } from 'vue';
import { Scissors, FileText, Trash2, Download, Loader2 } from 'lucide-vue-next';
import { splitPdf, getPdfPageCount, downloadPdf } from '../services/pdfService';

const selectedFile = ref<File | null>(null);
const pageCount = ref(0);
const selectedPages = ref<string>('');
const isProcessing = ref(false);

const handleFileSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  selectedFile.value = file;
  const buffer = await file.arrayBuffer();
  pageCount.value = await getPdfPageCount(buffer);
  selectedPages.value = `1-${pageCount.value}`;
};

const handleSplit = async () => {
  if (!selectedFile.value) return;
  
  isProcessing.value = true;
  try {
    const buffer = await selectedFile.value.arrayBuffer();
    
    // Parse range (e.g., "1-3, 5, 7-10")
    const indices: number[] = [];
    const parts = selectedPages.value.split(',');
    
    for (const part of parts) {
      const range = part.trim().split('-');
      if (range.length === 2) {
        const start = parseInt(range[0]) - 1;
        const end = parseInt(range[1]) - 1;
        for (let i = start; i <= end; i++) {
          if (i >= 0 && i < pageCount.value) indices.push(i);
        }
      } else {
        const page = parseInt(part.trim()) - 1;
        if (page >= 0 && page < pageCount.value) indices.push(page);
      }
    }

    if (indices.length === 0) throw new Error('No valid pages selected');

    const splitData = await splitPdf(buffer, indices);
    downloadPdf(splitData, `split_${selectedFile.value.name}`);
  } catch (err) {
    console.error('Error splitting PDF:', err);
    alert('Error al dividir el PDF. Verifica el rango de páginas.');
  } finally {
    isProcessing.value = false;
  }
};

const reset = () => {
  selectedFile.value = null;
  pageCount.value = 0;
  selectedPages.value = '';
};
</script>

<template>
  <div class="pdf-tool-container glass-card animate-fade">
    <div class="tool-header">
      <div class="tool-icon"><Scissors :size="24" /></div>
      <div>
        <h2>Dividir Archivo PDF</h2>
        <p>Extrae páginas específicas de un documento PDF.</p>
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
      <Scissors :size="48" class="upload-icon" />
      <h3>Haz clic para seleccionar un archivo PDF</h3>
      <p>O arrastra y suelta aquí</p>
    </div>

    <div v-else class="split-config">
      <div class="file-card">
        <FileText :size="32" class="text-primary" />
        <div class="file-details">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-meta">{{ pageCount }} páginas • {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
        </div>
        <button @click="reset" class="btn-icon delete"><Trash2 :size="20" /></button>
      </div>

      <div class="range-input-group">
        <label>Rango de páginas a extraer:</label>
        <input 
          v-model="selectedPages" 
          type="text" 
          placeholder="Ej: 1-3, 5, 7-10" 
          class="input-field" 
        />
        <p class="input-hint">Usa guiones para rangos y comas para páginas individuales.</p>
      </div>

      <div class="actions">
        <button 
          class="btn btn-primary btn-large" 
          :disabled="!selectedPages || isProcessing"
          @click="handleSplit"
        >
          <Loader2 v-if="isProcessing" class="spin" :size="20" />
          <template v-else>
            <Download :size="20" /> Extraer y Descargar
          </template>
        </button>
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

.tool-header h2 {
  font-size: 20px;
  font-weight: 700;
}

.tool-header p {
  color: var(--text-muted);
  font-size: 14px;
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

.upload-icon {
  color: var(--text-muted);
  margin-bottom: 16px;
}

.split-config {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid var(--glass-border);
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 600;
  color: white;
}

.file-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.range-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.range-input-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}

.input-hint {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.actions {
  display: flex;
  justify-content: center;
}

.btn-large {
  width: 100%;
  max-width: 400px;
  padding: 16px;
  font-size: 16px;
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.btn-icon.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.spin {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
