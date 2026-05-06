<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { Users, Database, Settings, LogOut, Search, Plus, FilePlus, Scissors, Eye, Car, School, ClipboardCheck, FileText, Download, AlertTriangle, Building2, ClipboardList, Info, Trash2, Zap, Loader2, Upload } from 'lucide-vue-next';
import DniScanner from './components/DniScanner.vue';
import PeopleTable from './components/PeopleTable.vue';
import TitleScanner from './components/TitleScanner.vue';
import TitlesTable from './components/TitlesTable.vue';
import PdfMerge from './components/PdfMerge.vue';
import PdfSplit from './components/PdfSplit.vue';
import PdfViewer from './components/PdfViewer.vue';
import PdfRenamer from './components/PdfRenamer.vue';
import PersonDetails from './components/PersonDetails.vue';
import TitleDetails from './components/TitleDetails.vue';
import HabilitacionDetails from './components/HabilitacionDetails.vue';
import SchoolDetails from './components/SchoolDetails.vue';
import HabilitacionScanner from './components/HabilitacionScanner.vue';
import HabilitacionesTable from './components/HabilitacionesTable.vue';
import SchoolScanner from './components/SchoolScanner.vue';
import SchoolsTable from './components/SchoolsTable.vue';
import { enrichSchoolData } from './services/schoolService';
import NewInspection from './components/NewInspection.vue';
import InspectionsTable from './components/InspectionsTable.vue';
import InspectionScanner from './components/InspectionScanner.vue';
import BulkScanner from './components/BulkScanner.vue';
import { generateInspectionPDF, generateHabilitacionPDF } from './utils/pdfGenerator';
import { generateResolutionDOCX, generateElevacionTribunalDOCX } from './services/resolutionService';
import { 
  db, savePerson, getAllPeople, deletePersonById, updatePerson,
  saveTitle, getAllTitles, deleteTitleById, updateTitle,
  saveHabilitacion, getAllHabilitaciones, deleteHabilitacionById, updateHabilitacion,
  saveSchool, getAllSchools, deleteSchoolById, updateSchool,
  saveInspeccion, getAllInspecciones, deleteInspeccionById,
  exportLegacyDatabase, migrateToFirestore
} from './services/dbService';
import { currentUser, loginWithGoogle, logout, authError, isChecking } from './services/authService';

const activeTab = ref('registry');
const people = ref<any[]>([]);
const titles = ref<any[]>([]);
const habilitaciones = ref<any[]>([]);
const schools = ref<any[]>([]);
const inspections = ref<any[]>([]);
const selectedPerson = ref<any>(null);
const selectedTitle = ref<any>(null);
const selectedHabilitacion = ref<any>(null);
const selectedSchool = ref<any>(null);
const selectedInspection = ref<any>(null);
const searchQuery = ref('');
const isMigrating = ref(false);

// Toast notifications
interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning' | 'info' }
const toasts = ref<Toast[]>([]);
let toastId = 0;

const showToast = (message: string, type: Toast['type'] = 'info') => {
  const id = ++toastId;
  toasts.value.push({ id, message, type });
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id); }, 4000);
};

const currentSectionLabel = computed(() => {
  switch (activeTab.value) {
    case 'registry': return 'Personas';
    case 'titles_list': case 'titles_scan': return 'Títulos Automotor';
    case 'hab_list': case 'hab_scan': return 'Habilitaciones';
    case 'school_list': case 'school_scan': return 'Colegios';
    case 'insp_list': case 'insp_scan': case 'insp_new': return 'Inspecciones';
    case 'bulk': return 'Carga Masiva';
    case 'database': return 'Base de Datos';
    case 'merge': case 'split': case 'viewer': case 'renamer': return 'Herramientas PDF';
    default: return 'Panel de Control';
  }
});
const isLoggingIn = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const handleLogin = async () => {
  isLoggingIn.value = true;
  try {
    await loginWithGoogle();
    await loadData();
  } catch (error) {
    console.error('Login failed:', error);
  } finally {
    isLoggingIn.value = false;
  }
};

const handleLogout = async () => {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    await logout();
  }
};

const loadData = async () => {
  if (!currentUser.value) return;
  people.value = await getAllPeople();
  titles.value = await getAllTitles();
  habilitaciones.value = await getAllHabilitaciones();
  schools.value = await getAllSchools();
  inspections.value = await getAllInspecciones();
};

const filteredPeople = computed(() => {
  if (!searchQuery.value) return people.value;
  const q = searchQuery.value.toLowerCase();
  return people.value.filter(p => 
    p.surname.toLowerCase().includes(q) || 
    p.names.toLowerCase().includes(q) || 
    p.idNumber.includes(q)
  );
});

