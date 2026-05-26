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

// Replaces the placeholder signature image (image2.png) inside the DOCX ZIP archive
function replaceSignatureInDocx(zip: PizZip) {
  const storedFirma = localStorage.getItem('agente_firma_digital');
  if (!storedFirma) return;
  
  try {
    // Extract base64 content
    const base64Content = storedFirma.split(',')[1] || storedFirma;
    
    // Decode base64 to binary string (PizZip natively accepts binary strings)
    const binaryString = atob(base64Content);
    
    // Replace the signature image placeholder (word/media/image2.png)
    if (zip.files['word/media/image2.png']) {
      zip.file('word/media/image2.png', binaryString, { binary: true });
    }
  } catch (error) {
    console.error('Error al estampar firma en el documento Word:', error);
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
    
    // Stamp the active digital signature into the document media folder
    replaceSignatureInDocx(zip);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const isJuridica = data.person?.tipoPersona === 'juridica';

    // Determine gender (M/F) if physical person
    let gender = data.person?.gender?.toUpperCase();
    if (!gender && data.hab?.titular && !isJuridica) {
      const firstName = data.hab.titular.trim().split(' ').pop() || '';
      gender = firstName.endsWith('A') ? 'F' : 'M';
    } else if (!gender) {
      gender = 'M';
    }

    const isFemale = gender === 'F';
    
    // Process and sanitize data for template
    let rawTitular = '---';
    let tratamiento = 'el Sr.';
    let propiedadDe = 'de su propiedad, el Sr.';
    let domiciliada = 'domiciliado';

    if (data.person) {
      if (isJuridica) {
        const societario = data.person.tipoSocietario || 'S.A.';
        const razonSocial = data.person.surname || '---';
        rawTitular = `${razonSocial} ${societario}`.trim();
        tratamiento = 'la firma';
        propiedadDe = 'de propiedad de la firma';
        domiciliada = 'con domicilio legal en';
      } else {
        rawTitular = `${data.person.surname}, ${data.person.names}`;
        tratamiento = isFemale ? 'la Sra.' : 'el Sr.';
        propiedadDe = isFemale ? 'de su propiedad, la Sra.' : 'de su propiedad, el Sr.';
        domiciliada = isFemale ? 'domiciliada' : 'domiciliado';
      }
    } else if (data.hab?.titular) {
      rawTitular = data.hab.titular;
      tratamiento = isFemale ? 'la Sra.' : 'el Sr.';
      propiedadDe = isFemale ? 'de su propiedad, la Sra.' : 'de su propiedad, el Sr.';
      domiciliada = isFemale ? 'domiciliada' : 'domiciliado';
    }

    const titularConTratamiento = isJuridica 
      ? `${tratamiento} ${cleanValue(rawTitular)}` 
      : `${tratamiento} ${cleanValue(rawTitular)}`;

    const templateData = {
      expediente_nro: cleanValue(data.hab?.nroExpediente),
      tratamiento: tratamiento,
      titular_nombre: cleanValue(rawTitular),
      titular_con_tratamiento: titularConTratamiento,
      titular_dni: cleanValue(data.person?.idNumber || data.hab?.idNumber),
      titular_domicilio_calle: cleanValue(data.person?.address || data.hab?.address),
      titular_domicilio_localidad: cleanValue(data.person?.city || data.hab?.locality || 'LANÚS'),
      vehiculo_marca: cleanValue(data.title?.marca),
      vehiculo_modelo: cleanValue(data.title?.modelo),
      vehiculo_inscripcion_inicial: cleanValue(data.title?.fechaInscripcion),
      vehiculo_tipo: cleanValue(data.title?.tipo),
      vehiculo_dominio: cleanValue(data.hab?.dominio),
      licencia_nro: cleanValue(data.hab?.nroLicencia),
      propiedad_de: propiedadDe,
      domiciliada: domiciliada,
      vehiculo_anho: cleanValue(data.title?.anioModelo),
      vehiculo_anho_short: cleanValue((data.title?.anioModelo || '').toString().slice(-2)),
      // Remis specific (Agencia receptora)
      expte_remiseria: cleanValue(data.remiseria?.expediente),
      cuenta_remiseria: cleanValue(data.remiseria?.cuenta),
      nombre_remiseria: cleanValue(data.remiseria?.nombre),
      domicilio_remiseria: cleanValue(data.remiseria?.domicilio),
      vehiculo_motor: cleanValue(data.title?.motor),
      // IGJ & Estatuto (Jurídica)
      titular_igj: cleanValue(data.person?.nroIgj),
      titular_igj_fecha: cleanValue(data.person?.fechaInscripcionIgj),
      titular_estatuto_fecha: cleanValue(data.person?.fechaEstatuto),
      representante_nombre: cleanValue(data.person?.repNombre),
      representante_dni: cleanValue(data.person?.repDni),
      representante_cargo: cleanValue(data.person?.repCargo),
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
      if (isJuridica) {
        surname = clean(data.person.surname);
        name = clean(data.person.tipoSocietario || 'SA_SRL');
      } else {
        name = clean(data.person.names);
        surname = clean(data.person.surname);
      }
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
    
    // Stamp the active digital signature into the document media folder
    replaceSignatureInDocx(zip);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const isJuridica = data.person?.tipoPersona === 'juridica';

    // Determine gender (M/F) if physical person
    const gender = data.person?.gender?.toUpperCase() || 'M';
    const isFemale = gender === 'F';

    // Process and sanitize data for template
    let rawTitular = '---';
    let tratamiento = 'el Sr.';

    if (data.person) {
      if (isJuridica) {
        const societario = data.person.tipoSocietario || 'S.A.';
        const razonSocial = data.person.surname || '---';
        rawTitular = `${razonSocial} ${societario}`.trim();
        tratamiento = 'la firma';
      } else {
        rawTitular = `${data.person.surname}, ${data.person.names}`;
        tratamiento = isFemale ? 'la Sra.' : 'el Sr.';
      }
    } else if (data.hab?.titular) {
      rawTitular = data.hab.titular;
      tratamiento = isFemale ? 'la Sra.' : 'el Sr.';
    }

    const templateData = {
      expediente_nro: cleanValue(data.hab?.nroExpediente),
      tratamiento: tratamiento,
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
      // IGJ & Estatuto (Jurídica)
      titular_igj: cleanValue(data.person?.nroIgj),
      titular_igj_fecha: cleanValue(data.person?.fechaInscripcionIgj),
      titular_estatuto_fecha: cleanValue(data.person?.fechaEstatuto),
      representante_nombre: cleanValue(data.person?.repNombre),
      representante_dni: cleanValue(data.person?.repDni),
      representante_cargo: cleanValue(data.person?.repCargo),
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
      if (isJuridica) {
        surname = clean(data.person.surname);
        name = clean(data.person.tipoSocietario || 'SA_SRL');
      } else {
        name = clean(data.person.names);
        surname = clean(data.person.surname);
      }
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
