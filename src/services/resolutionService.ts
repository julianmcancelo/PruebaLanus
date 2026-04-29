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
    const gender = data.person?.gender?.toUpperCase() || 'M';
    const isFemale = gender === 'F';

    // Process data for template
    const templateData = {
      expediente_nro: data.hab?.nroExpediente || '---',
      tratamiento: isFemale ? 'la Sra.' : 'el Sr.',
      titular_nombre: data.person ? `${data.person.surname}, ${data.person.names}` : (data.hab?.titular || '---'),
      titular_dni: data.person?.idNumber || data.hab?.idNumber || '---',
      titular_domicilio_calle: data.person?.address || data.hab?.address || '---',
      titular_domicilio_localidad: data.person?.city || data.hab?.locality || 'LANÚS',
      vehiculo_marca: data.title?.marca || '---',
      vehiculo_modelo: data.title?.modelo || '---',
      vehiculo_inscripcion_inicial: data.title?.fechaInscripcion || '---',
      vehiculo_tipo: data.title?.tipo || '---',
      vehiculo_dominio: data.hab?.dominio || '---',
      licencia_nro: data.hab?.nroLicencia || '---',
      propiedad_de: 'su propiedad', // Both genders usually use "su propiedad" in this context
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

    saveAs(out, `Resolucion_${type.toUpperCase()}_${data.hab?.dominio || 'S-D'}.docx`);
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

    saveAs(out, `Elevacion_Tribunal_${data.hab?.dominio || 'S-D'}.docx`);
  } catch (error) {
    console.error('Error generating Elevacion DOCX:', error);
    throw error;
  }
}
