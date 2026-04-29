import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper to handle BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

// --- PEOPLE ---
app.get('/api/people', async (req, res) => {
  const people = await prisma.personas.findMany({
    orderBy: { timestamp: 'desc' }
  });
  res.json(people);
});

app.post('/api/people', async (req, res) => {
  const data = req.body;
  const person = await prisma.personas.upsert({
    where: { idNumber: data.idNumber },
    update: { ...data, timestamp: BigInt(Date.now()) },
    create: { ...data, timestamp: BigInt(Date.now()) }
  });
  res.json(person);
});

app.delete('/api/people/:idNumber', async (req, res) => {
  await prisma.personas.delete({ where: { idNumber: req.params.idNumber } });
  res.json({ success: true });
});

app.patch('/api/people/:id', async (req, res) => {
  const person = await prisma.personas.update({
    where: { id: Number(req.params.id) },
    data: req.body
  });
  res.json(person);
});

// --- TITLES ---
app.get('/api/titles', async (req, res) => {
  const titles = await prisma.titulos.findMany({
    orderBy: { timestamp: 'desc' }
  });
  res.json(titles);
});

app.post('/api/titles', async (req, res) => {
  const data = req.body;
  const title = await prisma.titulos.upsert({
    where: { dominio: data.dominio },
    update: { ...data, timestamp: BigInt(Date.now()) },
    create: { ...data, timestamp: BigInt(Date.now()) }
  });
  res.json(title);
});

app.delete('/api/titles/:id', async (req, res) => {
  await prisma.titulos.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

app.patch('/api/titles/:id', async (req, res) => {
  const title = await prisma.titulos.update({
    where: { id: Number(req.params.id) },
    data: req.body
  });
  res.json(title);
});

// --- HABILITACIONES ---
app.get('/api/habilitaciones', async (req, res) => {
  const habs = await prisma.habilitaciones.findMany({
    orderBy: { timestamp: 'desc' }
  });
  res.json(habs);
});

app.post('/api/habilitaciones', async (req, res) => {
  const data = req.body;
  const hab = await prisma.habilitaciones.create({
    data: { ...data, timestamp: BigInt(Date.now()) }
  });
  res.json(hab);
});

app.delete('/api/habilitaciones/:id', async (req, res) => {
  await prisma.habilitaciones.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

app.patch('/api/habilitaciones/:id', async (req, res) => {
  const hab = await prisma.habilitaciones.update({
    where: { id: Number(req.params.id) },
    data: req.body
  });
  res.json(hab);
});

// --- SCHOOLS ---
app.get('/api/schools', async (req, res) => {
  const schools = await prisma.colegios.findMany({
    orderBy: { timestamp: 'desc' }
  });
  res.json(schools);
});

app.post('/api/schools', async (req, res) => {
  const data = req.body;
  const school = await prisma.colegios.upsert({
    where: { nombre: data.nombre },
    update: { ...data, timestamp: BigInt(Date.now()) },
    create: { ...data, timestamp: BigInt(Date.now()) }
  });
  res.json(school);
});

app.delete('/api/schools/:id', async (req, res) => {
  await prisma.colegios.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

app.patch('/api/schools/:id', async (req, res) => {
  const school = await prisma.colegios.update({
    where: { id: Number(req.params.id) },
    data: req.body
  });
  res.json(school);
});

// --- INSPECCIONES ---
app.get('/api/inspecciones', async (req, res) => {
  const inspections = await prisma.inspecciones.findMany({
    orderBy: { timestamp: 'desc' }
  });
  res.json(inspections);
});

app.post('/api/inspecciones', async (req, res) => {
  const data = req.body;
  const inspection = await prisma.inspecciones.create({
    data: { ...data, timestamp: BigInt(Date.now()) }
  });
  res.json(inspection);
});

app.get('/api/inspecciones/:dominio', async (req, res) => {
  const inspections = await prisma.inspecciones.findMany({
    where: { dominio: req.params.dominio }
  });
  res.json(inspections);
});

app.delete('/api/inspecciones/:id', async (req, res) => {
  await prisma.inspecciones.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

// --- MIGRATION / IMPORT ---
app.post('/api/import-backup', async (req, res) => {
  const { people, titles, habilitaciones, schools, inspecciones } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      // PEOPLE
      for (const p of people) {
        const data = {
          idNumber: p.idNumber,
          surname: p.surname,
          names: p.names,
          birthDate: p.birthDate,
          gender: p.gender,
          nationality: p.nationality,
          processNumber: p.processNumber,
          address: p.address,
          city: p.city,
          province: p.province,
          photo: p.photo,
          timestamp: BigInt(p.timestamp || Date.now())
        };
        await tx.personas.upsert({
          where: { idNumber: p.idNumber },
          update: data,
          create: data
        });
      }

      // TITLES
      for (const t of titles) {
        const data = {
          dominio: t.dominio,
          titular: t.titular,
          cuilTitular: t.cuilTitular,
          marca: t.marca,
          modelo: t.modelo,
          tipo: t.tipo,
          anioModelo: t.anioModelo,
          fechaInscripcion: t.fechaInscripcion,
          motor: t.motor,
          chasis: t.chasis,
          tramite: t.tramite,
          controlWeb: t.controlWeb,
          domicilio: t.domicilio,
          localidad: t.localidad,
          provincia: t.provincia,
          registroSeccional: t.registroSeccional,
          nroControl: t.nroControl,
          timestamp: BigInt(t.timestamp || Date.now())
        };
        await tx.titulos.upsert({
          where: { dominio: t.dominio },
          update: data,
          create: data
        });
      }

      // HABILITACIONES
      for (const h of habilitaciones) {
        await tx.habilitaciones.create({
          data: {
            idPersona: h.idPersona ? String(h.idPersona) : null,
            idChofer: h.idChofer ? String(h.idChofer) : null,
            idCelador: h.idCelador ? String(h.idCelador) : null,
            titular: h.titular,
            idNumber: h.idNumber ? String(h.idNumber) : null,
            address: h.address,
            locality: h.locality,
            dominio: h.dominio,
            nroExpediente: h.nroExpediente,
            nroLicencia: h.nroLicencia,
            email: h.email,
            phone: h.phone,
            tipoHabilitacion: h.tipoHabilitacion,
            timestamp: BigInt(h.timestamp || Date.now())
          }
        });
      }

      // SCHOOLS
      for (const s of schools) {
        const data = {
          nombre: s.nombre,
          idNumberTitular: s.idNumberTitular,
          dominio: s.dominio,
          domicilio: s.domicilio,
          lat: s.lat ? Number(s.lat) : null,
          lng: s.lng ? Number(s.lng) : null,
          timestamp: BigInt(s.timestamp || Date.now())
        };
        await tx.colegios.upsert({
          where: { nombre: s.nombre },
          update: data,
          create: data
        });
      }

      // INSPECCIONES
      for (const i of inspecciones) {
        await tx.inspecciones.create({
          data: {
            dominio: i.dominio,
            fecha: i.fecha,
            resultado: i.resultado,
            observaciones: i.observaciones,
            checklist: i.checklist,
            timestamp: BigInt(i.timestamp || Date.now())
          }
        });
      }
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Migration Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