const filteredTitles = computed(() => {
  if (!searchQuery.value) return titles.value;
  const q = searchQuery.value.toLowerCase();
  return titles.value.filter(t => 
    t.dominio.toLowerCase().includes(q) || 
    t.titular.toLowerCase().includes(q) || 
    t.tramite.includes(q)
  );
});

const filteredHabilitaciones = computed(() => {
  if (!searchQuery.value) return habilitaciones.value;
  const q = searchQuery.value.toLowerCase();
  return habilitaciones.value.filter(h => 
    h.nroExpediente.toLowerCase().includes(q) || 
    h.titular.toLowerCase().includes(q) || 
    (h.idNumber && h.idNumber.includes(q))
  );
});

watch(currentUser, (newUser) => {
  if (newUser) {
    loadData();
  } else {
    // Clear data on logout
    people.value = [];
    titles.value = [];
    habilitaciones.value = [];
    schools.value = [];
    inspections.value = [];
  }
});

onMounted(loadData);

const handlePersonAdded = async (newPerson: any) => {
  const result = await savePerson(newPerson);
  if (result.isDuplicate) {
    showToast(`Persona duplicada: DNI ${newPerson.idNumber} ya existía. Datos actualizados.`, 'warning');
  } else {
    showToast(`Persona registrada: ${newPerson.surname}, ${newPerson.names}`, 'success');
  }
  await loadData();
  activeTab.value = 'registry';
};

const handleTitleAdded = async (newTitle: any) => {
  const result = await saveTitle(newTitle);
  if (result.isDuplicate) {
    showToast(`Título duplicado: Patente ${newTitle.dominio} ya existía. Datos actualizados.`, 'warning');
  } else {
    showToast(`Título registrado: ${newTitle.marca} ${newTitle.modelo} (${newTitle.dominio})`, 'success');
  }
  await loadData();
  activeTab.value = 'titles_list';
};

const handleHabilitacionAdded = async (data: any) => {
  const result = await saveHabilitacion(data);
  if (result.isDuplicate) {
    showToast(`Habilitación duplicada: Expediente ${data.nroExpediente} ya existía. Datos actualizados.`, 'warning');
  } else {
    showToast(`Habilitación registrada: Exp ${data.nroExpediente}`, 'success');
  }
  await loadData();
  activeTab.value = 'hab_list';
};

// Logic for school addition
const handleSchoolAdded = async (schoolData: any) => {
  try {
    // Enrich data if address is missing using AI knowledge of Lanús
    if (!schoolData.domicilio || schoolData.domicilio.length < 5) {
      const enriched = await enrichSchoolData(schoolData.nombre);
      if (enriched.domicilio) {
        schoolData.domicilio = enriched.domicilio;
      }
      if (enriched.telefono) {
        schoolData.telefono = enriched.telefono;
      }
    }

    // 1. Save school (this handles duplicate checking by name in dbService)
    const result = await saveSchool(schoolData);
    if (result.isDuplicate) {
      showToast(`Colegio duplicado: "${schoolData.nombre}" ya existía. Datos actualizados.`, 'warning');
    } else {
      showToast(`Colegio registrado: ${schoolData.nombre}`, 'success');
    }
    const schoolId = result.id;
    
    // 2. Link to habilitacion if dominio matches
    if (schoolData.dominio) {
      const hab = habilitaciones.value.find(h => h.dominio === schoolData.dominio);
      if (hab) {
        const idColegios = hab.idColegios || [];
        if (!idColegios.includes(schoolId)) {
          idColegios.push(schoolId);
          await updateHabilitacion(hab.id, { idColegios });
          // Refresh list
          habilitaciones.value = await getAllHabilitaciones();
        }
      }
    }
    
    schools.value = await getAllSchools();
    activeTab.value = 'school_list';
  } catch (error) {
    console.error('Error adding school:', error);
    showToast('Error al registrar el colegio.', 'error');
  }
};

const handleEnrichSchool = async (school: any) => {
  try {
    const enriched = await enrichSchoolData(school.nombre);
    if (enriched.domicilio || enriched.telefono) {
      await updateSchool(school.id, {
        ...enriched,
        timestamp: Date.now()
      });
      // Refresh local state
      schools.value = await getAllSchools();
      // Update selectedSchool to show new data in modal
      selectedSchool.value = schools.value.find(s => s.id === school.id);
    }
  } catch (error) {
    console.error('Error enriching existing school:', error);
  }
};

const handleSchoolUpdate = async (updatedData: any) => {
  try {
    await updateSchool(updatedData.id, {
      ...updatedData,
      timestamp: Date.now()
    });
    schools.value = await getAllSchools();
    if (selectedSchool.value?.id === updatedData.id) {
      selectedSchool.value = schools.value.find(s => s.id === updatedData.id);
    }
  } catch (error) {
    console.error('Error updating school:', error);
  }
};

const handleInspeccionAdded = async (data: any) => {
  await saveInspeccion(data);
  await loadData();
  activeTab.value = 'insp_list';
};

