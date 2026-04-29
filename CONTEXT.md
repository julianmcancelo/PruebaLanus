# Plataforma PDF - Contexto del Proyecto

Esta es una plataforma integral para la gestión de **Habilitaciones de Transporte e Inspecciones**, diseñada para ser rápida, privada (local-first) y con una estética profesional premium.

## 🛠️ Stack Tecnológico
- **Core:** Vue 3 (Composition API) + Vite + TypeScript.
- **Base de Datos:** Dexie.js (IndexedDB) - Almacenamiento local en el navegador.
- **Diseño:** CSS Vanilla con sistema de variables, estética "Premium Light" (Paleta Slate/Indigo).
- **Documentación:** 
  - `ExcelJS` para actas de inspección.
  - `Docxtemplater` + `PizZip` para resoluciones y elevaciones a tribunal (DOCX).
  - `jspdf` para certificados y actas rápidas.
- **IA / OCR:** Integración con GPT-4o mini para extracción de datos desde imágenes/PDFs (DNI, Títulos Automotor, Carátulas GestDoc).

## 📂 Estructura de Datos (Tablas Dexie)
1.  **People:** Datos de conductores y titulares (DNI, nombres, dirección, foto).
2.  **Titles:** Títulos del automotor (Dominio, marca, modelo, motor, chasis).
3.  **Habilitaciones:** Expedientes administrativos (Nro Exp, Licencia, vinculación con Personas y Títulos).
4.  **Schools:** Registro de colegios vinculados a transporte escolar, con geolocalización.
5.  **Inspecciones:** Checklist de control vehicular y resultados técnicos.

## 🚀 Funcionalidades Clave
- **Escaneo Inteligente:** Carga de documentos mediante drag & drop o pegado (Ctrl+V) para extracción automática de datos.
- **Legajos Dinámicos:** Fichas completas que vinculan automáticamente personas con sus vehículos y expedientes.
- **Generación de Documentos:**
  - **Resoluciones:** Genera el DOCX oficial basado en el tipo de transporte.
  - **Elevación Tribunal:** Genera el documento de elevación usando la plantilla `ELEVACIONTRIBUNAL.docx`.
  - **Actas de Inspección:** Exportación directa a Excel preservando formatos oficiales.
- **Base de Datos Local:** Gestión completa de respaldos (Exportar JSON) para portabilidad de datos.

## 🎨 Guía de Estilo (Tema Clarito)
- **Fondo Principal:** `#f1f5f9` (Slate 100).
- **Contenedores:** Blanco puro (`#ffffff`) con sombras suaves (`box-shadow`).
- **Primario:** Indigo (`#4f46e5`).
- **Texto:** Slate 900 (`#0f172a`) para máxima legibilidad.

## 📋 Próximos Pasos / Notas para el Desarrollador
- Las plantillas DOCX se encuentran en `/public/templates/`.
- La lógica de generación de documentos reside en `src/services/resolutionService.ts`.
- Para el matching de datos, se utiliza el `dominio` (patente) y el `idNumber` (DNI/CUIT) como claves de vinculación entre tablas.
