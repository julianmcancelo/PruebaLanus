import axios from 'axios';

export interface InspectionData {
  dominio: string;
  fecha: string;
  resultado: string;
  observaciones: string;
  checklist: any[];
  titularName: string;
  idNumber: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function extractInspectionData(imageBases64: string[]): Promise<InspectionData> {
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
          content: `You are a precise OCR assistant for Municipal Vehicle Inspection forms (Certificado de Verificación de Transporte - Lanús).
          Extract all data from the form.
          
          Important: The checklist items correspond to specific rows in the form.
          For each row, determine if it is "Bien", "Regul", or "Malo".
          
          Respond ONLY with a JSON object.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract these fields:
              - dominio (Vehicle plate)
              - fecha (Inspection date)
              - titularName (Owner name)
              - idNumber (Owner DNI)
              - nroExpediente (File number)
              - nroLicencia (License number)
              - resultado (Determine from overall status, usually 'APROBADO' if everything is 'Bien')
              - observaciones (General comments)
              - checklist: Array of objects { id, label, status ('Bien', 'Regul', 'Malo'), motivo }.
                Items to extract:
                1. Pta. accionada cond. para desc./ asc. (Puerta derecha)
                2. Pta. accionada cond. para desc./ asc. (Puerta izquierda)
                3. Salida de Emer. indep. de la plataf. asc. / desc.
                4. Vent. Vidrio Temp. / inastillable
                5. Pisos rec. con mat. Antideslizables
                6. Dimens. de Banquetas
                7. Asientos: Fijos, Acolchados, Estructu. metalicas
                8. Puerta Izquierda de la Carroceria
                9. Cinturones de Seguridad
                10. Cabezales o apoya Cabeza
                11. Espacios Libres
                12. Pintura (Carroceria baja y capot naranja)
                13. Leyenda de "Escolares" o "Niños"
              
              Return a JSON object.`
            },
            ...images
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return JSON.parse(response.data.choices[0].message.content) as InspectionData;
}