const deletePerson = async (id: string) => {
  if (!id || !confirm('¿Eliminar esta persona?')) return;
  try {
    await deletePersonById(id);
    showToast('Persona eliminada', 'success');
    await loadData();
  } catch (e) { console.error('Error deleting person:', e); showToast('Error al eliminar', 'error'); }
};

const deleteTitle = async (id: string) => {
  if (!id || !confirm('¿Eliminar este título?')) return;
  try {
    await deleteTitleById(id);
    showToast('Título eliminado', 'success');
    await loadData();
  } catch (e) { console.error('Error deleting title:', e); showToast('Error al eliminar', 'error'); }
};

const deleteHabilitacion = async (id: string) => {
  if (!id || !confirm('¿Eliminar esta habilitación?')) return;
  try {
    await deleteHabilitacionById(id);
    showToast('Habilitación eliminada', 'success');
    await loadData();
  } catch (e) { console.error('Error deleting habilitacion:', e); showToast('Error al eliminar', 'error'); }
};

const deleteSchool = async (id: string) => {
  if (!id || !confirm('¿Eliminar este colegio?')) return;
  try {
    await deleteSchoolById(id);
    showToast('Colegio eliminado', 'success');
    await loadData();
  } catch (e) { console.error('Error deleting school:', e); showToast('Error al eliminar', 'error'); }
};

const deleteInspeccion = async (id: string) => {
  if (!id || !confirm('¿Eliminar esta inspección?')) return;
  try {
    await deleteInspeccionById(id);
    showToast('Inspección eliminada', 'success');
    await loadData();
  } catch (e) { console.error('Error deleting inspection:', e); showToast('Error al eliminar', 'error'); }
};

const viewDetails = (person: any) => selectedPerson.value = person;
const viewTitleDetails = (title: any) => selectedTitle.value = title;
const viewHabilitacionDetails = (hab: any) => selectedHabilitacion.value = hab;
const viewSchoolDetails = (school: any) => selectedSchool.value = school;
const viewInspectionDetails = (ins: any) => selectedInspection.value = ins;

const filteredInspections = computed(() => {
  if (!searchQuery.value) return inspections.value;
  const q = searchQuery.value.toLowerCase();
  return inspections.value.filter(i => 
    i.dominio.toLowerCase().includes(q) || 
    i.resultado.toLowerCase().includes(q)
  );
});

const filteredSchools = computed(() => {
  if (!searchQuery.value) return schools.value;
  const q = searchQuery.value.toLowerCase();
  return schools.value.filter(s => 
    s.nombre.toLowerCase().includes(q) || 
    s.idNumberTitular.includes(q) ||
    (s.dominio && s.dominio.toLowerCase().includes(q))
  );
});

const getLinkedTitles = (idNumber: string) => {
  if (!idNumber) return [];
  const cleanId = idNumber.replace(/\D/g, '');
  return titles.value.filter(t => t.cuilTitular && t.cuilTitular.replace(/\D/g, '').includes(cleanId));
};

const getLinkedPerson = (cuil: string) => {
  if (!cuil) return null;
  const cleanCuil = cuil.replace(/\D/g, '');
  return people.value.find(p => {
    if (!p.idNumber) return false;
    const cleanDni = p.idNumber.replace(/\D/g, '');
    return cleanCuil.includes(cleanDni) && cleanDni.length >= 7;
  });
};

const getLinkedPersonByHab = (hab: any) => {
  if (!hab) return null;
  const habId = hab.idNumber ? hab.idNumber.replace(/\D/g, '') : '';
  
  if (habId) {
    const person = people.value.find(p => p.idNumber && p.idNumber.replace(/\D/g, '').includes(habId));
    if (person) return person;
  }
  
  // Fallback to name matching
  if (!hab.titular) return null;
  const cleanTitular = hab.titular.toLowerCase();
  return people.value.find(p => {
    const pName = `${p.surname} ${p.names}`.toLowerCase();
    return pName.includes(cleanTitular) || cleanTitular.includes(p.surname.toLowerCase());
  });
};

const getLinkedTitleByHab = (dominio: string) => {
  if (!dominio) return null;
  const cleanDom = dominio.replace(/\W/g, '').toUpperCase();
  return titles.value.find(t => {
    if (!t.dominio) return false;
    const tDom = t.dominio.replace(/\W/g, '').toUpperCase();
    return tDom === cleanDom || tDom.includes(cleanDom) || cleanDom.includes(tDom);
  });
};


const getPersonVehicles = (idNumber: string) => {
  if (!idNumber) return [];
  const cleanId = idNumber.replace(/\D/g, '');
  return titles.value.filter(t => t.cuilTitular && t.cuilTitular.replace(/\D/g, '').includes(cleanId));
};

