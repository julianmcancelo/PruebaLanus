<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, FileText, User, Car, Hash, Save, Edit2, Calendar, School, Mail, Phone, AlertTriangle, Printer, ClipboardCheck, FileDown, FileSignature, Gavel, MapPin, Clock, CheckCircle2, AlertCircle, Shield, Users, UploadCloud, Trash2, ExternalLink } from 'lucide-vue-next';
import { uploadResolucion, deleteResolucion } from '../services/dbService';

const props = defineProps<{
  hab: any | null,
  linkedPerson?: any,
  linkedTitle?: any,
  personVehicles?: any[],
  occupiedDominios?: string[],
  people?: any[],
  schools?: any[]
}>();

const emit = defineEmits(['close', 'update', 'print', 'print-inspection', 'print-inspection-excel', 'generate-resolution', 'generate-elevacion', 'generate-resolution-pdf', 'generate-elevacion-pdf']);

const isEditing = ref(false);
const editedHab = ref<any>(null);

const getEstados = (tipo: string) => {
  if (tipo === 'Punto Inicial - Terminal') {
    return [
      'Tribunal de Faltas - Emite Informe Libre Deuda',
      'Dir. Gral. de Movilidad y Transporte - Inspección',
      'Dir Gral Mov y Transp - Certifica Documentación',
      'Dir Gral Mov y Transporte - Emite Constancia',
      'S Seguridad y Ord. Urbano - Fima Constancia',
      'Dir Gral Mov y Transp-Entrega Constancia y Archiva'
    ];
  }
  if (tipo === 'Escolar') {
    return [
      'Dir. Mov y Transporte - Verifica Doc. y Sellados',
      'Tribunal de Faltas - Informe Libre Deuda',
      'P1 Dir. Mov. y Transporte - Informe Psicotécnico',
      'P1 Dir. Mov y Transporte - Informe Vehicular',
      'Dir. Mov. y Transporte - Verifica Informes',
      'Dir. Mov. y Transporte - Confecciona Resolución',
      'S Legal y Técnica - Revisión',
      'S Legal y Técnica - Prepara Res. para la Firma',
      'S S Ordenamiento Urbano - Firma Resolución',
      'S Legal y Técnica - Control Resolución',
      'S Seguridad y Ord Urbano - Firma Resolución',
      'S Legal y Técnica - Protocoliza Resolución',
      'Dir Mov y Transp - Notifica, Entrega Cred. y Resol'
    ];
  }
  return [
    'Iniciado',
    'Resolución Armada',
    'Tribunal de Faltas',
    'Resolución Formada',
    'Trámite Finalizado'
  ];
};

const estadoClass = (estado: string, tipo?: string) => {
  if (!estado) return 'iniciado';
  const activeTipo = tipo || props.hab?.tipoHabilitacion || '';
  if (activeTipo === 'Punto Inicial - Terminal') {
    const idx = getEstados(activeTipo).indexOf(estado);
    switch (idx) {
      case 0: return 'iniciado';
      case 1: return 'resolucion-armada';
      case 2: return 'tribunal-faltas';
      case 3: return 'resolucion-formada';
      case 4: return 'firma-constancia';
      case 5: return 'tramite-finalizado';
      default: return 'iniciado';
    }
  }
  if (activeTipo === 'Escolar') {
    const idx = getEstados(activeTipo).indexOf(estado);
    if (idx === 0) return 'iniciado';
    if (idx >= 1 && idx <= 3) return 'resolucion-armada';
    if (idx === 4) return 'tribunal-faltas';
    if (idx >= 5 && idx <= 10) return 'resolucion-formada';
    if (idx === 11) return 'tramite-finalizado';
    return 'iniciado';
  }
  switch (estado) {
    case 'Resolución Armada': return 'resolucion-armada';
    case 'Tribunal de Faltas': return 'tribunal-faltas';
    case 'Resolución Formada': return 'resolucion-formada';
    case 'Trámite Finalizado': return 'tramite-finalizado';
    default: return 'iniciado';
  }
};

