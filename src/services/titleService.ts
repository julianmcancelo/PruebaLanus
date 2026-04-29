import axios from 'axios';

export interface TitleData {
  dominio: string;
  registroSeccional: string;
  tramite: string;
  controlWeb: string;
  titular: string;
  cuilTitular: string;
  marca: string;
  modelo: string;
  tipo: string;
  motor: string;
  chasis: string;
  anioFabricacion: string;
  anioModelo: string;
  fechaInscripcion: string;
  domicilio: string;
  localidad: string;
  provincia: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function extractTitleData(imageBases64: string[]): Promise<TitleData> {
  const images = imageBases64.map(base64 => ({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${base64}` }
  }));

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise OCR assistant for Argentine Vehicle Titles (Título Digital de Propiedad del Automotor). Extract all technical and personal data. Respond ONLY with JSON.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract these fields:
              - dominio (Número de dominio o patente del vehículo)
              - registroSeccional (Name and code, e.g. "SAN ISIDRO N° 04 (01140)")
              - tramite (Número de trámite)
              - controlWeb (Número de control web)
              - titular (Nombre completo del titular)
              - cuilTitular (CUIL or CUIT of the owner, include all digits)
              - marca
              - modelo
              - tipo
              - motor (Número de motor)
              - chasis (Número de chasis)
              - anioFabricacion (Año de fabricación)
              - anioModelo (Año modelo)
              - fechaInscripcion (Fecha de inscripción inicial)
              - domicilio (Street and number)
              - localidad
              - provincia
              
              Return a JSON object with these keys exactly.`
            },
            ...images
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return JSON.parse(response.data.choices[0].message.content) as TitleData;
}