const getOccupiedDominios = (currentHabId?: any) => {
  return habilitaciones.value
    .filter(h => h.dominio && String(h.id) !== String(currentHabId))
    .map(h => h.dominio.replace(/\W/g, '').toUpperCase());
};

const handlePersonUpdate = async (updatedData: any) => {
  if (updatedData.id) {
    const dataToSave = JSON.parse(JSON.stringify(updatedData));
    await updatePerson(updatedData.id, dataToSave);
    await loadData();
    selectedPerson.value = people.value.find(p => String(p.id) === String(updatedData.id));
  }
};

const handleTitleUpdate = async (updatedData: any) => {
  if (updatedData.id) {
    const dataToSave = JSON.parse(JSON.stringify(updatedData));
    await updateTitle(updatedData.id, dataToSave);
    await loadData();
    selectedTitle.value = titles.value.find(t => String(t.id) === String(updatedData.id));
  }
};

const handleHabilitacionUpdate = async (updatedData: any) => {
  if (updatedData.id) {
    // Strip Vue proxies for DB
    const dataToSave = JSON.parse(JSON.stringify(updatedData));
    await updateHabilitacion(updatedData.id, dataToSave);
    await loadData();
    // Re-select the updated item from the fresh list to ensure reactivity
    selectedHabilitacion.value = habilitaciones.value.find(h => String(h.id) === String(updatedData.id));
  }
};

const handleExportDB = async () => {
  try {
    const data = await exportLegacyDatabase();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_pdf_platform_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting database:', error);
    showToast('Error al exportar la base de datos.', 'error');
  }
};

const handleMigration = async () => {
  if (!confirm('Esto copiará todos tus datos locales actuales (Dexie) a Firebase en la nube. ¿Deseas continuar?')) return;
  
  isMigrating.value = true;
  try {
    const localData = await exportLegacyDatabase();
    await migrateToFirestore(localData);
    showToast('¡Migración completada! Ahora el sistema usa Firebase.', 'success');
    await loadData();
  } catch (error: any) {
    showToast(`Error en la migración: ${error.message}`, 'error');
  } finally {
    isMigrating.value = false;
  }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (!confirm('¿Deseas importar estos datos a Firebase? Esto procesará el backup seleccionado.')) return;
      
      isMigrating.value = true;
      await migrateToFirestore(data);
      showToast('¡Importación completada!', 'success');
      await loadData();
    } catch (error: any) {
      showToast(`Error al importar: ${error.message}`, 'error');
    } finally {
      isMigrating.value = false;
      if (fileInput.value) fileInput.value.value = '';
    }
  };
  reader.readAsText(file);
};


const handlePrintInspection = (inspection: any) => {
  const title = titles.value.find(t => t.dominio === inspection.dominio);
  const hab = habilitaciones.value.find(h => h.dominio === inspection.dominio);
  generateInspectionPDF(inspection, title, hab);
};

const handlePrintHabilitacion = (hab: any) => {
  const person = getLinkedPersonByHab(hab);
  const title = getLinkedTitleByHab(hab.dominio);
  const driver = people.value.find(p => p.id === hab.idChofer);
  const attendant = people.value.find(p => p.id === hab.idCelador);
  const linkedSchools = schools.value.filter(s => hab.idColegios?.includes(s.id));
  
  generateHabilitacionPDF(hab, person, title, driver, attendant, linkedSchools);
};

const handlePrintBlankInspection = (hab: any) => {
  const title = getLinkedTitleByHab(hab.dominio);
  const person = getLinkedPersonByHab(hab);
  
  const blankInspection = {
    dominio: hab.dominio,
    fecha: new Date().toISOString().split('T')[0],
    titularName: person ? `${person.surname}, ${person.names}` : (hab.titular || '---'),
    idNumber: person?.idNumber || hab.idNumber || '---',
    address: person?.address || '---',
    checklist: [
      { label: 'Pta. accionada desde cond. para desc. / asc. (Puerta derecha)', status: 'Bien' },
      { label: 'Pta. accionada desde cond. para desc. / asc. (Puerta izquierda)', status: 'Bien' },
      { label: 'Salida de Emer. indep. de la plataf. asc. / desc. (En Caso de Combi - L. Der. y Trasero)', status: 'Bien' },
      { label: 'Vent. Vidrio Temp. / inastillable (Apertura 10 cm)', status: 'Bien' },
      { label: 'Pisos rec. con mat. Antideslizables', status: 'Bien' },
      { label: 'Dimens. de Banquetas (desde el piso 0.40 mts - ancho min 0.45mts Prof. medida horiz. 0.40 mts)', status: 'Bien' },
      { label: 'Asientos: Fijos, Acolchados, Estructu. metalicas, revestimiento (Caucho o similar)', status: 'Bien' },
      { label: 'Puerta Izquierda de la Carroceria', status: 'Bien' },
      { label: 'Cinturones de Seguridad en todos los asientos', status: 'Bien' },
      { label: 'Cabezales o apoya Cabeza en todos los asientos', status: 'Bien' },
      { label: 'Espacios Libres', status: 'Bien' },
      { label: 'Pintura (Carroceria baja y capot naranja N° 1054 IRAM - carroceria altatecho y parantes Color blanco)', status: 'Bien' },
      { label: 'Leyenda de "Escolares" o " Niños" Tamaño minimo: 0,20 mts', status: 'Bien' },
    ]
  };
  
  generateInspectionPDF(blankInspection, title, hab);
};



