import axios from 'axios';

export interface SchoolExtractedData {
  nombre: string;
  domicilio: string;
  idNumberTitular: string;
  dominio: string;
  observaciones: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function extractSchoolData(imageBases64: string[]): Promise<SchoolExtractedData> {
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
          content: 'You are a highly precise OCR expert for Argentine municipal documents. Your task is to extract exact information from School Transportation Certificates (Certificados de Transporte Escolar) from Lanús.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract these fields:
              - nombre (Name of the School/Colegio)
              - domicilio (Address of the school)
              - idNumberTitular (DNI/CUIT of the transporter mentioned)
              - dominio (Vehicle plate mentioned in the certificate)
              - observaciones (Any other relevant data like year or period)
              
              Return ONLY a JSON object with these keys.`
            },
            ...images
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return JSON.parse(response.data.choices[0].message.content) as SchoolExtractedData;
}

export async function enrichSchoolData(schoolName: string): Promise<{ domicilio?: string; telefono?: string }> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an authoritative expert on educational institutions in the Partido of Lanús, Buenos Aires. You have access to official records and exact geographic locations.'
          },
          {
            role: 'user',
            content: `Identify the EXACT official address (Street, Number, and Locality) and official phone number for the school: "${schoolName}" in the district of Lanús. 
            Ensure the address is the real physical location in Lanús (West or East).
            Respond ONLY with a JSON object: { "domicilio": "CALLE NÚMERO, LANÚS", "telefono": "..." }. 
            Format the address as "Nombre de Calle Altura, Lanús".
            If you are not 100% sure of the exact height, provide the street and intersection.`
          }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error enriching school data:', error);
    return {};
  }
}
