<script setup lang="ts">
import { ref } from 'vue';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, Trash2, Database, Car, Users, Filter } from 'lucide-vue-next';
import { extractDniData } from '../services/dniService';
import { extractTitleData } from '../services/titleService';
import { savePerson, saveTitle } from '../services/dbService';
import { pdfToImages } from '../services/pdfService';

const files = ref<File[]>([]);
const results = ref<any[]>([]);
const isProcessing = ref(false);
const progress = ref(0);
const currentFile = ref('');
const selectedType = ref<'auto' | 'dni' | 'title'>('auto');

const emit = defineEmits(['saved']);

const onFileSelect = (e: any) => {
  const selectedFiles = Array.from(e.target.files) as File[];
  files.value = [...files.value, ...selectedFiles];
};

const onFileDrop = (e: DragEvent) => {
  const droppedFiles = Array.from(e.dataTransfer?.files || []) as File[];
  files.value = [...files.value, ...droppedFiles];
};

const removeFile = (index: number) => {
  files.value.splice(index, 1);
};

// Función para redimensionar imágenes y evitar el error 400 (Payload Too Large)
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200; // Resolución suficiente para OCR

        if (width > height && width > maxDim) {
          height = (height * maxDim) / width;
          width = maxDim;
        } else if (height > maxDim) {
          width = (width * maxDim) / height;
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const processFiles = async () => {
  if (files.value.length === 0) return;
  isProcessing.value = true;
  results.value = [];
  progress.value = 0;

  for (let i = 0; i < files.value.length; i++) {
    const file = files.value[i];
    currentFile.value = file.name;
    progress.value = Math.round((i / files.value.length) * 100);

    try {
      let base64s: string[] = [];
      
      if (file.type === 'application/pdf') {
        const buffer = await file.arrayBuffer();
        base64s = await pdfToImages(buffer);
      } else if (file.type.startsWith('image/')) {
        const base64 = await resizeImage(file);
        base64s = [base64];
      } else {
        results.value.push({ fileName: file.name, status: 'error', error: 'Formato no soportado' });
        continue;
      }

      let data: any = null;
      let type = selectedType.value;

      // Auto-detección si está en auto
      if (type === 'auto') {
        type = file.name.toLowerCase().includes('dni') ? 'dni' : 'title';
      }

      if (type === 'dni') {
        // Para DNI masivo, asumimos que cada archivo es un DNI (frente o ambos en PDF)
        data = await extractDniData(base64s[0], base64s[1] || base64s[0]);
        results.value.push({ fileName: file.name, type: 'person', data, status: 'success' });
      } else {
        data = await extractTitleData(base64s);
        results.value.push({ fileName: file.name, type: 'title', data, status: 'success' });
      }
    } catch (error: any) {
      console.error('Error processing file:', file.name, error);
      results.value.push({ 
        fileName: file.name, 
        status: 'error', 
        error: error.response?.status === 400 ? 'Imagen inválida o muy grande' : 'Error de conexión' 
      });
    }
  }

  progress.value = 100;
  isProcessing.value = false;
  currentFile.value = 'Procesamiento completado';
};

const saveAll = async () => {
  isProcessing.value = true;
  let count = 0;
  let dupCount = 0;
  for (const res of results.value) {
    if (res.status === 'success') {
      if (res.type === 'person') {
        const result = await savePerson(res.data);
        if (result.isDuplicate) dupCount++;
      } else if (res.type === 'title') {
        const result = await saveTitle(res.data);
        if (result.isDuplicate) dupCount++;
      }
      count++;
    }
  }
  isProcessing.value = false;
  let msg = `¡${count} registros procesados!`;
  if (dupCount > 0) msg += ` (${dupCount} eran duplicados, se actualizaron)`;
  alert(msg);
  emit('saved');
  results.value = [];
  files.value = [];
};
</script>

<template>
  <div class="bulk-scanner animate-fade">
    <div class="section-header">
      <div class="title-group">
        <h2>Carga Masiva de Documentos</h2>
        <p>Sube múltiples fotos para procesarlas automáticamente con IA.</p>
      </div>
      <div class="header-actions" v-if="results.length > 0">
        <button class="btn btn-primary" @click="saveAll" :disabled="isProcessing">
          <Database :size="16" /> Guardar Todo ({{ results.filter(r => r.status === 'success').length }})
        </button>
      </div>
    </div>

    <!-- Dropzone and Config -->
    <div v-if="results.length === 0" class="dropzone-container">
      <div class="bulk-config glass-card">
        <div class="config-label"><Filter :size="16" /> ¿Qué vas a subir?</div>
        <div class="config-options">
          <label class="option-pill" :class="{ active: selectedType === 'auto' }">
            <input type="radio" v-model="selectedType" value="auto" /> Auto-Detectar
          </label>
          <label class="option-pill" :class="{ active: selectedType === 'dni' }">
            <input type="radio" v-model="selectedType" value="dni" /> Carpeta de DNIs
          </label>
          <label class="option-pill" :class="{ active: selectedType === 'title' }">
            <input type="radio" v-model="selectedType" value="title" /> Carpeta de Títulos
          </label>
        </div>
      </div>

      <div 
        class="dropzone" 
        @click="$refs.fileInput.click()"
        @dragover.prevent
        @drop.prevent="onFileDrop"
      >
        <input type="file" ref="fileInput" multiple @change="onFileSelect" style="display: none" accept="image/*" />
        <div class="drop-icon"><Upload :size="48" /></div>
        <h3>Arrastra archivos aquí o haz clic</h3>
        <p>Se recomienda subir fotos claras de una sola cara del documento</p>
      </div>

      <div v-if="files.length > 0" class="file-list glass-card">
        <div class="file-list-header">
          <span>{{ files.length }} archivos listos</span>
          <button class="btn-text" @click="files = []">Limpiar</button>
        </div>
        <div class="files-grid">
          <div v-for="(file, idx) in files" :key="idx" class="file-item">
            <FileText :size="16" />
            <span class="file-name">{{ file.name }}</span>
            <button class="remove-btn" @click="removeFile(idx)"><Trash2 :size="14" /></button>
          </div>
        </div>
        <button class="btn btn-primary w-full" @click="processFiles" :disabled="isProcessing">
          <Loader2 v-if="isProcessing" class="spin" :size="18" />
          {{ isProcessing ? 'Escaneando...' : 'Iniciar Procesamiento Masivo' }}
        </button>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="isProcessing && progress < 100" class="progress-overlay">
      <div class="progress-card glass-card">
        <Loader2 class="spin" :size="48" />
        <h3>Extrayendo información...</h3>
        <p class="file-name-progress">{{ currentFile }}</p>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ progress }}%</span>
      </div>
    </div>

    <!-- Results Table -->
    <div v-if="results.length > 0" class="results-container glass-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Archivo</th>
            <th>Tipo</th>
            <th>Información Extraída</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(res, idx) in results" :key="idx">
            <td><div class="file-cell"><FileText :size="14" /> {{ res.fileName }}</div></td>
            <td>
              <div v-if="res.status === 'success'" class="type-badge" :class="res.type">
                {{ res.type === 'person' ? 'DNI' : 'Título' }}
              </div>
            </td>
            <td>
              <div v-if="res.status === 'success'" class="data-preview">
                <span v-if="res.type === 'person'">{{ res.data.surname }}, {{ res.data.names }}</span>
                <span v-else>{{ res.data.dominio }} ({{ res.data.marca }})</span>
              </div>
              <div v-else class="error-text">{{ res.error }}</div>
            </td>
            <td>
              <CheckCircle2 v-if="res.status === 'success'" class="text-success" :size="20" />
              <AlertCircle v-else class="text-danger" :size="20" />
            </td>
          </tr>
        </tbody>
      </table>
      <div class="footer-actions">
        <button class="btn btn-secondary" @click="results = []">Cargar más archivos</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bulk-scanner { padding: 0; }