const handleDownloadInspectionExcel = async (hab: any) => {
  const title = getLinkedTitleByHab(hab.dominio);
  const person = getLinkedPersonByHab(hab);
  
  try {
    const response = await fetch('/templates/ActaInspeccionTemplate.xlsx');
    if (!response.ok) throw new Error('No se pudo cargar la plantilla de Excel');
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) throw new Error('No se encontró la hoja en el Excel');

    // Fill Data - preserving styles by updating values directly
    worksheet.getCell('B4').value = hab.nroExpediente || '---';
    worksheet.getCell('F4').value = hab.nroLicencia || '---';
    
    worksheet.getCell('B6').value = person ? `${person.surname}, ${person.names}` : (hab.titular || '---');
    worksheet.getCell('B7').value = person?.idNumber || hab.idNumber || '---';
    worksheet.getCell('B8').value = person?.address || '---';
    worksheet.getCell('B9').value = hab.anioHabilitacion || new Date().getFullYear().toString();
    worksheet.getCell('B10').value = person?.phone || hab.phone || '---';

    worksheet.getCell('F6').value = hab.dominio || '---';
    worksheet.getCell('F7').value = title?.marca || '---';
    worksheet.getCell('F8').value = title?.modelo || '---';
    worksheet.getCell('F9').value = title?.anioModelo || title?.anioFabricacion || '---';
    worksheet.getCell('F10').value = title?.tipo || 'TRANSPORTE DE PASAJEROS';

    // Generate and Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acta_Inspeccion_${hab.dominio}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error filling Excel:', error);
    showToast(`No se pudo generar el Excel: ${error.message}`, 'error');
  }
};

const handleGenerateResolution = async (hab: any) => {
  const person = getLinkedPersonByHab(hab);
  const title = getLinkedTitleByHab(hab.dominio);
  
  const hasSchools = hab.idColegios && hab.idColegios.length > 0;
  const isEscolarByTitle = title?.tipo?.toLowerCase().includes('escolar');
  const type = (hasSchools || isEscolarByTitle) ? 'escolar' : 'remis';
  
  try {
    await generateResolutionDOCX(type as any, { hab, person, title });
    showToast('Resolución generada correctamente', 'success');
  } catch (error: any) {
    showToast(`Error al generar resolución: ${error.message}`, 'error');
  }
};

const handleGenerateElevacion = async (hab: any) => {
  const person = getLinkedPersonByHab(hab);
  const title = getLinkedTitleByHab(hab.dominio);
  try {
    await generateElevacionTribunalDOCX({ hab, person, title });
    showToast('Elevación a tribunal generada', 'success');
  } catch (error: any) {
    showToast(`Error al generar elevación: ${error.message}`, 'error');
  }
};

const findHabilitacionForSchool = (school: any) => {
  return habilitaciones.value.find(h => 
    h.dominio === school.dominio || 
    h.idNumber === school.idNumberTitular
  );
};

const linkSchoolToHab = async (schoolId: any, habId: any) => {
  const hab = habilitaciones.value.find(h => String(h.id) === String(habId));
  if (hab) {
    const idColegios = hab.idColegios || [];
    if (!idColegios.includes(schoolId)) {
      idColegios.push(schoolId);
      await updateHabilitacion(habId, { ...hab, idColegios });
      await loadData();
    }
  }
};
</script>

