import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// Helper to clean internal codes and formatting symbols from values
function cleanValue(val: any): string {
  if (val === undefined || val === null) return '---';
  let str = String(val);
  
  // Remove starting/middle CP- (case-insensitive) from the model/text
  str = str.replace(/\bCP-/gi, '');
  
  // Remove any stray $ symbols
  str = str.replace(/\$/g, '');
  
  // Normalize double whitespaces
  str = str.replace(/\s+/g, ' ');
  
  return str.trim() || '---';
}

// Cleans template XMLs inside the zip of any stray $ symbols preceding tags (like ${var} or $---)
function sanitizeTemplateXML(zip: PizZip) {
  for (const fileName in zip.files) {
    if (fileName.endsWith('.xml')) {
      let fileContent = zip.files[fileName].asText();
      
      // Safe lookahead: Match $ only if followed by optional XML tags and an opening brace {
      // This deletes the $ character itself without touching, deleting or corrupting any XML tags!
      fileContent = fileContent.replace(/\$(?=(?:<[^>]*>)*\{)/g, '');
      
      // Also remove any literal $ followed by dashes (like $---)
      fileContent = fileContent.replace(/\$--+/g, '---');
      
      // Save sanitized XML back into PizZip
      zip.file(fileName, fileContent);
    }
  }
}

export async function generateResolutionDOCX(type: 'escolar' | 'remis', data: any) {
  const templatePath = type === 'escolar' 
    ? '/templates/Resoluciones/resolucion_escolar_template.docx'
    : '/templates/Resoluciones/resolucion_remis_template.docx';

  try {
    const response = await fetch(templatePath);
    const content = await response.arrayBuffer();
    const zip = new PizZip(content);
    
    // Sanitize the Word template ZIP XMLs before rendering
    sanitizeTemplateXML(zip);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Determine gender (M/F)
    let gender = data.person?.gender?.toUpperCase();
    
    // Simple heuristic if gender is missing: check if names end in 'A'
    if (!gender && data.hab?.titular) {
      const firstName = data.hab.titular.trim().split(' ').pop() || '';
      gender = firstName.endsWith('A') ? 'F' : 'M';
    } else if (!gender) {
      gender = 'M';
    }

    const isFemale = gender === 'F';
    const tratamiento = isFemale ? 'la Sra.' : 'el Sr.';

    // Process and sanitize data for template
    const rawTitular = data.person ? `${data.person.surname}, ${data.person.names}` : (data.hab?.titular || '---');
    
    const templateData = {
      expediente_nro: cleanValue(data.hab?.nroExpediente),
      tratamiento: tratamiento,
      titular_nombre: cleanValue(rawTitular),
      titular_con_tratamiento: `${tratamiento} ${cleanValue(rawTitular)}`,
      titular_dni: cleanValue(data.person?.idNumber || data.hab?.idNumber),
      titular_domicilio_calle: cleanValue(data.person?.address || data.hab?.address),
      titular_domicilio_localidad: cleanValue(data.person?.city || data.hab?.locality || 'LANÚS'),
      vehiculo_marca: cleanValue(data.title?.marca),
      vehiculo_modelo: cleanValue(data.title?.modelo),
      vehiculo_inscripcion_inicial: cleanValue(data.title?.fechaInscripcion),
      vehiculo_tipo: cleanValue(data.title?.tipo),
      vehiculo_dominio: cleanValue(data.hab?.dominio),
      licencia_nro: cleanValue(data.hab?.nroLicencia),
      propiedad_de: isFemale ? 'de su propiedad, la Sra.' : 'de su propiedad, el Sr.',
      domiciliada: isFemale ? 'domiciliada' : 'domiciliado',
      vehiculo_anho: cleanValue(data.title?.anioModelo),
      vehiculo_anho_short: cleanValue((data.title?.anioModelo || '').toString().slice(-2)),
      // Remis specific (Agencia receptora)
      expte_remiseria: cleanValue(data.remiseria?.expediente),
      cuenta_remiseria: cleanValue(data.remiseria?.cuenta),
      nombre_remiseria: cleanValue(data.remiseria?.nombre),
      domicilio_remiseria: cleanValue(data.remiseria?.domicilio),
      vehiculo_motor: cleanValue(data.title?.motor),
    };

    doc.render(templateData);

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const clean = (str: string) => (str || '').replace(/[^a-zA-Z0-9-]/g, '_').trim();
    let name = '';
    let surname = '';
    if (data.person) {
      name = clean(data.person.names);
      surname = clean(data.person.surname);
    } else if (data.hab?.titular) {
      if (data.hab.titular.includes(',')) {
        const parts = data.hab.titular.split(',');
        surname = clean(parts[0]);
        name = clean(parts[1]);
      } else {
        name = clean(data.hab.titular);
      }
    }
    const cleanDominio = clean(data.hab?.dominio || 'S-D');
    const cleanExp = clean(data.hab?.nroExpediente || 'S-E');
    
    const fullNamePart = [name, surname].filter(Boolean).join('_');
    const filename = `Resolucion_${fullNamePart}_${cleanDominio}_${cleanExp}.docx`.replace(/__+/g, '_');

    saveAs(out, filename);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw error;
  }
}

export async function generateElevacionTribunalDOCX(data: any) {
  const templatePath = '/templates/ELEVACIONTRIBUNAL.docx';

  try {
    const response = await fetch(templatePath);
    const content = await response.arrayBuffer();
    const zip = new PizZip(content);
    
    // Sanitize the Word template ZIP XMLs before rendering
    sanitizeTemplateXML(zip);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Determine gender (M/F)
    const gender = data.person?.gender?.toUpperCase() || 'M';
    const isFemale = gender === 'F';

    // Process and sanitize data for template
    const rawTitular = data.person ? `${data.person.surname}, ${data.person.names}` : (data.hab?.titular || '---');

    const templateData = {
      expediente_nro: cleanValue(data.hab?.nroExpediente),
      tratamiento: isFemale ? 'la Sra.' : 'el Sr.',
      titular_nombre: cleanValue(rawTitular),
      titular_dni: cleanValue(data.person?.idNumber || data.hab?.idNumber),
      titular_domicilio: cleanValue(data.person?.address || data.hab?.address),
      titular_localidad: cleanValue(data.person?.city || data.hab?.locality || 'LANÚS'),
      vehiculo_marca: cleanValue(data.title?.marca),
      vehiculo_modelo: cleanValue(data.title?.modelo),
      vehiculo_dominio: cleanValue(data.hab?.dominio),
      licencia_nro: cleanValue(data.hab?.nroLicencia),
      fecha_hoy: new Date().toLocaleDateString('es-AR'),
      anho_actual: new Date().getFullYear(),
      tribunal_nro: data.tribunalNro || '1',
    };

    doc.render(templateData);

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const clean = (str: string) => (str || '').replace(/[^a-zA-Z0-9-]/g, '_').trim();
    let name = '';
    let surname = '';
    if (data.person) {
      name = clean(data.person.names);
      surname = clean(data.person.surname);
    } else if (data.hab?.titular) {
      if (data.hab.titular.includes(',')) {
        const parts = data.hab.titular.split(',');
        surname = clean(parts[0]);
        name = clean(parts[1]);
      } else {
        name = clean(data.hab.titular);
      }
    }
    const cleanDominio = clean(data.hab?.dominio || 'S-D');
    const cleanExp = clean(data.hab?.nroExpediente || 'S-E');
    
    const fullNamePart = [name, surname].filter(Boolean).join('_');
    const filename = `Elevacion_Tribunal_${fullNamePart}_${cleanDominio}_${cleanExp}.docx`.replace(/__+/g, '_');

    saveAs(out, filename);
  } catch (error) {
    console.error('Error generating Elevacion DOCX:', error);
    throw error;
  }
}
