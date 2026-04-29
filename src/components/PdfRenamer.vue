<script setup lang="ts">
import { ref } from 'vue';
import { FileSearch, Loader2, Download, FileText, CheckCircle, AlertCircle, RefreshCcw, Archive, Trash2 } from 'lucide-vue-next';
import * as pdfjsLib from 'pdfjs-dist';
import axios from 'axios';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface RenameJob {
  id: string;
  originalFile: File;
  suggestedName: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

const queue = ref<RenameJob[]>([]);
const isGlobalProcessing = ref(false);

const handleFileUpload = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;
  addFilesToQueue(Array.from(files));
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (files) addFilesToQueue(Array.from(files));
};

const addFilesToQueue = (files: File[]) => {
  const newJobs = files.filter(f => f.type === 'application/pdf').map(file => ({
    id: Math.random().toString(36).substr(2, 9),
    originalFile: file,
    suggestedName: null,
    status: 'pending' as const
  }));
  queue.value.push(...newJobs);
  processQueue();
};

const processQueue = async () => {
  if (isGlobalProcessing.value) return;
  isGlobalProcessing.value = true;

  for (const job of queue.value) {
    if (job.status !== 'pending') continue;
    await processJob(job);
  }

  isGlobalProcessing.value = false;
};

const processJob = async (job: RenameJob) => {
  job.status = 'processing';
  try {
    const arrayBuffer = await job.originalFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1];

    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Suggest a professional filename for this document. Return ONLY the name without extension. Use UPPERCASE and underscores. Format example: TYPE_IDENTIFIER_NAME.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Suggest a filename.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
            ]
          }
        ],
        max_tokens: 30
      },
      { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` } }
    );

    let name = response.data.choices[0].message.content.trim();
    job.suggestedName = name.replace(/[^a-zA-Z0-9_]/g, "_") + ".pdf";
    job.status = 'done';
  } catch (err: any) {
    job.status = 'error';
    if (err.response?.data?.error?.message) {
      job.error = `IA: ${err.response.data.error.message}`;
    } else if (err.message) {
      job.error = err.message;
    } else {
      job.error = "Error desconocido";
    }
    console.error(`Error procesando ${job.originalFile.name}:`, err);
  }
};

const downloadAll = async () => {
  const zip = new JSZip();
  const completedJobs = queue.value.filter(j => j.status === 'done');
  
  for (const job of completedJobs) {
    zip.file(job.suggestedName!, job.originalFile);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = "ARCHIVOS_RENOMBRADOS.zip";
  a.click();
  URL.revokeObjectURL(url);
};

const downloadSingle = (job: RenameJob) => {
  const url = URL.createObjectURL(job.originalFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = job.suggestedName!;
  a.click();
  URL.revokeObjectURL(url);
};

const removeJob = (id: string) => {
  queue.value = queue.value.filter(j => j.id !== id);
};

const reset = () => {
  queue.value = [];
};
</script>

<template>
  <div class="tool-container glass-card animate-fade">
    <div class="tool-header">
      <div class="tool-icon"><FileSearch :size="24" /></div>
      <div>
        <h2>Renombrador Inteligente Masivo</h2>
        <p>Sube uno o más PDFs y la IA les asignará nombres oficiales automáticamente.</p>
      </div>
    </div>

    <div 
      class="upload-area" 
      @click="$refs.fileInput.click()"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <input type="file" ref="fileInput" multiple accept="application/pdf" @change="handleFileUpload" style="display: none" />
      <FileText :size="48" class="upload-icon" />
      <h3>Arrastra o haz clic para subir múltiples PDFs</h3>
      <p>DNI, Títulos, Antecedentes, etc.</p>
    </div>

    <div v-if="queue.length > 0" class="queue-section">
      <div class="queue-header">
        <h3>Lista de Procesamiento ({{ queue.length }})</h3>
        <div class="queue-actions">
          <button v-if="queue.some(j => j.status === 'done')" class="btn btn-primary btn-sm" @click="downloadAll">
            <Archive :size="16" /> Descargar ZIP
          </button>
          <button class="btn btn-secondary btn-sm" @click="reset">
            <Trash2 :size="16" /> Limpiar Todo
          </button>
        </div>
      </div>

      <div class="job-list">
        <div v-for="job in queue" :key="job.id" class="job-card" :class="job.status">
          <div class="job-icon">
            <Loader2 v-if="job.status === 'processing'" class="spin" :size="20" />
            <FileText v-else-if="job.status === 'pending'" :size="20" />
            <CheckCircle v-else-if="job.status === 'done'" :size="20" class="text-success" />
            <AlertCircle v-else :size="20" class="text-danger" />
          </div>
          
          <div class="job-info">
            <span class="original-name">{{ job.originalFile.name }}</span>
            <div v-if="job.status === 'done'" class="rename-row">
              <span class="arrow">→</span>
              <input v-model="job.suggestedName" class="suggested-input" />
            </div>
            <span v-else-if="job.status === 'processing'" class="status-text">Procesando...</span>
            <span v-else-if="job.status === 'error'" class="status-text error">
              {{ job.error }}
              <button class="retry-btn" @click="processJob(job)">Reintentar</button>
            </span>
          </div>

          <div class="job-actions">
            <button v-if="job.status === 'done'" class="btn-icon" @click="downloadSingle(job)" title="Descargar">
              <Download :size="18" />
            </button>
            <button class="btn-icon" @click="removeJob(job.id)" title="Eliminar">
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-container { padding: 32px; display: flex; flex-direction: column; gap: 24px; max-width: 900px; margin: 0 auto; min-height: 500px; }
.tool-header { display: flex; align-items: center; gap: 16px; }
.tool-icon { background: var(--primary); padding: 12px; border-radius: 12px; display: flex; }
.upload-area { border: 2px dashed var(--glass-border); border-radius: 16px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; }
.upload-area:hover { border-color: var(--primary); background: rgba(99, 102, 241, 0.05); }

.queue-section { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
.queue-header { display: flex; justify-content: space-between; align-items: center; }
.queue-actions { display: flex; gap: 12px; }
.btn-sm { padding: 8px 12px; font-size: 13px; }

.job-list { display: flex; flex-direction: column; gap: 10px; }
.job-card { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 16px; transition: all 0.2s; }
.job-card.processing { border-color: var(--primary); background: rgba(99, 102, 241, 0.05); }
.job-card.done { border-color: var(--accent); background: rgba(16, 185, 129, 0.05); }

.job-icon { display: flex; }
.job-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.original-name { font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rename-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.arrow { color: var(--accent); font-weight: bold; }
.suggested-input { background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 2px 8px; color: white; font-size: 14px; font-weight: 600; width: 100%; }
.status-text { font-size: 12px; margin-top: 4px; }
.status-text.error { color: var(--danger); display: flex; align-items: center; gap: 8px; }
.retry-btn { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--danger); padding: 2px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; text-transform: uppercase; font-weight: 700; }
.retry-btn:hover { background: var(--danger); color: white; }

.job-actions { display: flex; gap: 8px; }
.btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.2s; }
.btn-icon:hover { color: white; background: rgba(255,255,255,0.05); }

.spin { animation: rotate 1s linear infinite; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