<template>
  <!-- Toast Notifications -->
  <div class="toast-container">
    <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
      <span class="toast-icon">{{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ' }}</span>
      <span class="toast-message">{{ toast.message }}</span>
    </div>
  </div>

  <!-- Pantalla de Login -->
  <div v-if="!currentUser" class="login-page">
    <div class="login-card glass-card animate-fade">
      <div class="login-logo">
        <div class="logo-icon"><Database :size="48" /></div>
        <h1>Lanus Digital</h1>
      </div>
      <p>Gestión Municipal de Transporte y Habilitaciones</p>
      
      <div v-if="isChecking" class="login-loading">
        <Loader2 class="spin" :size="24" />
        <span>Verificando sesión...</span>
      </div>
      
      <template v-else>
        <div v-if="authError" class="login-error">
          {{ authError }}
        </div>
        
        <button class="btn btn-google" @click="handleLogin" :disabled="isLoggingIn">
          <Loader2 v-if="isLoggingIn" class="spin" :size="20" />
          <img v-else src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          <span>{{ isLoggingIn ? 'Iniciando sesión...' : 'Entrar con Google' }}</span>
        </button>
      </template>

      <div class="login-footer">
        <p>Sistema de uso restringido para personal autorizado.</p>
      </div>
    </div>
  </div>
  <div v-else class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon"><Database :size="20" /></div>
        <h1>Lanus Digital</h1>
      </div>
      
      <div class="nav-group">
        <button class="nav-item" :class="{ active: activeTab === 'registry' }" @click="activeTab = 'registry'">
          <Users :size="18" /> <span>Personas</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'titles_list' }" @click="activeTab = 'titles_list'">
          <Car :size="18" /> <span>Títulos</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'hab_list' }" @click="activeTab = 'hab_list'">
          <FileText :size="18" /> <span>Habilitaciones</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'school_list' }" @click="activeTab = 'school_list'">
          <School :size="18" /> <span>Colegios</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'insp_list' }" @click="activeTab = 'insp_list'">
          <ClipboardList :size="18" /> <span>Inspecciones</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'bulk' }" @click="activeTab = 'bulk'">
          <Zap :size="18" /> <span>Carga Masiva</span>
        </button>
        <div style="flex: 1;"></div>
        <button class="nav-item" :class="{ active: activeTab === 'database' }" @click="activeTab = 'database'">
          <Database :size="18" /> <span>Base de Datos</span>
        </button>
        <button class="nav-item text-danger" @click="handleLogout">
          <LogOut :size="18" /> <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
    <main class="main-content">
      <header class="top-bar">
        <div class="header-left">
          <div class="section-indicator">
            <span class="label">Sección Actual</span>
            <span class="value">{{ currentSectionLabel }}</span>
          </div>
          
          <div class="search-bar">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar registros, patentes o nombres..." 
              class="search-input"
            />
            <Search class="search-icon" :size="18" />
          </div>
        </div>
        
        <div class="header-right">
          <div class="user-profile">
            <div class="avatar-container">
              <img v-if="currentUser.photoURL" :src="currentUser.photoURL" class="avatar-img" />
              <div v-else class="avatar">{{ currentUser.displayName?.charAt(0) || 'U' }}</div>
              <div class="status-dot"></div>
            </div>
            <div class="user-info">
              <span class="user-name">{{ currentUser.displayName }}</span>
              <span class="user-role">Administrador</span>
            </div>
          </div>
        </div>
      </header>

      <div class="content-scroll-area">
        <div class="animate-fade">
        <!-- Personas -->
        <section v-if="activeTab === 'registry'">
          <div class="section-header">
            <div class="title-group">
              <h2>Personas</h2>
              <p>Registro de titulares y personal.</p>
            </div>
            <button class="btn btn-primary" @click="activeTab = 'scan'">
              <Plus :size="16" /> Registrar Persona
            </button>
          </div>
          <PeopleTable :people="filteredPeople" @delete="deletePerson" @view="viewDetails" />
        </section>

        <div v-if="activeTab === 'scan'">
          <div class="section-header">
            <h1>Escaneo de Documento</h1>
            <button class="btn" @click="activeTab = 'registry'">Cancelar</button>
          </div>
          <DniScanner @person-extracted="handlePersonAdded" />
        </div>

        <!-- Base de Datos -->
        <section v-if="activeTab === 'database'">
          <div class="section-header">
            <div class="title-group">
              <h2>Base de Datos</h2>
              <p>Sincronización y herramientas.</p>
            </div>
            <div class="header-actions">
              <input type="file" ref="fileInput" style="display: none" accept=".json" @change="handleFileUpload" />
              <button class="btn btn-secondary" @click="fileInput?.click()"><Upload :size="16" /> Importar</button>
              <button class="btn btn-primary" @click="handleMigration" :disabled="isMigrating">
                <Loader2 v-if="isMigrating" class="spin" :size="16" />
                <Zap v-else :size="16" /> Sincronizar Nube
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px;">
            <TitleScanner @title-extracted="handleTitleAdded" />
            <div class="glass-card" style="padding: 24px;">
              <h3>Estado del Sistema</h3>
              <div class="db-stats" style="margin: 16px 0 24px;">
                <div class="db-stat"><strong>{{ people.length }}</strong> Personas</div>
                <div class="db-stat"><strong>{{ titles.length }}</strong> Títulos</div>
                <div class="db-stat"><strong>{{ habilitaciones.length }}</strong> Habilitaciones</div>
              </div>
              <button class="btn btn-secondary" style="width: 100%; justify-content: center;" @click="handleExportDB">
                <Download :size="16" /> Exportar Copia Local
              </button>
            </div>
          </div>
        </section>

        <!-- Títulos -->
        <section v-if="activeTab === 'titles_list' || activeTab === 'titles_scan'">
          <div v-if="activeTab === 'titles_list'">
            <div class="section-header">
              <div class="title-group">
                <h2>Títulos Automotor</h2>
                <p>Base de datos de vehículos.</p>
              </div>
              <div class="header-actions">
                <button class="btn btn-secondary" @click="activeTab = 'titles_scan'">
                  <Upload :size="16" /> Escanear Título
                </button>
                <button class="btn btn-primary" @click="selectedTitle = {}">
                  <Plus :size="16" /> Nuevo Título
                </button>
              </div>
            </div>
            <TitlesTable :titles="filteredTitles" @delete="deleteTitle" @view="selectedTitle = $event" />
          </div>

          <div v-else-if="activeTab === 'titles_scan'">
            <div class="section-header">
              <div class="title-group">
                <h2>Escaneo de Títulos</h2>
                <p>Sube o captura las fotos del título para extraer los datos con IA.</p>
              </div>
              <button class="btn btn-secondary" @click="activeTab = 'titles_list'">
                Cancelar
              </button>
            </div>
            <TitleScanner @title-extracted="handleTitleAdded" />
          </div>
        </section>

        <!-- Habilitaciones -->
        <section v-if="activeTab === 'hab_list'">
          <div class="section-header">
            <div class="title-group">
              <h2>Habilitaciones</h2>
              <p>Control de expedientes y licencias.</p>
            </div>
            <button class="btn btn-primary" @click="activeTab = 'hab_scan'"><Plus :size="16" /> Nueva</button>
          </div>
          <HabilitacionesTable 
            :habilitaciones="filteredHabilitaciones" 
            @delete="deleteHabilitacion"
            @view="selectedHabilitacion = $event"
            @print="handlePrintHabilitacion"
            @print-inspection="handlePrintBlankInspection"
            @print-inspection-excel="handleDownloadInspectionExcel"
            @generate-resolution="handleGenerateResolution"
            @generate-elevacion="handleGenerateElevacion"
          />
        </section>

        <section v-if="activeTab === 'hab_scan'">
          <div class="section-header">
            <div class="title-group"><h2>Escaneo de Carátula</h2></div>
            <button class="btn btn-secondary" @click="activeTab = 'hab_list'">Cancelar</button>
          </div>
          <HabilitacionScanner @habilitacion-extracted="handleHabilitacionAdded" />
        </section>

        <!-- Colegios -->
        <section v-if="activeTab === 'school_list'">
          <div class="section-header">
            <div class="title-group">
              <h2>Colegios</h2>
              <p>Gestión de establecimientos.</p>
            </div>
            <button class="btn btn-primary" @click="activeTab = 'school_scan'"><Plus :size="16" /> Escanear</button>
          </div>
          <SchoolsTable :schools="filteredSchools" :habilitaciones="habilitaciones" @delete="deleteSchool" @view="viewSchoolDetails" />
        </section>

        <section v-if="activeTab === 'school_scan'">
          <div class="section-header">
            <div class="title-group"><h2>Escaneo de Certificado</h2></div>
            <button class="btn btn-secondary" @click="activeTab = 'school_list'">Cancelar</button>
          </div>
          <SchoolScanner @school-extracted="handleSchoolAdded" />
        </section>

        <!-- Inspecciones -->
        <section v-if="activeTab === 'insp_list'">
          <div class="section-header">
            <div class="title-group">
              <h2>Inspecciones</h2>
              <p>Seguimiento técnico de unidades.</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary" @click="activeTab = 'insp_scan'"><Scissors :size="16" /> Escanear</button>
              <button class="btn btn-primary" @click="activeTab = 'insp_new'"><Plus :size="16" /> Nueva</button>
            </div>
          </div>
          <InspectionsTable :inspections="filteredInspections" @delete="deleteInspeccion" @view="viewInspectionDetails" @print="handlePrintInspection" />
        </section>

        <div v-if="activeTab === 'insp_scan'">
          <div class="section-header">
            <h1>Escaneo de Acta de Inspección</h1>
            <button class="btn" @click="activeTab = 'insp_list'">Cancelar</button>
          </div>
          <InspectionScanner @inspection-extracted="handleInspeccionAdded" />
        </div>

        <div v-if="activeTab === 'insp_new'">
          <div class="section-header">
            <h1>Nueva Inspección Técnica</h1>
            <button class="btn" @click="activeTab = 'insp_list'">Cancelar</button>
          </div>
          <NewInspection :titles="titles" @save="handleInspeccionAdded" @cancel="activeTab = 'insp_list'" />
        </div>

        <!-- PDF Tools Tabs -->
        <div v-if="activeTab === 'merge'">
          <PdfMerge />
        </div>

        <div v-if="activeTab === 'split'">
          <PdfSplit />
        </div>

        <div v-if="activeTab === 'viewer'">
          <PdfViewer />
        </div>

        <div v-if="activeTab === 'renamer'">
          <PdfRenamer />
        </div>

          <div v-if="activeTab === 'bulk'">
            <BulkScanner @saved="loadData" />
          </div>
        </div> <!-- Fin animate-fade -->
      </div> <!-- Fin content-scroll-area -->
    </main>

    <!-- Modals -->
    <PersonDetails 
      v-if="selectedPerson" 
      :person="selectedPerson" 
      :linked-titles="getLinkedTitles(selectedPerson.idNumber)"
      @close="selectedPerson = null" 
      @update="handlePersonUpdate"
    />

    <TitleDetails
      v-if="selectedTitle"
      :title="selectedTitle"
      :linked-person="getLinkedPerson(selectedTitle.cuilTitular)"
      @close="selectedTitle = null"
      @update="handleTitleUpdate"
    />

    <HabilitacionDetails
      v-if="selectedHabilitacion"
      :hab="selectedHabilitacion"
      :linked-person="getLinkedPersonByHab(selectedHabilitacion)"
      :linked-title="getLinkedTitleByHab(selectedHabilitacion.dominio)"
      :person-vehicles="selectedHabilitacion.idNumber ? getPersonVehicles(selectedHabilitacion.idNumber) : []"
      :occupied-dominios="getOccupiedDominios(selectedHabilitacion.id)"
      :people="people"
      :schools="schools"
      @close="selectedHabilitacion = null"
      @update="handleHabilitacionUpdate"
      @print="handlePrintHabilitacion"
      @print-inspection="handlePrintBlankInspection"
      @print-inspection-excel="handleDownloadInspectionExcel"
      @generate-resolution="handleGenerateResolution"
      @generate-elevacion="handleGenerateElevacion"
    />

    <SchoolDetails
      v-if="selectedSchool"
      :school="selectedSchool"
      :habilitaciones="habilitaciones"
      :people="people"
      :titles="titles"
      @close="selectedSchool = null"
      @generate-resolution="handleGenerateResolution"
      @print-inspection="handlePrintBlankInspection"
      @print-inspection-excel="handleDownloadInspectionExcel"
      @view-hab="selectedHabilitacion = $event"
      @enrich="handleEnrichSchool(selectedSchool)"
      @update-school="handleSchoolUpdate"
    />
  </div>