const getStepDescription = (step: string) => {
  switch (step) {
    case 'Iniciado': return 'Expediente ingresado';
    case 'Resolución Armada': return 'Se armó borrador';
    case 'Tribunal de Faltas': return 'Pasó por Tribunal';
    case 'Resolución Formada': return 'Se firmó la resolución';
    case 'Trámite Finalizado': return 'Trámite finalizado';
    
    // Punto Inicial - Terminal stages:
    case 'Tribunal de Faltas - Emite Informe Libre Deuda': return 'Libre deuda emitido';
    case 'Dir. Gral. de Movilidad y Transporte - Inspección': return 'Inspección de puntos aprobada';
    case 'Dir Gral Mov y Transp - Certifica Documentación': return 'Documentación certificada';
    case 'Dir Gral Mov y Transporte - Emite Constancia': return 'Constancia confeccionada';
    case 'S Seguridad y Ord. Urbano - Fima Constancia': return 'Constancia firmada digitalmente';
    case 'Dir Gral Mov y Transp-Entrega Constancia y Archiva': return 'Constancia entregada y archivada';
    
    // Escolar stages:
    case 'Dir. Mov y Transporte - Verifica Doc. y Sellados': return 'Verificación de doc. y sellados';
    case 'Tribunal de Faltas - Informe Libre Deuda': return 'Informe de libre deuda';
    case 'P1 Dir. Mov. y Transporte - Informe Psicotécnico': return 'Informe psicotécnico aprobado';
    case 'P1 Dir. Mov y Transporte - Informe Vehicular': return 'Informe vehicular aprobado';
    case 'Dir. Mov. y Transporte - Verifica Informes': return 'Verificación de informes';
    case 'Dir. Mov. y Transporte - Confecciona Resolución': return 'Confección de borrador de resolución';
    case 'S Legal y Técnica - Revisión': return 'Revisión en Secretaría Legal y Técnica';
    case 'S Legal y Técnica - Prepara Res. para la Firma': return 'Resolución preparada para la firma';
    case 'S S Ordenamiento Urbano - Firma Resolución': return 'Firma de Resolución (Ordenamiento Urbano)';
    case 'S Legal y Técnica - Control Resolución': return 'Control de resolución finalizado';
    case 'S Seguridad y Ord Urbano - Firma Resolución': return 'Resolución firmada por el Secretario';
    case 'S Legal y Técnica - Protocoliza Resolución': return 'Resolución protocolizada legalmente';
    case 'Dir Mov y Transp - Notifica, Entrega Cred. y Resol': return 'Notificación, entrega de credencial y archivo';
    
    default: return 'Paso administrativo';
  }
};

const startEditing = () => {
  editedHab.value = { 
    ...props.hab,
    idColegios: props.hab.idColegios || []
  };
  isEditing.value = true;
};

const getPersonName = (id: any) => {
  if (!id) return '---';
  const p = props.people?.find(p => String(p.id) === String(id));
  return p ? `${p.surname}, ${p.names}` : '---';
};

const getSchoolName = (id: any) => {
  if (!id) return '---';
  const s = props.schools?.find(s => String(s.id) === String(id));
  return s ? s.nombre : '---';
};

const toggleSchool = (id: any) => {
  if (!editedHab.value.idColegios) editedHab.value.idColegios = [];
  const strId = String(id);
  const idx = editedHab.value.idColegios.findIndex((i: any) => String(i) === strId);
  if (idx > -1) editedHab.value.idColegios.splice(idx, 1);
  else editedHab.value.idColegios.push(id);
};

const toggleGestdoc = () => {
  if (isEditing.value) {
    if (editedHab.value) {
      editedHab.value.cargadoGestdoc = !editedHab.value.cargadoGestdoc;
    }
  } else {
    const updated = { ...props.hab, cargadoGestdoc: !props.hab.cargadoGestdoc };
    emit('update', updated);
  }
};

const selectVehicle = (dominio: string) => {
  if (isEditing.value) {
    editedHab.value.dominio = dominio;
  } else {
    const updated = { ...props.hab, dominio };
    emit('update', updated);
  }
};

const isOccupied = (dominio: string) => {
  if (!props.occupiedDominios) return false;
  return props.occupiedDominios.includes(dominio.replace(/\W/g, '').toUpperCase());
};

const handleSave = () => {
  emit('update', editedHab.value);
  isEditing.value = false;
};

const isUploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  
  isUploading.value = true;
  try {
    const res = await uploadResolucion(props.hab.id, file);
    const updatedHab = { 
      ...props.hab, 
      resolucionFile: {
        name: res.name,
        url: res.url,
        storagePath: `resoluciones/resolucion_${props.hab.id}_${Date.now()}.${file.name.split('.').pop()}`, // This is a bit of a hack since dbService generates it inside, but dbService updates it. So we can just fetch or pass the returned object.
        // Actually, dbService already updates it in Firestore, but we need to update the UI instantly. Let's just emit the update.
        // Wait, dbService.updateHabilitacion does it. The listener in App.vue might pick it up automatically if we are using onSnapshot. 
        // We use Dexie/Firestore mix. Let's just emit it.
      }
    };
    updatedHab.resolucionFile.storagePath = `resoluciones/` + res.url.split('resoluciones%2F')[1]?.split('?')[0]; // best effort extract
    
    emit('update', updatedHab);
  } catch(error) {
    console.error(error);
    alert('Error al subir el archivo. Revisa los permisos de Firebase Storage.');
  } finally {
    isUploading.value = false;
    if (target) target.value = ''; // reset
  }
};