.dropzone-container { display: flex; flex-direction: column; gap: 16px; }

.bulk-config {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.config-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
}

.config-options { display: flex; gap: 8px; }

.option-pill {
  padding: 8px 16px;
  border-radius: 10px;
  background: #f1f5f9;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border-light);
}

.option-pill.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.option-pill input { display: none; }

.dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.dropzone:hover { border-color: var(--primary); background: var(--primary-light); }
.drop-icon { color: var(--primary); margin-bottom: 12px; }
.dropzone h3 { font-size: 16px; margin-bottom: 4px; }
.dropzone p { color: var(--text-muted); font-size: 13px; }

.file-list { padding: 16px; }
.file-list-header { display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 700; font-size: 13px; }
.btn-text { background: none; border: none; color: var(--danger); font-weight: 700; cursor: pointer; }

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  border: 1px solid var(--border-light);
}

.file-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.remove-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }

.progress-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.progress-card { width: 340px; padding: 32px; text-align: center; }
.file-name-progress { font-size: 13px; color: var(--text-muted); margin-top: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.progress-bar-container { height: 6px; background: #f1f5f9; border-radius: 3px; margin: 20px 0 8px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: var(--primary); transition: width 0.3s ease; }
.progress-text { font-weight: 800; color: var(--primary); font-size: 14px; }

.results-container { padding: 0; }
.file-cell { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; }
.type-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; }
.type-badge.person { background: #e0e7ff; color: #4338ca; }
.type-badge.title { background: #fef3c7; color: #92400e; }
.data-preview { font-size: 13px; font-weight: 600; }
.error-text { color: var(--danger); font-size: 11px; font-weight: 700; }
.footer-actions { padding: 12px 20px; background: #f8fafc; border-top: 1px solid var(--border-light); }
.text-success { color: var(--accent); }
.text-danger { color: var(--danger); }
.w-full { width: 100%; justify-content: center; }
</style>
