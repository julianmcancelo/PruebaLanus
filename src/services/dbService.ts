import axios from 'axios';
import { API_URL } from '../config';
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
  id?: number;
  timestamp: number;
  photo?: string;
}

// API CLIENT
const api = axios.create({ baseURL: API_URL });

export async function savePerson(person: DniData) {
  const res = await api.post('/people', person);
  return res.data;
}

export async function getAllPeople() {
  const res = await api.get('/people');
  return res.data;
}

export async function deletePersonById(idNumber: string) {
  const res = await api.delete(`/people/${idNumber}`);
  return res.data;
}

export async function updatePerson(id: number, data: Partial<PersonRecord>) {
  const res = await api.patch(`/people/${id}`, data);
  return res.data;
}

// Titles
export async function saveTitle(titleData: any) {
  const res = await api.post('/titles', titleData);
  return res.data;
}

export async function getAllTitles() {
  const res = await api.get('/titles');
  return res.data;
}

export async function deleteTitleById(id: number) {
  const res = await api.delete(`/titles/${id}`);
  return res.data;
}

export async function updateTitle(id: number, data: any) {
  const res = await api.patch(`/titles/${id}`, data);
  return res.data;
}

// Habilitaciones
export async function saveHabilitacion(data: any) {
  const res = await api.post('/habilitaciones', data);
  return res.data;
}

export async function getAllHabilitaciones() {
  const res = await api.get('/habilitaciones');
  return res.data;
}

export async function deleteHabilitacionById(id: number) {
  const res = await api.delete(`/habilitaciones/${id}`);
  return res.data;
}

export async function updateHabilitacion(id: number, data: any) {
  const res = await api.patch(`/habilitaciones/${id}`, data);
  return res.data;
}

// Schools
export async function saveSchool(data: any) {
  const res = await api.post('/schools', data);
  return res.data;
}

export async function getAllSchools() {
  const res = await api.get('/schools');
  return res.data;
}

export async function deleteSchoolById(id: number) {
  const res = await api.delete(`/schools/${id}`);
  return res.data;
}

export async function updateSchool(id: number, data: any) {
  const res = await api.patch(`/schools/${id}`, data);
  return res.data;
}

// Inspecciones
export async function saveInspeccion(data: any) {
  const res = await api.post('/inspecciones', data);
  return res.data;
}

export async function getAllInspecciones() {
  const res = await api.get('/inspecciones');
  return res.data;
}

export async function deleteInspeccionById(id: number) {
  const res = await api.delete(`/inspecciones/${id}`);
  return res.data;
}

export async function getInspectionsByDominio(dominio: string) {
  const res = await api.get(`/inspecciones/${dominio}`);
  return res.data;
}

// MIGRATION TOOL
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

export async function migrateToPostgres(backupData: any) {
  const res = await api.post('/import-backup', backupData);
  return res.data;
}