const handleDeleteResolucion = async () => {
  if (!confirm('¿Seguro que deseas eliminar la resolución adjunta?')) return;
  try {
    await deleteResolucion(props.hab.id, props.hab.resolucionFile.storagePath);
    const updatedHab = { ...props.hab };
    delete updatedHab.resolucionFile;
    emit('update', updatedHab);
  } catch(error) {
    console.error(error);
    alert('Error al borrar el archivo');
  }
};

const sendEmail = () => {
  const email = props.hab.email || props.linkedPerson?.email;
  if (!email) {
    alert('El titular no tiene un correo electrónico registrado. Por favor, editá el titular y agregá uno.');
    return;
  }
  const subject = encodeURIComponent(`Resolución de Habilitación - Exp ${props.hab.nroExpediente || ''}`);
  const body = encodeURIComponent(
    `Hola ${props.linkedPerson?.surname || props.hab.titular || ''},\n\n` +
    `Adjuntamos el enlace para descargar la Resolución de su habilitación correspondiente al dominio ${props.hab.dominio || ''}:\n\n` +
    `${props.hab.resolucionFile.url}\n\n` +
    `Saludos cordiales,\nDirección de Movilidad y Transporte`
  );
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
};

const habStatus = computed(() => {
  const issues: string[] = [];
  if (!props.hab.email) issues.push('Email');
  if (!props.hab.phone) issues.push('Teléfono');
  if (!props.linkedPerson) issues.push('Titular no vinculado');
  if (!props.linkedTitle) issues.push('Vehículo no vinculado');
  
  if (issues.length === 0) return { label: 'Completa', icon: CheckCircle2, color: 'success' };
  if (issues.length <= 2) return { label: `${issues.length} pendientes`, icon: AlertCircle, color: 'warning' };
  return { label: `${issues.length} pendientes`, icon: AlertTriangle, color: 'danger' };
});

const linkedSchools = computed(() => {
  if (!props.hab?.idColegios) return [];
  return props.hab.idColegios.map((id: any) => props.schools?.find(s => String(s.id) === String(id))).filter(Boolean);
});
</script>

