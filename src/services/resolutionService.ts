import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

export async function generateResolutionDOCX(type: 'escolar' | 'remis', data: any) {
  const templatePath = type === 'escolar' 
    ? '/templates/Resoluciones/resolucion_escolar_template.docx'
    : '/templates/Resoluciones/resolucion_remis_template.docx';

  try {
    const response = await fetch(templatePath);
    const content = await response.arrayBuffer();
    const zip = new PizZip(content);
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

    // Process data for template
    const templateData = {
      expediente_nro: data.hab?.nroExpediente || '---',
      tratamiento: tratamiento,
      titular_nombre: data.person ? `${data.person.surname}, ${data.person.names}` : (data.hab?.titular || '---'),
      titular_con_tratamiento: `${tratamiento} ${data.person ? `${data.person.surname}, ${data.person.names}` : (data.hab?.titular || '---')}`,
      titular_dni: data.person?.idNumber || data.hab?.idNumber || '---',
      titular_domicilio_calle: data.person?.address || data.hab?.address || '---',
      titular_domicilio_localidad: data.person?.city || data.hab?.locality || 'LANÚS',
      vehiculo_marca: data.title?.marca || '---',
      vehiculo_modelo: data.title?.modelo || '---',
      vehiculo_inscripcion_inicial: data.title?.fechaInscripcion || '---',
      vehiculo_tipo: data.title?.tipo || '---',
      vehiculo_dominio: data.hab?.dominio || '---',
      licencia_nro: data.hab?.nroLicencia || '---',
      propiedad_de: isFemale ? 'de su propiedad, la Sra.' : 'de su propiedad, el Sr.',
      domiciliada: isFemale ? 'domiciliada' : 'domiciliado',
      vehiculo_anho: data.title?.anioModelo || '---',
      vehiculo_anho_short: (data.title?.anioModelo || '').toString().slice(-2),
      // Remis specific
      expte_remiseria: data.remiseria?.expediente || '---',
      cuenta_remiseria: data.remiseria?.cuenta || '---',
      nombre_remiseria: data.remiseria?.nombre || '---',
      domicilio_remiseria: data.remiseria?.domicilio || '---',
      vehiculo_motor: data.title?.motor || '---',
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
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Determine gender (M/F)
    const gender = data.person?.gender?.toUpperCase() || 'M';
    const isFemale = gender === 'F';

    // Process data for template
    const templateData = {
      expediente_nro: data.hab?.nroExpediente || '---',
      tratamiento: isFemale ? 'la Sra.' : 'el Sr.',
      titular_nombre: data.person ? `${data.person.surname}, ${data.person.names}` : (data.hab?.titular || '---'),
      titular_dni: data.person?.idNumber || data.hab?.idNumber || '---',
      titular_domicilio: data.person?.address || data.hab?.address || '---',
      titular_localidad: data.person?.city || data.hab?.locality || 'LANÚS',
      vehiculo_marca: data.title?.marca || '---',
      vehiculo_modelo: data.title?.modelo || '---',
      vehiculo_dominio: data.hab?.dominio || '---',
      licencia_nro: data.hab?.nroLicencia || '---',
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
