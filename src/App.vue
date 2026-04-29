<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
import { generateInspectionPDF, generateHabilitacionPDF } from './utils/pdfGenerator';
import { generateResolutionDOCX, generateElevacionTribunalDOCX } from './services/resolutionService';
import { 
  db, savePerson, getAllPeople, deletePersonById, updatePerson,
  saveTitle, getAllTitles, deleteTitleById, updateTitle,
  saveHabilitacion, getAllHabilitaciones, deleteHabilitacionById, updateHabilitacion,
  saveSchool, getAllSchools, deleteSchoolById, updateSchool,
  saveInspeccion, getAllInspecciones, deleteInspeccionById,
  exportLegacyDatabase, migrateToPostgres
} from './services/dbService';

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
const fileInput = ref<HTMLInputElement | null>(null);

const loadData = async () => {
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

onMounted(loadData);

const handlePersonAdded = async (newPerson: any) => {
  await savePerson(newPerson);
  await loadData();
  activeTab.value = 'registry';
};

const handleTitleAdded = async (newTitle: any) => {
  await saveTitle(newTitle);
  await loadData();
  activeTab.value = 'titles_list';
};

const handleHabilitacionAdded = async (data: any) => {
  await saveHabilitacion(data);
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
    const schoolId = await saveSchool(schoolData);
    
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
    alert('Error al registrar el colegio.');
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
  await deletePersonById(id);
  await loadData();
};

const deleteTitle = async (id: number) => {
  await deleteTitleById(id);
  await loadData();
};

const deleteHabilitacion = async (id: number) => {
  await deleteHabilitacionById(id);
  await loadData();
};

const deleteSchool = async (id: number) => {
  await deleteSchoolById(id);
  await loadData();
};

const deleteInspeccion = async (id: number) => {
  await deleteInspeccionById(id);
  await loadData();
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
  const cleanId = idNumber.replace(/\D/g, '');
  return titles.value.filter(t => t.cuilTitular.replace(/\D/g, '').includes(cleanId));
};

const getLinkedPerson = (cuil: string) => {
  const cleanCuil = cuil.replace(/\D/g, '');
  return people.value.find(p => {
    const cleanDni = p.idNumber.replace(/\D/g, '');
    return cleanCuil.includes(cleanDni) && cleanDni.length >= 7;
  });
};

const getLinkedPersonByHab = (hab: any) => {
  if (hab.idNumber) {
    const cleanId = hab.idNumber.replace(/\D/g, '');
    return people.value.find(p => p.idNumber.replace(/\D/g, '').includes(cleanId));
  }
  return people.value.find(p => 
    p.surname.toLowerCase().includes(hab.titular.toLowerCase()) || 
    hab.titular.toLowerCase().includes(p.surname.toLowerCase())
  );
};

const getLinkedTitleByHab = (dominio: string) => {
  if (!dominio) return null;
  const cleanDom = dominio.replace(/\W/g, '').toUpperCase();
  return titles.value.find(t => t.dominio.replace(/\W/g, '').toUpperCase().includes(cleanDom));
};

const getPersonVehicles = (idNumber: string) => {
  const cleanId = idNumber.replace(/\D/g, '');
  return titles.value.filter(t => t.cuilTitular.replace(/\D/g, '').includes(cleanId));
};

const getOccupiedDominios = (currentHabId?: number) => {
  return habilitaciones.value
    .filter(h => h.dominio && h.id !== currentHabId)
    .map(h => h.dominio.replace(/\W/g, '').toUpperCase());
};

const handlePersonUpdate = async (updatedData: any) => {
  if (updatedData.id) {
    const dataToSave = JSON.parse(JSON.stringify(updatedData));
    await updatePerson(updatedData.id, dataToSave);
    await loadData();
    selectedPerson.value = people.value.find(p => p.id === updatedData.id);
  }
};

const handleTitleUpdate = async (updatedData: any) => {
  if (updatedData.id) {
    const dataToSave = JSON.parse(JSON.stringify(updatedData));
    await updateTitle(updatedData.id, dataToSave);
    await loadData();
    selectedTitle.value = titles.value.find(t => t.id === updatedData.id);
  }
};

const handleHabilitacionUpdate = async (updatedData: any) => {
  if (updatedData.id) {
    // Strip Vue proxies for DB
    const dataToSave = JSON.parse(JSON.stringify(updatedData));
    await updateHabilitacion(updatedData.id, dataToSave);
    await loadData();
    // Re-select the updated item from the fresh list to ensure reactivity
    selectedHabilitacion.value = habilitaciones.value.find(h => h.id === updatedData.id);
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
    alert('Error al exportar la base de datos.');
  }
};

const handleMigration = async () => {
  if (!confirm('Esto copiará todos tus datos locales actuales (Dexie) a la base de datos PostgreSQL en Docker. ¿Deseas continuar?')) return;
  
  isMigrating.value = true;
  try {
    const localData = await exportLegacyDatabase();
    await migrateToPostgres(localData);
    alert('¡Migración completada con éxito! Ahora el sistema usa la base de datos PostgreSQL.');
    await loadData();
  } catch (error: any) {
    alert(`Error en la migración: Asegúrate de que el backend de Docker esté corriendo. ${error.message}`);
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
      if (!confirm('¿Deseas importar estos datos a PostgreSQL? Esto procesará el backup seleccionado.')) return;
      
      isMigrating.value = true;
      await migrateToPostgres(data);
      alert('¡Importación completada con éxito!');
      await loadData();
    } catch (error: any) {
      alert(`Error al importar: ${error.message}`);
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
    alert(`No se pudo generar el Excel: ${error.message}`);
  }
};

const handleGenerateResolution = async (hab: any) => {
  const person = getLinkedPersonByHab(hab);
  const title = getLinkedTitleByHab(hab.dominio);
  
  // Decide type based on linked schools or title type
  // If has schools linked, it's definitely Escolar
  const hasSchools = hab.idColegios && hab.idColegios.length > 0;
  const isEscolarByTitle = title?.tipo?.toLowerCase().includes('escolar');
  const type = (hasSchools || isEscolarByTitle) ? 'escolar' : 'remis';
  
  try {
    await generateResolutionDOCX(type as any, { hab, person, title });
  } catch (error: any) {
    alert(`Error al generar resolución: ${error.message}`);
  }
};

const handleGenerateElevacion = async (hab: any) => {
  const person = getLinkedPersonByHab(hab);
  const title = getLinkedTitleByHab(hab.dominio);
  try {
    await generateElevacionTribunalDOCX({ hab, person, title });
  } catch (error: any) {
    alert(`Error al generar elevación: ${error.message}`);
  }
};

const findHabilitacionForSchool = (school: any) => {
  return habilitaciones.value.find(h => 
    h.dominio === school.dominio || 
    h.idNumber === school.idNumberTitular
  );
};

const linkSchoolToHab = async (schoolId: number, habId: number) => {
  const hab = habilitaciones.value.find(h => h.id === habId);
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
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="sidebar glass-card">
      <div class="logo">
        <div class="logo-icon"><Database :size="24" /></div>
        <span>PDF Platform</span>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">Registro de Personas</div>
        <button class="nav-item" :class="{ active: activeTab === 'registry' || activeTab === 'scan' }" @click="activeTab = 'registry'">
          <Users :size="20" /> <span>Personas</span>
        </button>

        <div class="nav-section">Registro Automotor</div>
        <button class="nav-item" :class="{ active: activeTab === 'titles_list' || activeTab === 'titles_scan' }" @click="activeTab = 'titles_list'">
          <Car :size="20" /> <span>Títulos</span>
        </button>

        <div class="nav-section">Gestión Administrativa</div>
        <button class="nav-item" :class="{ active: activeTab === 'hab_list' || activeTab === 'hab_scan' }" @click="activeTab = 'hab_list'">
          <FileText :size="20" /> <span>Habilitaciones</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'school_list' || activeTab === 'school_scan' }" @click="activeTab = 'school_list'">
          <School :size="20" /> <span>Colegios</span>
        </button>
        <button class="nav-item" :class="{ active: ['insp_list', 'insp_new', 'insp_scan'].includes(activeTab) }" @click="activeTab = 'insp_list'">
          <ClipboardCheck :size="20" /> <span>Inspecciones</span>
        </button>

        <div class="nav-section">Herramientas PDF</div>
        <button class="nav-item" :class="{ active: activeTab === 'merge' }" @click="activeTab = 'merge'">
          <FilePlus :size="20" /> <span>Unir PDFs</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'split' }" @click="activeTab = 'split'">
          <Scissors :size="20" /> <span>Dividir PDF</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'renamer' }" @click="activeTab = 'renamer'">
          <Search :size="20" /> <span>Renombrar IA</span>
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'viewer' }" @click="activeTab = 'viewer'">
          <Eye :size="20" /> <span>Visor PDF</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item" :class="{ active: activeTab === 'database' }" @click="activeTab = 'database'">
          <Database :size="20" /> <span>Base de Datos</span>
        </button>
        <button class="nav-item"><Settings :size="20" /> Ajustes</button>
        <button class="nav-item text-danger"><LogOut :size="20" /> Salir</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-bar">
        <div class="search-bar">
          <Search :size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar por nombre o DNI..." 
            class="search-input" 
          />
        </div>
        <div class="user-profile">
          <div class="avatar">J</div>
          <span>Admin</span>
        </div>
      </header>

      <div class="content-body animate-fade">
        <!-- Dashboard / Registry -->
        <div v-if="activeTab === 'registry'" class="animate-fade">
          <div class="section-header">
            <div>
              <h1>Registro de Personas</h1>
              <p>Gestiona la base de datos de personas extraídas.</p>
            </div>
            <button class="btn btn-primary" @click="activeTab = 'scan'">
              <Plus :size="18" /> Registrar Persona
            </button>
          </div>
          <PeopleTable 
            :people="filteredPeople" 
            @delete="deletePerson" 
            @view="viewDetails" 
          />
        </div>

        <div v-if="activeTab === 'scan'">
          <div class="section-header">
            <h1>Escaneo de Documento</h1>
            <button class="btn" @click="activeTab = 'registry'">Cancelar</button>
          </div>
          <DniScanner @person-extracted="handlePersonAdded" />
        </div>

        <div v-if="activeTab === 'database'" class="animate-fade">
          <div class="section-header">
            <div>
              <h1>Gestión de Datos</h1>
              <p>Control de base de datos y migración a PostgreSQL (Docker).</p>
            </div>
            <div class="header-actions" style="position: static; display: flex; gap: 12px;">
              <input type="file" ref="fileInput" style="display: none" accept=".json" @change="handleFileUpload" />
              <button class="btn btn-secondary" @click="fileInput?.click()">
                <Upload :size="18" /> Importar JSON
              </button>
              <button class="btn btn-secondary" @click="handleExportDB">
                <Download :size="18" /> Exportar JSON
              </button>
              <button class="btn btn-primary" @click="handleMigration" :disabled="isMigrating">
                <Loader2 v-if="isMigrating" class="spin" :size="18" />
                <Zap v-else :size="18" /> Migrar Local a Docker
              </button>
            </div>
          </div>

          <div class="glass-card p-32">
            <div class="db-status">
              <div class="db-icon"><Database :size="48" /></div>
              <div class="db-info">
                <h3>Estado del Sistema</h3>
                <p>Tu base de datos contiene:</p>
                <div class="db-stats">
                  <div class="db-stat"><strong>{{ people.length }}</strong> Personas</div>
                  <div class="db-stat"><strong>{{ titles.length }}</strong> Títulos</div>
                  <div class="db-stat"><strong>{{ habilitaciones.length }}</strong> Habilitaciones</div>
                  <div class="db-stat"><strong>{{ schools.length }}</strong> Colegios</div>
                  <div class="db-stat"><strong>{{ inspections.length }}</strong> Inspecciones</div>
                </div>
              </div>
            </div>
            
            <div class="warning-banner">
              <AlertTriangle :size="20" />
              <p>La base de datos es local. Si borras los datos del navegador o cambias de computadora, perderás esta información a menos que realices un respaldo (Exportar).</p>
            </div>
          </div>
        </div>

        <!-- Titles Section -->
        <div v-if="activeTab === 'titles_list'" class="animate-fade">
          <div class="section-header">
            <div>
              <h1>Registro de Títulos</h1>
              <p>Gestiona los títulos automotores escaneados.</p>
            </div>
            <button class="btn btn-primary" @click="activeTab = 'titles_scan'">
              <Plus :size="18" /> Escanear Título
            </button>
          </div>
          <TitlesTable 
            :titles="filteredTitles" 
            @delete="deleteTitle" 
            @view="viewTitleDetails" 
          />
        </div>

        <div v-if="activeTab === 'titles_scan'">
          <div class="section-header">
            <h1>Escaneo de Títulos</h1>
            <button class="btn" @click="activeTab = 'titles_list'">Cancelar</button>
          </div>
          <TitleScanner @title-extracted="handleTitleAdded" />
        </div>

        <!-- Habilitaciones Section -->
        <div v-if="activeTab === 'hab_list'" class="animate-fade">
          <div class="section-header">
            <div>
              <h1>Registro de Habilitaciones</h1>
              <p>Seguimiento de expedientes GestDoc y licencias.</p>
            </div>
            <button class="btn btn-primary" @click="activeTab = 'hab_scan'">
              <Plus :size="18" /> Nueva Habilitación
            </button>
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
        </div>

        <div v-if="activeTab === 'hab_scan'">
          <div class="section-header">
            <h1>Escaneo de Carátula (GestDoc)</h1>
            <button class="btn" @click="activeTab = 'hab_list'">Cancelar</button>
          </div>
          <HabilitacionScanner @habilitacion-extracted="handleHabilitacionAdded" />
        </div>

        <!-- Schools Section -->
        <div v-if="activeTab === 'school_list'" class="animate-fade">
          <div class="section-header">
            <div>
              <h1>Relación con Colegios</h1>
              <p>Gestiona los certificados de colegios y su vinculación con transportistas.</p>
            </div>
            <button class="btn btn-primary" @click="activeTab = 'school_scan'">
              <Plus :size="18" /> Escanear Certificado
            </button>
          </div>
          <SchoolsTable 
            :schools="filteredSchools" 
            :habilitaciones="habilitaciones"
            @delete="deleteSchool" 
            @view="viewSchoolDetails" 
          />
        </div>

        <div v-if="activeTab === 'school_scan'">
          <div class="section-header">
            <h1>Escaneo de Certificado de Colegio</h1>
            <button class="btn" @click="activeTab = 'school_list'">Cancelar</button>
          </div>
          <SchoolScanner @school-extracted="handleSchoolAdded" />
        </div>

        <!-- Inspections Section -->
        <div v-if="activeTab === 'insp_list'" class="animate-fade">
          <div class="section-header">
            <div>
              <h1>Control de Inspecciones</h1>
              <p>Seguimiento técnico de las unidades habilitadas.</p>
            </div>
            <div class="header-actions-group">
              <button class="btn btn-secondary" @click="activeTab = 'insp_scan'">
                <Scissors :size="18" /> Escanear Acta
              </button>
              <button class="btn btn-primary" @click="activeTab = 'insp_new'">
                <Plus :size="18" /> Nueva Inspección
              </button>
            </div>
          </div>
          <InspectionsTable 
            :inspections="filteredInspections" 
            @delete="deleteInspeccion" 
            @view="viewInspectionDetails" 
            @print="handlePrintInspection"
          />
        </div>

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
      </div>
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
