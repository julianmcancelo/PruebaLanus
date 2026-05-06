import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import type { DniData } from './dniService';
import Dexie, { type Table } from 'dexie';

// Legacy DB for migration
export class LegacyDatabase extends Dexie {
  people!: Table<any>;
  titles!: Table<any>;
  habilitaciones!: Table<any>;
  schools!: Table<any>;
  inspecciones!: Table<any>;

  constructor() {
    super('PdfPlatformDB');
    this.version(7).stores({
      people: '++id, idNumber, surname, names, timestamp',
      titles: '++id, dominio, titular, tramite, controlWeb, timestamp',
      habilitaciones: '++id, idPersona, idChofer, idCelador, dominio, nroExpediente, nroLicencia, email, phone, timestamp',
      schools: '++id, nombre, idNumberTitular, dominio, domicilio, timestamp',
      inspecciones: '++id, dominio, fecha, resultado, observaciones, checklist, timestamp'
    });
  }
}

export const legacyDb = new LegacyDatabase();

export interface PersonRecord extends DniData {
  id?: string;
  timestamp: any;
  photo?: string;
}

// Helper to convert Firestore snapshots to arrays
const snapshotToArray = (snapshot: any) => {
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));
};

// PEOPLE
export async function savePerson(person: DniData) {
  if (!person.idNumber) {
    console.warn('Intento de guardar persona sin DNI');
    const docRef = await addDoc(collection(db, 'people'), { ...person, timestamp: serverTimestamp() });
    return docRef.id;
  }

  // Check for duplicate by DNI (idNumber)
  const q = query(collection(db, 'people'), where('idNumber', '==', person.idNumber));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    console.log('Persona duplicada detectada (DNI:', person.idNumber, '), actualizando...');
    const existingDoc = snapshot.docs[0];
    await updateDoc(existingDoc.ref, {
      ...person,
      updatedAt: serverTimestamp()
    });
    return existingDoc.id;
  }

  console.log('Registrando nueva persona:', person.surname);
  const docRef = await addDoc(collection(db, 'people'), {
    ...person,
    timestamp: serverTimestamp()
  });
  return docRef.id;
}

export async function getAllPeople() {
  const q = query(collection(db, 'people'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
}

export async function deletePersonById(id: string) {
  await deleteDoc(doc(db, 'people', id));
}

export async function updatePerson(id: string, data: Partial<PersonRecord>) {
  const personRef = doc(db, 'people', id);
  // Remove ID from data to avoid saving it as a field
  const { id: _, ...updateData } = data;
  await updateDoc(personRef, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
}

// TITLES
export async function saveTitle(titleData: any) {
  // Check for duplicate by Patente (dominio)
  if (titleData.dominio) {
    const q = query(collection(db, 'titles'), where('dominio', '==', titleData.dominio));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      console.log('Título duplicado detectado (Dominio:', titleData.dominio, '), actualizando...');
      const existingDoc = snapshot.docs[0];
      await updateDoc(existingDoc.ref, {
        ...titleData,
        updatedAt: serverTimestamp()
      });
      return existingDoc.id;
    }
  }

  console.log('Registrando nuevo título:', titleData.dominio);
  const docRef = await addDoc(collection(db, 'titles'), {
    ...titleData,
    timestamp: serverTimestamp()
  });
  return docRef.id;
}

export async function getAllTitles() {
  const q = query(collection(db, 'titles'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
}

export async function deleteTitleById(id: string) {
  await deleteDoc(doc(db, 'titles', id));
}

export async function updateTitle(id: string, data: any) {
  const titleRef = doc(db, 'titles', id);
  const { id: _, ...updateData } = data;
  await updateDoc(titleRef, updateData);
}

// HABILITACIONES
export async function saveHabilitacion(data: any) {
  const docRef = await addDoc(collection(db, 'habilitaciones'), {
    ...data,
    timestamp: serverTimestamp()
  });
  return docRef.id;
}

export async function getAllHabilitaciones() {
  const q = query(collection(db, 'habilitaciones'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
}

export async function deleteHabilitacionById(id: string) {
  await deleteDoc(doc(db, 'habilitaciones', id));
}

export async function updateHabilitacion(id: string, data: any) {
  const habRef = doc(db, 'habilitaciones', id);
  const { id: _, ...updateData } = data;
  await updateDoc(habRef, updateData);
}

// SCHOOLS
export async function saveSchool(data: any) {
  // Check for duplicate by name
  if (data.nombre) {
    const q = query(collection(db, 'schools'), where('nombre', '==', data.nombre));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      await updateDoc(existingDoc.ref, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return existingDoc.id;
    }
  }

  const docRef = await addDoc(collection(db, 'schools'), {
    ...data,
    timestamp: serverTimestamp()
  });
  return docRef.id;
}

export async function getAllSchools() {
  const q = query(collection(db, 'schools'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
}

export async function deleteSchoolById(id: string) {
  await deleteDoc(doc(db, 'schools', id));
}

export async function updateSchool(id: string, data: any) {
  const schoolRef = doc(db, 'schools', id);
  const { id: _, ...updateData } = data;
  await updateDoc(schoolRef, updateData);
}

// INSPECCIONES
export async function saveInspeccion(data: any) {
  const docRef = await addDoc(collection(db, 'inspecciones'), {
    ...data,
    timestamp: serverTimestamp()
  });
  return docRef.id;
}

export async function getAllInspecciones() {
  const q = query(collection(db, 'inspecciones'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
}

export async function deleteInspeccionById(id: string) {
  await deleteDoc(doc(db, 'inspecciones', id));
}

export async function getInspectionsByDominio(dominio: string) {
  const q = query(collection(db, 'inspecciones'), where('dominio', '==', dominio));
  const snapshot = await getDocs(q);
  return snapshotToArray(snapshot);
}

// MIGRATION TOOL (From Dexie to Firestore)
export async function exportLegacyDatabase() {
  const data = {
    people: await legacyDb.people.toArray(),
    titles: await legacyDb.titles.toArray(),
    habilitaciones: await legacyDb.habilitaciones.toArray(),
    schools: await legacyDb.schools.toArray(),
    inspecciones: await legacyDb.inspecciones.toArray(),
  };
  return data;
}

export async function migrateToFirestore(backupData: any) {
  const collections = ['people', 'titles', 'habilitaciones', 'schools', 'inspecciones'];
  
  for (const colName of collections) {
    const items = backupData[colName] || [];
    for (const item of items) {
      // Use the original ID as the document ID in Firestore to preserve relationships
      const { id, ...data } = item;
      const docId = String(id); 
      await setDoc(doc(db, colName, docId), {
        ...data,
        migratedAt: serverTimestamp()
      });
    }
  }
}

