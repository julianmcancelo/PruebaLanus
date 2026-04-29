import axios from 'axios';

export interface DniData {
  surname: string;
  names: string;
  idNumber: string;
  birthDate: string;
  gender: string;
  address: string;
  city: string;
  province: string;
  nationality: string;
  processNumber: string;
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

export async function extractDniData(frontImageBase64: string, backImageBase64: string): Promise<DniData> {
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a precise OCR and data extraction assistant. Extract personal information from the provided ID card images (Argentine DNI). Respond ONLY with a JSON object.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract the following fields from these images: 
            - surname (Apellido)
            - names (Nombres)
            - idNumber (Documento)
            - birthDate (Fecha de Nacimiento, format DD/MM/YYYY)
            - gender (Sexo)
            - address (Domicilio)
            - city (Localidad)
            - province (Provincia)
            - nationality (Nacionalidad)
            - processNumber (N° de trámite - usually 11 digits on the front)
            
            Return as a JSON object with these keys exactly: surname, names, idNumber, birthDate, gender, address, city, province, nationality, processNumber.`
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${frontImageBase64}` }
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${backImageBase64}` }
          }
        ]
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 600
  };

  const response: any = await callOpenAIWithRetry(payload);

  const result = JSON.parse(response.data.choices[0].message.content);
  return result as DniData;
}
