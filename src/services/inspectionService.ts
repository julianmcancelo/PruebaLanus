import axios from 'axios';

export interface InspectionData {
  dominio: string;
  fecha: string;
  tipo: 'Escolar' | 'Remis';
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
          content: `You are a precise OCR assistant for Municipal Vehicle Inspection forms from Lanús (Certificado de Verificación de Transporte).
          Extract all data from the form.
          
          Important: Determine if the inspection is for "Escolar" or "Remis".
          Extract the checklist items according to the form type.
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
              - tipo (Determine if "Escolar" or "Remis")
              - titularName (Owner name)
              - idNumber (Owner DNI/CUIT)
              - nroExpediente (File number)
              - nroLicencia (License number)
              - resultado (Overall status, e.g., 'APROBADO')
              - observaciones (General comments)
              - checklist: Array of objects { id, label, status ('Bien', 'Regul', 'Malo'), motivo }.
                Extract the items listed in the form. If it is a Remis, extract the relevant safety and technical items (e.g., Luces, Frenos, Neumáticos, Matafuegos, etc.).
              
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
