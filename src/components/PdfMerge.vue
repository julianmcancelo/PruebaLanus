<script setup lang="ts">
import { ref } from 'vue';
import { FilePlus, FileText, Trash2, Download, Loader2, ArrowUpDown } from 'lucide-vue-next';
import { mergePdfs, downloadPdf } from '../services/pdfService';

const selectedFiles = ref<{ file: File; id: string }[]>([]);
const isProcessing = ref(false);

const handleFileSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;
  
  for (let i = 0; i < files.length; i++) {
    selectedFiles.value.push({
      file: files[i],
      id: Math.random().toString(36).substr(2, 9)
    });
  }
};

const removeFile = (id: string) => {
  selectedFiles.value = selectedFiles.value.filter(f => f.id !== id);
};

const moveUp = (index: number) => {
  if (index === 0) return;
  const temp = selectedFiles.value[index];
  selectedFiles.value[index] = selectedFiles.value[index - 1];
  selectedFiles.value[index - 1] = temp;
};

const moveDown = (index: number) => {
  if (index === selectedFiles.value.length - 1) return;
  const temp = selectedFiles.value[index];
  selectedFiles.value[index] = selectedFiles.value[index + 1];
  selectedFiles.value[index + 1] = temp;
};

const handleMerge = async () => {
  if (selectedFiles.value.length < 2) return;
  
  isProcessing.value = true;
  try {
    const buffers = await Promise.all(
      selectedFiles.value.map(f => f.file.arrayBuffer())
    );
    const mergedData = await mergePdfs(buffers);
    downloadPdf(mergedData, 'merged_document.pdf');
  } catch (err) {
    console.error('Error merging PDFs:', err);
    alert('Error al unir los PDFs. Asegúrate de que los archivos sean válidos.');
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <div class="pdf-tool-container glass-card animate-fade">
    <div class="tool-header">
      <div class="tool-icon"><FilePlus :size="24" /></div>
      <div>
        <h2>Unir Archivos PDF</h2>
        <p>Selecciona dos o más archivos para combinarlos en uno solo.</p>
      </div>
    </div>

    <div class="upload-zone" @click="$refs.fileInput.click()">
      <input 
        type="file" 
        ref="fileInput" 
        multiple 
        accept="application/pdf" 
        @change="handleFileSelect" 
        style="display: none" 
      />
      <FilePlus :size="48" class="upload-icon" />
      <h3>Haz clic para añadir archivos PDF</h3>
      <p>O arrastra y suelta aquí</p>
    </div>

    <div v-if="selectedFiles.length > 0" class="file-list">
      <div v-for="(file, index) in selectedFiles" :key="file.id" class="file-item">
        <div class="file-info">
          <FileText :size="20" class="text-primary" />
          <span class="file-name">{{ file.file.name }}</span>
          <span class="file-size">({{ (file.file.size / 1024 / 1024).toFixed(2) }} MB)</span>
        </div>
        <div class="file-actions">
          <button @click.stop="moveUp(index)" :disabled="index === 0" class="btn-icon">
            <ArrowUpDown :size="16" style="transform: rotate(180deg)" />
          </button>
          <button @click.stop="moveDown(index)" :disabled="index === selectedFiles.value?.length - 1" class="btn-icon">
            <ArrowUpDown :size="16" />
          </button>
          <button @click.stop="removeFile(file.id)" class="btn-icon delete">
            <Trash2 :size="16" />
          </button>
        </div>
      </div>
    </div>

    <div class="actions">
      <button 
        class="btn btn-primary btn-large" 
        :disabled="selectedFiles.length < 2 || isProcessing"
        @click="handleMerge"
      >
        <Loader2 v-if="isProcessing" class="spin" :size="20" />
        <template v-else>
          <Download :size="20" /> Unir y Descargar
        </template>
      </button>
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
  padding: 40px;
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

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid var(--glass-border);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-name {
  font-weight: 500;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: var(--text-muted);
}

.file-actions {
  display: flex;
  gap: 4px;
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

.btn-icon:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-icon.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.btn-large {
  width: 100%;
  max-width: 400px;
  padding: 16px;
  font-size: 16px;
}

.spin {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
