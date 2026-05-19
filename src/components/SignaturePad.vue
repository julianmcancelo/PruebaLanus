<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Shield, Trash2, Upload, FileSignature, CheckCircle } from 'lucide-vue-next';

const emit = defineEmits(['saved']);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const savedSignature = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const hasSignature = ref(false);

onMounted(() => {
  const stored = localStorage.getItem('agente_firma_digital');
  if (stored) {
    savedSignature.value = stored;
    hasSignature.value = true;
  }
  setupCanvas();
});

const setupCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set higher resolution for canvas drawing
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  ctx.scale(2, 2);

  ctx.strokeStyle = '#0f172a'; // slate-900 color
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Handle Touch Events
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });
};

const startDrawing = (e: MouseEvent) => {
  isDrawing.value = true;
  draw(e);
};

const stopDrawing = () => {
  isDrawing.value = false;
  const canvas = canvasRef.value;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx?.beginPath(); // reset path
  }
};

const draw = (e: MouseEvent) => {
  if (!isDrawing.value) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
};

const clearCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const saveSignatureFromCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  // Check if canvas is blank
  const blank = document.createElement('canvas');
  blank.width = canvas.width;
  blank.height = canvas.height;
  if (canvas.toDataURL() === blank.toDataURL()) {
    alert('Por favor, dibuja tu firma antes de guardar.');
    return;
  }

  // Get base64 image data
  const dataURL = canvas.toDataURL('image/png');
  persistSignature(dataURL);
};

const persistSignature = (dataURL: string) => {
  localStorage.setItem('agente_firma_digital', dataURL);
  savedSignature.value = dataURL;
  hasSignature.value = true;
  emit('saved', dataURL);
  clearCanvas();
};

const handleFileUpload = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;
  
  const file = files[0];
  const reader = new FileReader();
  reader.onload = () => {
    persistSignature(reader.result as string);
  };
  reader.readAsDataURL(file);
};

const deleteSignature = () => {
  if (confirm('¿Estás seguro de que quieres eliminar tu firma digital guardada?')) {
    localStorage.removeItem('agente_firma_digital');
    savedSignature.value = null;
    hasSignature.value = false;
    emit('saved', null);
  }
};
</script>

<template>
  <div class="signature-container glass-card animate-fade">
    <div class="tool-header">
      <div class="tool-icon"><FileSignature :size="24" /></div>
      <div>
        <h2>Configuración de Firma Digital</h2>
        <p>Configura tu firma autorizada para estampar actas, certificados y elevaciones oficiales.</p>
      </div>
    </div>

    <div class="grid-layout">
      <!-- Left side: Creation board -->
      <div class="creation-panel">
        <div class="panel-section">
          <h3>Opción A: Dibuja tu firma</h3>
          <p class="section-desc">Usa el mouse, panel táctil o lápiz para firmar en el recuadro blanco.</p>
          
          <div class="canvas-wrapper">
            <canvas 
              ref="canvasRef"
              @mousedown="startDrawing"
              @mouseup="stopDrawing"
              @mouseleave="stopDrawing"
              @mousemove="draw"
              class="signature-canvas"
            ></canvas>
            <div class="canvas-hint">Área para firmar</div>
          </div>
          
          <div class="panel-actions">
            <button class="btn btn-secondary" @click="clearCanvas">
              <Trash2 :size="14" /> Limpiar
            </button>
            <button class="btn btn-primary" @click="saveSignatureFromCanvas">
              Guardar Firma
            </button>
          </div>
        </div>

        <div class="divider-text">o también</div>

        <div class="panel-section">
          <h3>Opción B: Sube una imagen de tu firma</h3>
          <p class="section-desc">Se recomienda una imagen con fondo transparente en formato PNG.</p>
          
          <div class="upload-area" @click="fileInput?.click()">
            <input type="file" ref="fileInput" accept="image/png, image/jpeg" @change="handleFileUpload" style="display: none;" />
            <Upload :size="32" class="upload-icon" />
            <h4>Seleccionar archivo de firma</h4>
            <p>PNG o JPG (máximo 2MB)</p>
          </div>
        </div>
      </div>

      <!-- Right side: Current active signature -->
      <div class="status-panel">
        <div class="panel-section full-height">
          <h3>Firma Activa Guardada</h3>
          <p class="section-desc">Esta es tu firma registrada en el sistema de forma local:</p>
          
          <div v-if="hasSignature && savedSignature" class="active-signature-box animate-fade">
            <div class="verified-badge">
              <CheckCircle :size="16" />
              <span>Firma Autorizada</span>
            </div>
            
            <div class="signature-display">
              <img :src="savedSignature" alt="Firma Digital Guardada" />
            </div>

            <button class="btn btn-danger" style="margin-top: auto; width: 100%;" @click="deleteSignature">
              <Trash2 :size="14" /> Eliminar Firma
            </button>
          </div>
          
          <div v-else class="empty-signature-box">
            <Shield :size="48" class="shield-icon" />
            <h4>Sin Firma Registrada</h4>
            <p>Dibuja o sube una firma digital para comenzar a aplicarla automáticamente en las actas de inspección.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signature-container {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
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

.grid-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 40px;
  margin-top: 8px;
}

.creation-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-section {
  background: #f8fafc;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-section h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.section-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2.2;
  border-radius: 12px;
  border: 2px dashed var(--border-light);
  background: white;
  overflow: hidden;
}

.signature-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
  background: transparent;
}

.canvas-hint {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.3);
  pointer-events: none;
  text-transform: uppercase;
}

.panel-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.divider-text {
  text-align: center;
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  position: relative;
}

.divider-text::before,
.divider-text::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 38%;
  height: 1px;
  background: var(--border-light);
}

.divider-text::before { left: 0; }
.divider-text::after { right: 0; }

.upload-area {
  border: 2px dashed var(--border-light);
  border-radius: 12px;
  background: white;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-area:hover {
  border-color: var(--primary);
  background: #fcfdfe;
}

.upload-icon {
  color: var(--primary);
  opacity: 0.8;
}

.upload-area h4 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.upload-area p {
  font-size: 12px;
  color: var(--text-muted);
}

/* Status Panel */
.status-panel {
  display: flex;
  flex-direction: column;
}

.panel-section.full-height {
  height: 100%;
}

.active-signature-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border-radius: 12px;
  border: 1px solid #bbf7d0;
  padding: 24px;
  gap: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #dcfce7;
  color: #16a34a;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.signature-display {
  flex: 1;
  width: 100%;
  max-height: 160px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06);
}

.signature-display img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.empty-signature-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  gap: 16px;
  border: 1px dashed var(--border-light);
  background: white;
  border-radius: 12px;
}

.shield-icon {
  color: var(--text-muted);
  opacity: 0.4;
}

.empty-signature-box h4 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.empty-signature-box p {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 260px;
  line-height: 1.4;
}
</style>