</template>

<style scoped>
/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  font-size: 14px;
  font-weight: 600;
  animation: toastIn 0.3s ease;
  pointer-events: auto;
  max-width: 420px;
}

.toast.success { background: #065f46; color: #ecfdf5; }
.toast.error { background: #991b1b; color: #fef2f2; }
.toast.warning { background: #92400e; color: #fffbeb; }
.toast.info { background: #1e40af; color: #eff6ff; }

.toast-icon {
  font-size: 16px;
  flex-shrink: 0;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Login Error */
.login-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
}

.login-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  padding: 16px;
  margin-bottom: 16px;
}

.nav-section {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 16px 16px 8px;
  letter-spacing: 0.05em;
}

.dashboard-layout {
  display: flex;
  height: 100vh;
  background: var(--bg-main);
  padding: 0;
  gap: 0;
}

.sidebar {
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 32px 24px;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 48px;
  color: white;
  letter-spacing: -0.02em;
}

.logo-icon {
  background: white;
  color: var(--primary);
  padding: 8px;
  border-radius: 12px;
  display: flex;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-section {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 24px 12px 8px;
  letter-spacing: 0.1em;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.4);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 40px;
  background: white;
  border-bottom: 1px solid var(--border-light);
}

.search-bar {
  position: relative;
  width: 440px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  background: #f1f5f9;
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 14px 16px 14px 48px;
  color: var(--text-main);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  background: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.content-body {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: var(--bg-main);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.section-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.section-header p {
  color: var(--text-muted);
  font-size: 15px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 6px 6px 16px;
  background: #f8fafc;
  border-radius: 30px;
  border: 1px solid var(--border-light);
}

.avatar {
  width: 36px;
  height: 36px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.p-32 { padding: 32px; }

.db-status {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  margin-bottom: 32px;
}

.db-icon {
  background: rgba(79, 70, 229, 0.1);
  color: var(--primary);
  padding: 24px;
  border-radius: 20px;
}

.db-info h3 {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 8px;
}

.db-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.db-stat {
  background: #f1f5f9;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-muted);
  border: 1px solid var(--border-light);
}

.db-stat strong {
  color: var(--primary);
  font-size: 16px;
  margin-right: 4px;
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 16px 24px;
  border-radius: 12px;
  color: #92400e;
  font-size: 14px;
  font-weight: 500;
}
</style>
