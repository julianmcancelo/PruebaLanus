# PDF Platform - Portable Version

Este repositorio contiene la plataforma completa de gestión de PDFs y registros, aislada y lista para ser desplegada en cualquier PC con Docker.

## 🚀 Despliegue Rápido (One-Click)

Para levantar toda la plataforma (Base de Datos, Backend, Frontend y Visor):

1. Abre una terminal en esta carpeta.
2. Ejecuta:
   ```bash
   docker-compose up -d --build
   ```

## 🌐 Servicios Disponibles

Una vez levantado, puedes acceder a:

*   **Plataforma (Frontend):** [http://localhost](http://localhost) (Puerto 80)
*   **Visor de Base de Datos (Adminer):** [http://localhost:8080](http://localhost:8080)
    *   **Motor:** PostgreSQL
    *   **Servidor:** `pdf_db`
    *   **Usuario:** `pdf_admin`
    *   **Contraseña:** `pdf_secure_pass_2026`
    *   **Base de Datos:** `pdf_db`

## 🛠️ Desarrollo Local (Fuera de Docker)

Si prefieres trabajar en el código sin usar los contenedores de Node:

1. Levanta solo la base de datos: `docker-compose up -d pdf_db`
2. En la carpeta raíz: `npm install && npm run dev` (Frontend)
3. En la carpeta `/backend`: `npm install && npm run dev` (Backend)

## 📦 Notas de Migración
Para pasar los datos de una PC a otra, puedes exportar el JSON desde la pestaña "Gestión de Datos" e importarlo en la nueva PC, o simplemente copiar la carpeta `pdf_postgres_data` si usas volúmenes locales.
