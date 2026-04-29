import axios from 'axios';

export interface HabilitacionExtractedData {
  nroExpediente: string;
  titular: string;
  idNumber: string;
  dominio: string;
  nroLicencia: string;
  tipoTramite: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

async function callOpenAIWithRetry(payload: any, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.post('https://api.openai.com/v1/chat/completions', payload, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      if (error.response?.status === 429 && i < retries - 1) {
        console.warn(`Rate limit reached. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

export async function extractHabilitacionData(imageBases64: string[]): Promise<HabilitacionExtractedData> {
  const images = imageBases64.map(base64 => ({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${base64}` }
  }));

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert in Argentine administrative documents (Expedientes GESTDOC). Extract key information from the cover sheet (Carátula).'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract these fields:
            - nroExpediente (e.g. "4000-1234/2026" or similar)
            - titular (Name of the person)
            - idNumber (DNI/CUIT)
            - dominio (Vehicle plate or "Patente")
            - nroLicencia (License number, it usually starts with "068-" followed by 4 or 5 digits, e.g., "068-0056")
            - tipoTramite (e.g. "HABILITACION", "RENOVACION")
            - email (Owner's email if present)
            - phone (Owner's phone number if present)
            
            Return ONLY a JSON object with these keys.`
          },
          ...images
        ]
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 500
  };

  const response: any = await callOpenAIWithRetry(payload);
  return JSON.parse(response.data.choices[0].message.content) as HabilitacionExtractedData;
}