<template>
  <div v-if="hab" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content animate-fade">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-top">
          <div class="header-main">
            <div class="exp-icon">
              <FileText :size="28" />
            </div>
            <div class="exp-info">
              <template v-if="!isEditing">
                <h2>{{ hab.nroExpediente || 'Sin Expediente' }}</h2>
                <div class="exp-type-row">
                  <span class="exp-type">{{ hab.tipoTramite || 'Habilitación' }}</span>
                  <span v-if="hab.tipoHabilitacion" class="type-badge-inline" :class="hab.tipoHabilitacion.toLowerCase().replace(/[^a-z0-9]+/g, '-')">
                    {{ hab.tipoHabilitacion }}
                  </span>
                </div>
              </template>
              <template v-else>
                <input v-model="editedHab.nroExpediente" class="input-field-header" placeholder="N° Expediente" />
                <div class="type-toggle-group">
                  <button :class="{ active: editedHab.tipoHabilitacion === 'Escolar' }" @click="editedHab.tipoHabilitacion = 'Escolar'">Escolar</button>
                  <button :class="{ active: editedHab.tipoHabilitacion === 'Remis' }" @click="editedHab.tipoHabilitacion = 'Remis'">Remis</button>
                  <button :class="{ active: editedHab.tipoHabilitacion === 'Punto Inicial - Terminal' }" @click="editedHab.tipoHabilitacion = 'Punto Inicial - Terminal'">Punto Inicial / Terminal</button>
                </div>
              </template>
            </div>
          </div>
          <div class="header-actions">
            <div class="status-badge" :class="habStatus.color">
              <component :is="habStatus.icon" :size="14" />
              <span>{{ habStatus.label }}</span>
            </div>
            <button v-if="!isEditing" class="btn-icon" @click="startEditing" title="Editar">
              <Edit2 :size="16" />
            </button>
            <button class="btn-icon close" @click="$emit('close')" title="Cerrar">
              <X :size="18" />
            </button>
          </div>
        </div>
        
        <!-- Quick Info Bar -->
        <div class="quick-info">
          <div class="info-chip">
            <Calendar :size="14" />
            <span v-if="!isEditing">Licencia: <strong>{{ hab.nroLicencia || '---' }}</strong></span>
            <span v-else style="display: flex; align-items: center; gap: 4px;">
              Licencia: <input v-model="editedHab.nroLicencia" style="font-size: 13px; font-weight: 700; width: 110px; padding: 2px 6px; border-radius: 6px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; outline: none;" placeholder="N° Licencia" />
            </span>
          </div>
          <div v-if="hab.dominio" class="info-chip dominio">
            <Car :size="14" />
            <span><strong>{{ hab.dominio }}</strong></span>
          </div>
          <div 
            class="info-chip gestdoc-chip" 
            :class="{ 'cargado': isEditing ? (editedHab && editedHab.cargadoGestdoc) : hab.cargadoGestdoc }"
            @click="toggleGestdoc"
            :title="isEditing ? 'Click para cambiar estado GestDoc' : 'Click para cambiar estado GestDoc'"
          >
            <CheckCircle2 v-if="isEditing ? (editedHab && editedHab.cargadoGestdoc) : hab.cargadoGestdoc" :size="14" />
            <AlertCircle v-else :size="14" />
            <span>GestDoc: <strong>{{ (isEditing ? (editedHab && editedHab.cargadoGestdoc) : hab.cargadoGestdoc) ? 'Cargado' : 'Pendiente' }}</strong></span>
          </div>
          <div class="info-chip estado-chip" :class="estadoClass(isEditing ? (editedHab && editedHab.estado) : hab.estado)">
            <Gavel :size="14" />
            <span v-if="!isEditing">Estado: <strong>{{ hab.estado || 'Iniciado' }}</strong></span>
            <span v-else style="display: inline-flex; align-items: center; gap: 4px;">
              Estado: 
              <select v-model="editedHab.estado" class="estado-select-header">
                <option v-for="est in getEstados(editedHab.tipoHabilitacion)" :key="est" :value="est">
                  {{ est }}
                </option>
              </select>
            </span>
          </div>
          <div v-if="linkedSchools.length > 0" class="info-chip schools">
            <School :size="14" />
            <span>{{ linkedSchools.length }} colegio{{ linkedSchools.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-body">
        <!-- Section: Estado del Trámite -->
        <div class="data-section estado-seccion">
          <div class="section-header">
            <div class="section-icon orange">
              <ClipboardCheck :size="18" />
            </div>
            <h3>Estado del Trámite</h3>
          </div>
          
          <div class="status-timeline">
            <div 
              v-for="step in getEstados(isEditing ? editedHab.tipoHabilitacion : hab.tipoHabilitacion)"
              :key="step"
              class="timeline-step"
              :class="{ 
                'active': (isEditing ? editedHab.estado : hab.estado) === step || (!(isEditing ? editedHab.estado : hab.estado) && step === getEstados(isEditing ? editedHab.tipoHabilitacion : hab.tipoHabilitacion)[0]),
                'clickable': isEditing
              }"
              @click="isEditing && (editedHab.estado = step)"
            >
              <div class="step-indicator">
                <CheckCircle2 v-if="(isEditing ? editedHab.estado : hab.estado) === step || (!(isEditing ? editedHab.estado : hab.estado) && step === getEstados(isEditing ? editedHab.tipoHabilitacion : hab.tipoHabilitacion)[0])" :size="16" />
                <div v-else class="step-dot"></div>
              </div>
              <div class="step-content">
                <div class="step-title">{{ step }}</div>
                <div class="step-desc">
                  {{ getStepDescription(step) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Resolución Adjunta -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon blue">
              <FileSignature :size="18" />
            </div>
            <h3>Resolución Adjunta</h3>
          </div>
          
          <div v-if="hab.resolucionFile" class="linked-card success" style="align-items: center;">
            <div class="linked-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 12px; border-radius: 12px;">
              <FileText :size="24" />
            </div>
            <div class="linked-content" style="flex: 1;">
              <div class="linked-name">{{ hab.resolucionFile.name }}</div>
              <div class="linked-meta">
                <span class="meta-item"><Clock :size="12" /> Subido el {{ new Date(hab.resolucionFile.uploadedAt).toLocaleDateString() }}</span>
              </div>
            </div>
            <div class="actions" style="display: flex; gap: 8px;">
              <a :href="hab.resolucionFile.url" target="_blank" class="action-btn-small primary" title="Ver archivo">
                <ExternalLink :size="16" />
              </a>
              <button @click="sendEmail" class="action-btn-small" style="background: #e0e7ff; color: #4338ca; border: none; padding: 8px; border-radius: 8px; cursor: pointer;" title="Enviar por Email">
                <Mail :size="16" />
              </button>
              <button @click="handleDeleteResolucion" class="action-btn-small danger" style="background: #fee2e2; color: #dc2626; border: none; padding: 8px; border-radius: 8px; cursor: pointer;" title="Eliminar archivo">
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
          
          <div v-else class="unlinked-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; border: 2px dashed #cbd5e1; background: #f8fafc; cursor: pointer;" @click="triggerFileUpload">
            <input type="file" ref="fileInput" @change="handleFileUpload" accept=".pdf,.doc,.docx,image/*" style="display: none" />
            <UploadCloud :size="32" style="color: #64748b; margin-bottom: 8px;" />
            <div style="font-weight: 600; color: #334155;">Subir Resolución</div>
            <small v-if="!isUploading" style="color: #94a3b8; text-align: center;">Hacé clic acá para adjuntar el archivo final (PDF, Word o imagen)</small>
            <small v-else style="color: #3b82f6; font-weight: 600;">Subiendo archivo, por favor esperá...</small>
          </div>
        </div>

        <!-- Section: Titular -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon purple">
              <User :size="18" />
            </div>
            <h3>Titular</h3>
          </div>
          
          <div v-if="linkedPerson" class="linked-card success">
            <div class="linked-avatar">
              {{ linkedPerson.surname?.charAt(0) || 'U' }}{{ linkedPerson.names?.charAt(0) || '' }}
            </div>
            <div class="linked-content">
              <div class="linked-name">{{ linkedPerson.surname }}, {{ linkedPerson.names }}</div>
              <div class="linked-meta">
                <span class="meta-item"><Hash :size="12" /> DNI: {{ linkedPerson.idNumber }}</span>
                <span v-if="linkedPerson.birthDate" class="meta-item"><Calendar :size="12" /> {{ linkedPerson.birthDate }}</span>
              </div>
              <div v-if="linkedPerson.address" class="linked-address">
                <MapPin :size="12" /> {{ linkedPerson.address }}{{ linkedPerson.city ? `, ${linkedPerson.city}` : '' }}
              </div>
            </div>
            <div class="linked-badge success">
              <CheckCircle2 :size="14" />
              Vinculado
            </div>
          </div>
          
          <div v-else class="unlinked-card">
            <AlertCircle :size="20" />
            <div class="unlinked-info">
              <span v-if="!isEditing">{{ hab.titular || 'Sin datos del titular' }}</span>
              <input v-else v-model="editedHab.titular" class="input-field" placeholder="Nombre del titular" />
              <small>No se encontró coincidencia en Personas</small>
            </div>
          </div>
        </div>

        <!-- Section: Vehículo -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon blue">
              <Car :size="18" />
            </div>
            <h3>Vehículo</h3>
          </div>
          
          <div v-if="linkedTitle" class="linked-card success">
            <div class="vehicle-plate">{{ linkedTitle.dominio }}</div>
            <div class="linked-content">
              <div class="linked-name">{{ linkedTitle.marca }} {{ linkedTitle.modelo }}</div>
              <div class="linked-meta">
                <span v-if="linkedTitle.anioModelo" class="meta-item">Año: {{ linkedTitle.anioModelo }}</span>
                <span v-if="linkedTitle.tipo" class="meta-item">{{ linkedTitle.tipo }}</span>
                <span v-if="linkedTitle.motor" class="meta-item">Motor: {{ linkedTitle.motor }}</span>
              </div>
            </div>
            <div class="linked-badge success">
              <CheckCircle2 :size="14" />
              Vinculado
            </div>
          </div>
          
          <div v-else-if="personVehicles && personVehicles.length > 0" class="vehicle-selector">
            <p class="selector-hint">El titular tiene {{ personVehicles.length }} vehículo{{ personVehicles.length > 1 ? 's' : '' }}. Seleccioná uno:</p>
            <div class="vehicle-grid">
              <button 
                v-for="v in personVehicles" 
                :key="v.id" 
                class="vehicle-option"
                :class="{ occupied: isOccupied(v.dominio) }"
                :disabled="isOccupied(v.dominio)"
                @click="selectVehicle(v.dominio)"
              >
                <div class="vehicle-plate-small">{{ v.dominio }}</div>
                <div class="vehicle-desc">{{ v.marca }} {{ v.modelo }}</div>
                <span v-if="isOccupied(v.dominio)" class="occ-badge">Ocupado</span>
              </button>
            </div>
          </div>
          
          <div v-else class="unlinked-card">
            <AlertCircle :size="20" />
            <div class="unlinked-info">
              <span v-if="!isEditing">{{ hab.dominio || 'Sin vehículo asociado' }}</span>
              <input v-else v-model="editedHab.dominio" class="input-field" placeholder="Dominio (patente)" />
              <small>No se encontró coincidencia en Títulos</small>
            </div>
          </div>
        </div>

        <!-- Section: Contacto -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon green">
              <Phone :size="18" />
            </div>
            <h3>Contacto</h3>
          </div>
          
          <div class="contact-grid">
            <div class="contact-item" :class="{ missing: !hab.email }">
              <div class="contact-icon">
                <Mail :size="18" />
              </div>
              <div class="contact-data">
                <label>Email</label>
                <span v-if="!isEditing">{{ hab.email || 'No cargado' }}</span>
                <input v-else v-model="editedHab.email" class="input-field" placeholder="email@ejemplo.com" />
              </div>
              <div v-if="!isEditing && !hab.email" class="missing-tag">
                <AlertTriangle :size="12" /> Faltante
              </div>
            </div>
            
            <div class="contact-item" :class="{ missing: !hab.phone }">
              <div class="contact-icon">
                <Phone :size="18" />
              </div>
              <div class="contact-data">
                <label>Teléfono</label>
                <span v-if="!isEditing">{{ hab.phone || 'No cargado' }}</span>
                <input v-else v-model="editedHab.phone" class="input-field" placeholder="11-1234-5678" />
              </div>
              <div v-if="!isEditing && !hab.phone" class="missing-tag">
                <AlertTriangle :size="12" /> Faltante
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Personal -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon orange">
              <Users :size="18" />
            </div>
            <h3>Personal a Bordo</h3>
          </div>
          
          <div class="staff-grid">
            <div class="staff-card">
              <div class="staff-label">Chofer</div>
              <div v-if="!isEditing" class="staff-value">
                {{ getPersonName(hab.idChofer) }}
              </div>
              <select v-else v-model="editedHab.idChofer" class="input-field">
                <option :value="undefined">Seleccionar...</option>
                <option v-for="p in people" :key="p.id" :value="p.id">{{ p.surname }}, {{ p.names }}</option>
              </select>
            </div>
            
            <div class="staff-card">
              <div class="staff-label">Celador/a</div>
              <div v-if="!isEditing" class="staff-value">
                {{ getPersonName(hab.idCelador) }}
              </div>
              <select v-else v-model="editedHab.idCelador" class="input-field">
                <option :value="undefined">Seleccionar...</option>
                <option v-for="p in people" :key="p.id" :value="p.id">{{ p.surname }}, {{ p.names }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section: Colegios -->
        <div class="data-section">
          <div class="section-header">
            <div class="section-icon indigo">
              <School v-if="hab.tipoHabilitacion !== 'Remis'" :size="18" />
              <Building2 v-else :size="18" />
            </div>
            <h3>{{ hab.tipoHabilitacion === 'Remis' ? 'Agencias Vinculadas' : 'Colegios Vinculados' }}</h3>
          </div>
          
          <div v-if="!isEditing" class="schools-list">
            <div v-if="linkedSchools.length > 0" class="school-item" v-for="school in linkedSchools" :key="school.id">
              <div class="school-icon">
                <School v-if="school.tipo !== 'Remiseria'" :size="16" />
                <Building2 v-else :size="16" />
              </div>
              <div class="school-info">
                <span class="school-name">{{ school.nombre }}</span>
                <span v-if="school.domicilio" class="school-address">{{ school.domicilio }}</span>
              </div>
            </div>
            <div v-else class="empty-state">
              <Building2 v-if="hab.tipoHabilitacion === 'Remis'" :size="24" />
              <School v-else :size="24" />
              <span>Sin {{ hab.tipoHabilitacion === 'Remis' ? 'agencias' : 'colegios' }} vinculados</span>
            </div>
          </div>
          
          <div v-else class="school-selector-grid">
            <button 
              v-for="s in schools" 
              :key="s.id" 
              class="school-chip"
              :class="{ active: editedHab.idColegios?.includes(s.id) }"
              @click="toggleSchool(s.id)"
            >
              <School :size="14" />
              {{ s.nombre }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <div class="footer-section">
          <button class="action-btn primary" @click="$emit('print', hab)">
            <Printer :size="16" /> Certificado
          </button>
          <button class="action-btn" @click="$emit('print-inspection', hab)">
            <ClipboardCheck :size="16" /> Acta PDF
          </button>
          <button class="action-btn" @click="$emit('print-inspection-excel', hab)">
            <FileDown :size="16" /> Acta Excel
          </button>
        </div>
        <div class="footer-section" style="gap: 8px;">
          <button class="action-btn accent" @click="$emit('generate-resolution', hab)">
            <FileSignature :size="14" /> Resol. DOCX
          </button>
          <button class="action-btn" style="background: var(--primary); color: white; border-color: var(--primary);" @click="$emit('generate-resolution-pdf', hab)">
            <FileText :size="14" /> Resol. PDF
          </button>
          <button class="action-btn danger" @click="$emit('generate-elevacion', hab)">
            <Gavel :size="14" /> Elevac. DOCX
          </button>
          <button class="action-btn danger" style="background: #e11d48; border-color: #e11d48;" @click="$emit('generate-elevacion-pdf', hab)">
            <FileText :size="14" /> Elevac. PDF
          </button>
        </div>
        <div class="footer-section">
          <button v-if="isEditing" class="action-btn save" @click="handleSave">
            <Save :size="16" /> Guardar
          </button>
          <button v-else class="action-btn close-btn" @click="$emit('close')">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import '../wp-modal.css';

/* HabilitacionDetails-specific styles */
.exp-icon {
  background: #f0f6fc;
  color: #2271b1;
  padding: 10px;
  border-radius: 4px;
  display: flex;
}

.exp-info h2 { font-size: 18px; font-weight: 600; margin: 0; color: #1d2327; }
.exp-type-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.type-badge-inline { font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; background: #f0f6fc; color: #2271b1; border: 1px solid #c3c4c7; }
.type-badge-inline.escolar { background: #fcf9e8; color: #996800; border-color: #dba617; }
.type-badge-inline.remis { background: #edfaef; color: #00a32a; border-color: #68de7c; }
.type-badge-inline.punto-inicial-terminal { background: #f0f6fc; color: #2271b1; border-color: #2271b1; }

.input-field-header { background: #fff; border: 1px solid #8c8f94; color: #1d2327; padding: 0 8px; border-radius: 4px; font-size: 14px; font-weight: 600; width: 200px; height: 30px; }
.input-field-header::placeholder { color: #787c82; }

.type-toggle-group { display: flex; gap: 4px; margin-top: 6px; }
.type-toggle-group button { background: #f6f7f7; border: 1px solid #c3c4c7; color: #50575e; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 400; cursor: pointer; transition: background 0.1s; height: 26px; }
.type-toggle-group button.active { background: #2271b1; color: white; border-color: #2271b1; }

.status-badge { display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #f0f6fc; border: 1px solid #c3c4c7; color: #2271b1; }
.status-badge.success { background: #edfaef; border-color: #68de7c; color: #00a32a; }
.status-badge.warning { background: #fcf9e8; border-color: #dba617; color: #996800; }
.status-badge.danger { background: #fcf0f1; border-color: #d63638; color: #d63638; }

.info-chip.dominio { background: #f0f6fc; font-weight: 600; border-color: #2271b1; }
.info-chip.schools { background: #edfaef; border-color: #68de7c; color: #00a32a; }

.info-chip.gestdoc-chip { cursor: pointer; background: #f6f7f7; transition: background 0.1s; user-select: none; border: 1px solid #c3c4c7; }
.info-chip.gestdoc-chip:hover { background: #f0f0f1; transform: none; box-shadow: none; }
.info-chip.gestdoc-chip.cargado { background: #edfaef; border-color: #68de7c; color: #00a32a; }
.info-chip.gestdoc-chip.cargado:hover { background: #d8f5dc; }

/* Unlinked */
.unlinked-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #fff; border: 1px dashed #c3c4c7; border-radius: 0; color: #50575e; margin: 12px; }
.unlinked-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.unlinked-info span { font-size: 13px; font-weight: 400; color: #1d2327; }
.unlinked-info small { font-size: 12px; color: #787c82; }

/* Vehicle Selector */
.vehicle-selector { margin-top: 4px; padding: 0 12px 12px; }
.selector-hint { font-size: 12px; color: #50575e; margin-bottom: 8px; }
.vehicle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
.vehicle-option { display: flex; flex-direction: column; padding: 8px; background: white; border: 1px solid #c3c4c7; border-radius: 4px; cursor: pointer; transition: border-color 0.1s; position: relative; }
.vehicle-option:hover:not(:disabled) { border-color: #2271b1; box-shadow: none; transform: none; }
.vehicle-option.occupied { opacity: 0.5; cursor: not-allowed; background: #f6f7f7; }
.vehicle-plate-small { font-family: monospace; font-size: 13px; font-weight: 600; color: #1d2327; }
.vehicle-desc { font-size: 11px; color: #787c82; margin-top: 2px; }
.occ-badge { position: absolute; top: 4px; right: 4px; font-size: 9px; background: #d63638; color: white; padding: 1px 4px; border-radius: 2px; font-weight: 600; text-transform: uppercase; }

/* Contact */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.contact-item { display: flex; align-items: center; gap: 8px; background: white; padding: 8px 12px; border-bottom: 1px solid #f0f0f1; border-right: 1px solid #f0f0f1; position: relative; }
.contact-item:nth-child(2n) { border-right: none; }
.contact-item.missing { border-left: 3px solid #d63638; background: #fcf0f1; }
.contact-icon { padding: 4px; background: #f0f6fc; border-radius: 4px; color: #2271b1; }
.contact-item.missing .contact-icon { background: #fcf0f1; color: #d63638; }
.contact-data { flex: 1; min-width: 0; }
.contact-data label { display: block; font-size: 11px; text-transform: uppercase; color: #787c82; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 1px; }
.contact-data span { font-size: 13px; font-weight: 400; color: #1d2327; }
.missing-tag { display: flex; align-items: center; gap: 3px; font-size: 10px; color: #d63638; font-weight: 600; text-transform: uppercase; padding: 2px 6px; background: #fcf0f1; border-radius: 4px; }

/* Staff */
.staff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.staff-card { background: white; padding: 8px 12px; border-bottom: 1px solid #f0f0f1; border-right: 1px solid #f0f0f1; }
.staff-card:nth-child(2n) { border-right: none; }
.staff-label { font-size: 11px; text-transform: uppercase; color: #787c82; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 2px; }
.staff-value { font-size: 13px; font-weight: 400; color: #1d2327; }

/* Schools */
.schools-list { display: flex; flex-direction: column; gap: 0; }
.school-item { display: flex; align-items: center; gap: 8px; background: white; padding: 8px 12px; border-bottom: 1px solid #f0f0f1; }
.school-item:last-child { border-bottom: none; }
.school-icon { padding: 4px; background: #f0f6fc; border-radius: 4px; color: #2271b1; }
.school-info { display: flex; flex-direction: column; }
.school-name { font-size: 13px; font-weight: 400; color: #1d2327; }
.school-address { font-size: 11px; color: #787c82; }
.empty-state { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px; color: #787c82; font-size: 13px; }

.school-selector-grid { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 12px; }
.school-chip { display: flex; align-items: center; gap: 4px; padding: 2px 8px; background: #f6f7f7; border: 1px solid #c3c4c7; border-radius: 4px; color: #50575e; cursor: pointer; transition: background 0.1s; font-size: 12px; font-weight: 400; height: 26px; }
.school-chip.active { background: #2271b1; color: white; border-color: #2271b1; }

/* Action buttons */
.action-btn.primary { background: #2271b1; color: white; border-color: #2271b1; }
.action-btn.primary:hover { background: #135e96; border-color: #135e96; }
.action-btn.accent { background: #2271b1; color: white; border-color: #2271b1; }
.action-btn.accent:hover { background: #135e96; }
.action-btn.danger { background: #d63638; color: white; border-color: #d63638; }
.action-btn.danger:hover { background: #b32d2e; }

/* Estado chips */
.info-chip.estado-chip.iniciado { background: #f6f7f7; border: 1px solid #c3c4c7; color: #50575e; }
.info-chip.estado-chip.resolucion-armada { background: #fcf9e8; border: 1px solid #dba617; color: #996800; }
.info-chip.estado-chip.tribunal-faltas { background: #f0f6fc; border: 1px solid #2271b1; color: #2271b1; }
.info-chip.estado-chip.resolucion-formada { background: #edfaef; border: 1px solid #68de7c; color: #00a32a; }
.info-chip.estado-chip.tramite-finalizado { background: #edfaef; border: 1px solid #00a32a; color: #00a32a; }

.estado-select-header { font-size: 12px; font-weight: 400; width: 140px; padding: 0 4px; border-radius: 4px; background: #f6f7f7; border: 1px solid #8c8f94; color: #1d2327; outline: none; cursor: pointer; height: 26px; }
.estado-select-header option { color: #1d2327; }

/* Timeline */
.status-timeline { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-top: 8px; background: white; padding: 12px 8px; border-radius: 0; border: 1px solid #c3c4c7; }
@media (max-width: 640px) { .status-timeline { flex-direction: column; gap: 12px; } }

.timeline-step { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; opacity: 0.4; transition: opacity 0.2s; }
@media (max-width: 640px) { .timeline-step { flex-direction: row; text-align: left; align-items: flex-start; width: 100%; } }
.timeline-step.active { opacity: 1; }
.timeline-step.clickable { cursor: pointer; }
.timeline-step.clickable:hover { opacity: 0.7; transform: none; }

.step-indicator { width: 24px; height: 24px; border-radius: 50%; background: #f6f7f7; border: 2px solid #c3c4c7; display: flex; align-items: center; justify-content: center; color: #787c82; margin-bottom: 4px; transition: all 0.2s; z-index: 2; }
@media (max-width: 640px) { .step-indicator { margin-bottom: 0; margin-right: 8px; flex-shrink: 0; } }
.timeline-step.active .step-indicator { background: #2271b1; border-color: #2271b1; color: white; box-shadow: none; }
.step-dot { width: 5px; height: 5px; border-radius: 50%; background: #c3c4c7; }
.step-content { display: flex; flex-direction: column; align-items: center; }
@media (max-width: 640px) { .step-content { align-items: flex-start; } }
.step-title { font-size: 10px; font-weight: 600; color: #1d2327; margin-bottom: 1px; }
.step-desc { font-size: 9px; color: #787c82; font-weight: 400; max-width: 100px; }
@media (max-width: 640px) { .step-desc { max-width: 100%; } }

.linked-address { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #787c82; margin-top: 4px; }

@media (max-width: 768px) {
  .contact-grid, .staff-grid { grid-template-columns: 1fr; }
  .contact-item, .staff-card { border-right: none; }
  .modal-footer { flex-direction: column; align-items: stretch; }
  .footer-section { justify-content: center; }
}
</style>
