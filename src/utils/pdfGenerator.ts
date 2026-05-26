import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from './logo';

export function generateInspectionPDF(inspection: any, title: any, hab: any) {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // 1. HEADER LOGO & INFO
  try {
    doc.addImage(logoBase64, 'PNG', 10, 10, 80, 25);
  } catch (e) {
    console.error('Error adding logo:', e);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('Lanús GOBIERNO', 10, 25);
  }

  // Top Right Header Tables
  doc.setLineWidth(0.3);
  // Box 1
  doc.rect(125, 10, 75, 15);
  doc.setFontSize(8);
  doc.text('Subsecretaria de', 127, 14);
  doc.text('Ordenamiento', 127, 17);
  doc.text('Urbano', 127, 20);
  doc.line(155, 10, 155, 25);
  doc.text('Direccion Gral. de', 157, 14);
  doc.text('Movilidad y Transporte', 157, 17);

  // Box 2
  doc.rect(125, 25, 30, 15);
  doc.text('Certificado', 127, 29);
  doc.text('Verificacion', 127, 33);
  doc.text('Transporte', 127, 37);

  // Box 3 (Fecha/Hora)
  doc.rect(155, 25, 45, 15);
  doc.text(`Fecha: ${inspection.fecha}`, 157, 29);
  doc.text(`Hora: ${new Date().toLocaleTimeString().substring(0, 5)}`, 157, 37);

  // 2. EXPTE & LICENCIA
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Expte. N°:`, 10, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(hab?.nroExpediente || '---', 40, 50);

  doc.setFont('helvetica', 'bold');
  doc.text(`Licencia N°:`, 125, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(hab?.nroLicencia || '---', 155, 50);

  // 3. MAIN DATA TABLES (Titular & Vehiculo)
  const titularData = [
    ['Apellido y nombre:', inspection.titularName || hab?.titular || '---'],
    ['Documento:', inspection.idNumber || hab?.idNumber || '---'],
    ['Direccion:', inspection.address || '---'],
    ['Año Habilitación:', hab?.anioHabilitacion || new Date().getFullYear().toString()],
  ];

  const vehiculoData = [
    ['Dominio:', inspection.dominio || '---'],
    ['Marca:', title?.marca || '---'],
    ['Modelo:', title?.modelo || '---'],
    ['Año:', title?.anioModelo || '---'],
    ['Tipo:', title?.tipo || 'TRANSPORTE DE PASAJEROS'],
  ];

  autoTable(doc, {
    startY: 55,
    margin: { left: 10, right: 10 },
    body: titularData.map((row, i) => [
      { content: row[0], styles: { fontStyle: 'bold', width: 35 } },
      { content: row[1] },
      { content: vehiculoData[i] ? vehiculoData[i][0] : '', styles: { fontStyle: 'bold', width: 25 } },
      { content: vehiculoData[i] ? vehiculoData[i][1] : '' }
    ]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: [0, 0, 0] },
    head: [[
      { content: 'Datos del titular', colSpan: 2, styles: { fillColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'Datos del vehiculo', colSpan: 2, styles: { fillColor: [255, 255, 255], fontStyle: 'bold' } }
    ]],
  });

  // 4. CHECKLIST TABLE
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalles y Observaciones del vehiculo', pageWidth / 2, (doc as any).lastAutoTable.finalY + 8, { align: 'center' });

  const checklistRows = inspection.checklist.map((item: any) => [
    item.label,
    item.status === 'Bien' ? 'X' : '',
    item.status === 'Regul' ? 'X' : '',
    item.status === 'Malo' ? 'X' : '',
    '', // Si
    '', // no
    item.motivo || ''
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 12,
    head: [['Descripcion', 'Bien', 'Regul', 'Malo', 'Si', 'no', 'Motivo']],
    body: checklistRows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'italic', halign: 'center' },
    columnStyles: {
      0: { width: 95 },
      1: { halign: 'center', width: 10 },
      2: { halign: 'center', width: 10 },
      3: { halign: 'center', width: 10 },
      4: { halign: 'center', width: 10 },
      5: { halign: 'center', width: 10 },
      6: { width: 35 }
    }
  });

  // 5. FOOTER & SIGNATURES
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Plazo para regularizar: 10 dias habiles', 10, finalY);
  
  doc.setLineWidth(0.5);
  doc.line(20, finalY + 25, 90, finalY + 25);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma del interesado', 35, finalY + 30);
  
  // Agent Signature
  const storedFirma = localStorage.getItem('agente_firma_digital');
  if (storedFirma) {
    try {
      const isDigital = localStorage.getItem('agente_firma_cert_meta');
      const w = 54;
      const h = isDigital ? 18 : 22; // Perfect aspect ratio (3:1 for digital cert, ~2.4:1 for drawn)
      doc.addImage(storedFirma, 'PNG', pageWidth - 80, finalY + 3, w, h);
    } catch (e) {
      console.error('Error drawing agent signature in Inspection PDF:', e);
    }
  }

  doc.line(pageWidth - 90, finalY + 25, pageWidth - 20, finalY + 25);
  doc.text('Firma del agente', pageWidth - 70, finalY + 30);

  doc.save(`Inspeccion_${inspection.dominio}_${inspection.fecha}.pdf`);
}

export function generateHabilitacionPDF(hab: any, person: any, title: any, driver: any, attendant: any, schools: any[]) {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Outer Border
  doc.setLineWidth(1);
  doc.rect(5, 5, pageWidth - 10, 287);
  doc.setLineWidth(0.2);
  doc.rect(7, 7, pageWidth - 14, 283);

  // Header
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO DE HABILITACIÓN', pageWidth / 2, 30, { align: 'center' });
  doc.setFontSize(14);
  doc.text('TRANSPORTE ESCOLAR / PASAJEROS', pageWidth / 2, 40, { align: 'center' });
  
  doc.line(40, 45, pageWidth - 40, 45);

  // Main Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL EXPEDIENTE', 20, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Expediente N°: ${hab.nroExpediente || '---'}`, 20, 70);
  doc.text(`Licencia N°: ${hab.nroLicencia || '---'}`, 120, 70);

  // Titular Box
  doc.rect(20, 80, pageWidth - 40, 35);
  doc.setFont('helvetica', 'bold');
  doc.text('TITULAR DE LA HABILITACIÓN', 25, 87);
  doc.setFont('helvetica', 'normal');
  const isJuridica = person?.tipoPersona === 'juridica';
  const titularName = person 
    ? (isJuridica 
        ? `${person.surname} ${person.tipoSocietario || ''}`.trim()
        : `${person.surname || ''}, ${person.names || ''}`)
    : (hab.titular || '---');
  doc.text(`Nombre: ${titularName}`, 25, 95);
  const idLabel = isJuridica ? 'CUIT' : 'DNI';
  doc.text(`${idLabel}: ${person?.idNumber || hab.idNumber || '---'}`, 25, 102);
  doc.text(`Contacto: ${hab.email || '---'} / ${hab.phone || '---'}`, 25, 109);

  // Vehiculo Box
  doc.rect(20, 120, pageWidth - 40, 35);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL VEHÍCULO', 25, 127);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dominio: ${hab.dominio || '---'}`, 25, 135);
  doc.text(`Marca/Modelo: ${title?.marca || '---'} - ${title?.modelo || '---'}`, 25, 142);
  doc.text(`Año / Tipo: ${title?.anioModelo || '---'} / ${title?.tipo || '---'}`, 120, 142);
  doc.text(`Motor/Chasis: ${title?.motor || '---'} / ${title?.chasis || '---'}`, 25, 149);

  // Personal Box
  doc.rect(20, 160, pageWidth - 40, 35);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSONAL A BORDO', 25, 167);
  doc.setFont('helvetica', 'normal');
  doc.text(`Chofer: ${driver ? `${driver.surname || ''}, ${driver.names || ''} (${driver.idNumber || ''})` : '---'}`, 25, 175);
  doc.text(`Celador/a: ${attendant ? `${attendant.surname || ''}, ${attendant.names || ''} (${attendant.idNumber || ''})` : '---'}`, 25, 185);

  // Schools Table
  doc.setFont('helvetica', 'bold');
  doc.text('COLEGIOS Y ESTABLECIMIENTOS VINCULADOS', 20, 210);
  
  const schoolRows = (schools || []).map(s => [s.nombre || '---', s.domicilio || '---']);
  autoTable(doc, {
    startY: 215,
    margin: { left: 20, right: 20 },
    head: [['Establecimiento Educativo', 'Dirección']],
    body: schoolRows.length ? schoolRows : [['SIN COLEGIOS VINCULADOS', '---']],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [63, 81, 181] }
  });

  // Seal / Signature
  const finalY = 270;
  doc.setFontSize(8);
  doc.text('Este certificado debe exhibirse en un lugar visible de la unidad.', pageWidth / 2, finalY - 10, { align: 'center' });
  
  // Agent Signature on the left
  const storedFirma = localStorage.getItem('agente_firma_digital');
  if (storedFirma) {
    try {
      const isDigital = localStorage.getItem('agente_firma_cert_meta');
      const w = 54;
      const h = isDigital ? 18 : 22; // Perfect aspect ratio (3:1 for digital cert, ~2.4:1 for drawn)
      doc.addImage(storedFirma, 'PNG', 20, finalY - 5, w, h);
    } catch (e) {
      console.error('Error drawing agent signature in Habilitacion PDF:', e);
    }
  }
  doc.line(20, finalY + 15, 75, finalY + 15);
  doc.text('FIRMA AUTORIZADA', 47, finalY + 20, { align: 'center' });

  doc.rect(pageWidth - 70, finalY, 50, 20); // Placeholder for QR or Seal
  doc.text('SELLO MUNICIPAL', pageWidth - 45, finalY + 12, { align: 'center' });

  doc.save(`Certificado_Habilitacion_${hab.dominio}.pdf`);
}

export function generateResolutionPDF(type: 'escolar' | 'remis', data: any) {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // 1. Header Logo
  try {
    doc.addImage(logoBase64, 'PNG', 15, 12, 70, 22);
  } catch (e) {
    console.error('Error adding logo:', e);
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Provincia de Buenos Aires', 15, 42);
  doc.text('Municipio de Lanús', 15, 46);
  doc.text('Secretaria de Seguridad Ciudadana y Ordenamiento Urbano', 15, 50);
  
  // Right aligned Expediente info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`LANÚS, ${new Date().toLocaleDateString('es-AR')}`, pageWidth - 15, 25, { align: 'right' });
  doc.text(`RESOLUCIÓN N° _________________`, pageWidth - 15, 32, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Expte. N°: ${data.hab?.nroExpediente || '---'}`, pageWidth - 15, 39, { align: 'right' });
  
  doc.line(15, 55, pageWidth - 15, 55);
  
  // Setup data variables
  const isJuridica = data.person?.tipoPersona === 'juridica';
  let gender = data.person?.gender?.toUpperCase();
  if (!gender && data.hab?.titular && !isJuridica) {
    const firstName = data.hab.titular.trim().split(' ').pop() || '';
    gender = firstName.endsWith('A') ? 'F' : 'M';
  } else if (!gender) {
    gender = 'M';
  }
  const isFemale = gender === 'F';
  
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
  
  const titular_dni = data.person?.idNumber || data.hab?.idNumber || '---';
  const titular_domicilio_calle = data.person?.address || data.hab?.address || '---';
  const titular_domicilio_localidad = data.person?.city || data.hab?.locality || 'LANÚS';
  const vehiculo_marca = data.title?.marca || '---';
  const vehiculo_modelo = data.title?.modelo || '---';
  const vehiculo_inscripcion_inicial = data.title?.fechaInscripcion || '---';
  const vehiculo_tipo = data.title?.tipo || 'TRANSPORTE';
  const vehiculo_dominio = data.hab?.dominio || '---';
  const vehiculo_anho = data.title?.anioModelo || '---';
  const licencia_nro = data.hab?.nroLicencia || '---';
  
  const textLeft = 15;
  const maxW = pageWidth - 30;
  let currentY = 62;
  
  // Section: VISTO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VISTO:', textLeft, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  let vistoText = '';
  if (type === 'remis') {
    vistoText = `el Decreto N° 0773/2016 del Municipio de Lanús; el Expediente Electrónico N° ${data.hab?.nroExpediente || '---'}, y;`;
  } else {
    vistoText = `el Art. 17 del Decreto-Ley N° 16.378/57 incorporado por la Ley N° 7.396; los Arts. 33 y SS. y 39 del Decreto Reglamentario N° 6.864/58; lo establecido en el Decreto N° 0773/2016 del Municipio de Lanús, la Resolución N° 122/18 y el Expediente Electrónico N° ${data.hab?.nroExpediente || '---'}, y;`;
  }
  
  const vistoLines = doc.splitTextToSize(vistoText, maxW - 15);
  doc.text(vistoLines, textLeft + 15, currentY);
  currentY += vistoLines.length * 5 + 4;
  
  // Section: CONSIDERANDO
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIDERANDO:', textLeft, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 5;
  
  let consParagraphs: string[] = [];
  if (type === 'remis') {
    const expte_remiseria = data.remiseria?.expediente || '---';
    const cuenta_remiseria = data.remiseria?.cuenta || '---';
    const nombre_remiseria = data.remiseria?.nombre || '---';
    const domicilio_remiseria = data.remiseria?.domicilio || '---';
    
    consParagraphs = [
      `Que, por el expediente mencionado en el Visto, ${tratamiento} ${rawTitular}, con DNI/CUIT N° ${titular_dni}, quien fija domicilio en la calle ${titular_domicilio_calle} (${titular_domicilio_localidad}), solicita se autorice al vehículo marca ${vehiculo_marca}, modelo ${vehiculo_modelo}, año ${vehiculo_anho}, dominio ${vehiculo_dominio}, a prestar servicio como automóvil de alquiler con chofer en el "Servicio de Remis", en la agencia declarada mediante Expediente Electrónico N° ${expte_remiseria} bajo N° de Cuenta ${cuenta_remiseria}.`,
      `Que, de la documentación acompañada se desprende que el vehículo y las circunstancias particulares del titular cumplen con la normativa legal vigente establecida por la Ordenanza N° 10776 y sus modificatorias pertinentes.`,
      `Que, el Señor Secretario de Seguridad Ciudadana y Ordenamiento Urbano se encuentra plenamente facultado y designado para resolver de acuerdo al artículo primero del Decreto N° 5.148/2023 y el ANEXO que forma parte integrante del mismo.`
    ];
  } else {
    consParagraphs = [
      `Que, por el expediente mencionado en el Visto, ${tratamiento} ${rawTitular}, con DNI/CUIT N° ${titular_dni}, quien fija domicilio en la calle ${titular_domicilio_calle} (${titular_domicilio_localidad}), solicita se autorice al vehículo marca ${vehiculo_marca}, modelo ${vehiculo_modelo}, con fecha de Inscripción Inicial ${vehiculo_inscripcion_inicial}, tipo ${vehiculo_tipo}, dominio ${vehiculo_dominio}, a prestar servicio en la jurisdicción del Municipio de Lanús como transporte escolar durante el presente período.`,
      `Que, de la documentación acompañada se desprende que el vehículo y las circunstancias particulares de su titular cumplen satisfactoriamente con la normativa provincial y municipal que reglamenta dicha actividad comercial.`,
      `Que, asimismo la unidad de transporte móvil ha sido debidamente presentada a la verificación técnica ocular del personal de inspección del Municipio de Lanús, encontrándose en óptimas condiciones mecánicas y reglamentarias.`,
      `Que, el Señor Secretario de Seguridad Ciudadana y Ordenamiento Urbano se encuentra plenamente designado para resolver según el artículo primero del Decreto N° 5.148/2023 y el ANEXO que forma parte integrante del mismo.`
    ];
  }
  
  consParagraphs.forEach(p => {
    const lines = doc.splitTextToSize(p, maxW);
    doc.text(lines, textLeft, currentY);
    currentY += lines.length * 4.5 + 3;
  });
  
  currentY += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Por ello;', textLeft, currentY);
  currentY += 6;
  
  doc.text('EL SECRETARIO DE SEGURIDAD CIUDADANA Y ORDENAMIENTO URBANO', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.text('RESUELVE:', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;
  
  // Section: ARTICULOS
  doc.setFont('helvetica', 'normal');
  let artParagraphs: string[] = [];
  if (type === 'remis') {
    const nombre_remiseria = data.remiseria?.nombre || '---';
    const domicilio_remiseria = data.remiseria?.domicilio || '---';
    const vehiculo_motor = data.title?.motor || '---';
    
    artParagraphs = [
      `ARTÍCULO 1°: Autorízase la habilitación del automotor en el Servicio de Remis, Licencia N° ${licencia_nro}, a partir de la fecha de rúbrica de la presente y con validez por el plazo de un año, declarado, ${tratamiento} ${rawTitular}, en la Agencia Receptora de pedidos de Remis denominada "${nombre_remiseria}", ubicada en la calle ${domicilio_remiseria}, cuyas características del automotor se detallan: Marca ${vehiculo_marca}, modelo ${vehiculo_modelo}, año ${vehiculo_anho}, motor N° ${vehiculo_motor}, dominio ${vehiculo_dominio}, de propiedad del titular registrado.`,
      `ARTÍCULO 2º: La unidad móvil autorizada en el Art. 1º, deberá contar obligatoriamente y al día, durante todo el período en que la misma se encuentre vigente, con la Verificación Técnica Vehicular (VTV) semestral y con la póliza de Seguro vigente pertinente que le corresponde por la categoría declarada.`,
      `ARTÍCULO 3º: La presente Resolución será refrendada por el Señor Subsecretario de Ordenamiento Urbano del Municipio de Lanús.`,
      `ARTÍCULO 4º: Regístrese, dese al Registro Oficial de Resoluciones y Boletín Oficial municipal; tomen conocimiento y la intervención Dirección General de Movilidad y Transporte, y la Dirección General de Fiscalización y Control; notifíquese, y oportunamente archívese.`
    ];
  } else {
    artParagraphs = [
      `ARTÍCULO 1°: Autorízase la habilitación, en carácter de renovación, para el corriente Ciclo Lectivo del automotor marca ${vehiculo_marca}, modelo ${vehiculo_modelo}, año ${vehiculo_anho}, dominio ${vehiculo_dominio}, Licencia N° ${licencia_nro}, de propiedad de ${propiedadDe} ${rawTitular}, con DNI/CUIT N° ${titular_dni}, ${domiciliada} en la calle ${titular_domicilio_calle} (${titular_domicilio_localidad}), destinado única y exclusivamente al transporte escolar.`,
      `ARTÍCULO 2º: La vigencia de la autorización otorgada en el Art. 1, comenzará a partir de la fecha de rúbrica del presente acto administrativo y su validez será por el plazo del ciclo lectivo escolar, de conformidad con lo establecido en el Artículo 9 de la Resolución N° 122/18 del Municipio.`,
      `ARTÍCULO 3º: La unidad móvil autorizada en el Art. 1º, deberá contar obligatoriamente y al día, durante todo el ciclo en que la misma se encuentre vigente, con la Verificación Técnica Vehicular (VTV) la que deberá realizarse, al menos SEMESTRALMENTE, bajo apercibimiento de caducidad automática de la habilitación concedida.`,
      `ARTÍCULO 4º: Regístrese, comuníquese a la Dirección General de Movilidad y Transporte para su conocimiento y control de la actividad, notifíquese al interesado para sus efectos legales y, oportunamente, archívese.`
    ];
  }
  
  artParagraphs.forEach(art => {
    const lines = doc.splitTextToSize(art, maxW);
    // Check page overflow
    if (currentY + (lines.length * 4.5) > 235) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(lines, textLeft, currentY);
    currentY += lines.length * 4.5 + 4;
  });
  
  // Footer Signature
  currentY += 5;
  if (currentY > 235) {
    doc.addPage();
    currentY = 30;
  }
  
  const finalY = currentY + 12;
  const storedFirma = localStorage.getItem('agente_firma_digital');
  if (storedFirma) {
    try {
      const isDigital = localStorage.getItem('agente_firma_cert_meta');
      const w = 54;
      const h = isDigital ? 18 : 22;
      doc.addImage(storedFirma, 'PNG', pageWidth - 80, finalY - 10, w, h);
    } catch (e) {
      console.error('Error drawing agent signature in Resolution PDF:', e);
    }
  }
  
  doc.setLineWidth(0.4);
  doc.line(pageWidth - 85, finalY + 15, pageWidth - 15, finalY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FIRMA Y SELLO', pageWidth - 50, finalY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Secretaria de Seguridad Ciudadana', pageWidth - 50, finalY + 24, { align: 'center' });
  doc.text('y Ordenamiento Urbano', pageWidth - 50, finalY + 28, { align: 'center' });
  
  const typeLabel = type === 'remis' ? 'Remis' : 'Escolar';
  doc.save(`Resolucion_${typeLabel}_${vehiculo_dominio}.pdf`);
}

export function generateElevacionTribunalPDF(data: any) {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // 1. Header Logo
  try {
    doc.addImage(logoBase64, 'PNG', 15, 12, 70, 22);
  } catch (e) {
    console.error('Error adding logo:', e);
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Provincia de Buenos Aires', 15, 42);
  doc.text('Municipio de Lanús', 15, 46);
  doc.text('Dirección General de Movilidad y Transporte', 15, 50);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`LANÚS, ${new Date().toLocaleDateString('es-AR')}`, pageWidth - 15, 25, { align: 'right' });
  doc.text(`ELEVACIÓN AL TRIBUNAL DE FALTAS N° ${data.tribunalNro || '1'}`, pageWidth - 15, 32, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Expte. N°: ${data.hab?.nroExpediente || '---'}`, pageWidth - 15, 39, { align: 'right' });
  
  doc.line(15, 55, pageWidth - 15, 55);
  
  // Setup data variables
  const isJuridica = data.person?.tipoPersona === 'juridica';
  let gender = data.person?.gender?.toUpperCase();
  if (!gender && data.hab?.titular && !isJuridica) {
    const firstName = data.hab.titular.trim().split(' ').pop() || '';
    gender = firstName.endsWith('A') ? 'F' : 'M';
  } else if (!gender) {
    gender = 'M';
  }
  const isFemale = gender === 'F';
  
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
  
  const titular_dni = data.person?.idNumber || data.hab?.idNumber || '---';
  const titular_domicilio = data.person?.address || data.hab?.address || '---';
  const titular_localidad = data.person?.city || data.hab?.locality || 'LANÚS';
  const vehiculo_marca = data.title?.marca || '---';
  const vehiculo_modelo = data.title?.modelo || '---';
  const vehiculo_dominio = data.hab?.dominio || '---';
  const licencia_nro = data.hab?.nroLicencia || '---';
  
  const textLeft = 15;
  const maxW = pageWidth - 30;
  let currentY = 70;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`AL SEÑOR JUEZ DEL TRIBUNAL DE FALTAS N° ${data.tribunalNro || '1'}`, textLeft, currentY);
  currentY += 6;
  doc.text('S           /           D', textLeft, currentY);
  currentY += 12;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const introText = `Tengo el agrado de dirigirme a usted, en mi carácter de autoridad de la Dirección General de Movilidad y Transporte del Municipio de Lanús, con el objeto de elevar para su intervención y resolución las actuaciones administrativas recaídas sobre el Expediente Electrónico de Habilitación N° ${data.hab?.nroExpediente || '---'}.`;
  const introLines = doc.splitTextToSize(introText, maxW);
  doc.text(introLines, textLeft, currentY);
  currentY += introLines.length * 6 + 6;
  
  const bodyText1 = `Las presentes actuaciones se motivan en la fiscalización del servicio de transporte público/privado de pasajeros en el ámbito de nuestra jurisdicción, identificando las siguientes características particulares del titular y de la unidad móvil habilitada:`;
  const bodyLines1 = doc.splitTextToSize(bodyText1, maxW);
  doc.text(bodyLines1, textLeft, currentY);
  currentY += bodyLines1.length * 6 + 8;
  
  // Data block (Key-Value)
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA UNIDAD Y TITULAR:', textLeft, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 6;
  
  const dataDetails = [
    `• Titular Registrado: ${rawTitular} (${tratamiento})`,
    `• Documento Identidad (DNI/CUIT): ${titular_dni}`,
    `• Domicilio Declarado: ${titular_domicilio}, ${titular_localidad}`,
    `• Vehículo Habilitado: Marca ${vehiculo_marca}, Modelo ${vehiculo_modelo}`,
    `• Dominio / Patente: ${vehiculo_dominio}`,
    `• Número de Licencia Habilitante: ${licencia_nro}`
  ];
  
  dataDetails.forEach(line => {
    doc.text(line, textLeft + 5, currentY);
    currentY += 6;
  });
  
  currentY += 4;
  
  const bodyText2 = `Se elevan formalmente las presentes actuaciones en un todo de acuerdo con las normativas municipales vigentes reguladas por el Decreto N° 0773/2016, a fin de que ese Tribunal de Faltas tome la debida intervención que estime corresponder y proceda con las diligencias legales que correspondan.`;
  const bodyLines2 = doc.splitTextToSize(bodyText2, maxW);
  doc.text(bodyLines2, textLeft, currentY);
  currentY += bodyLines2.length * 6 + 10;
  
  const closingText = `Sin otro particular, y quedando a su entera disposición para cualquier aclaración o ampliación de las presentes actuaciones, saludo a usted con mi más distinguida consideración y respeto.`;
  const closingLines = doc.splitTextToSize(closingText, maxW);
  doc.text(closingLines, textLeft, currentY);
  currentY += closingLines.length * 6 + 15;
  
  // Signature Area
  const finalY = currentY + 12;
  const storedFirma = localStorage.getItem('agente_firma_digital');
  if (storedFirma) {
    try {
      const isDigital = localStorage.getItem('agente_firma_cert_meta');
      const w = 54;
      const h = isDigital ? 18 : 22;
      doc.addImage(storedFirma, 'PNG', pageWidth - 80, finalY - 10, w, h);
    } catch (e) {
      console.error('Error drawing agent signature in Elevacion PDF:', e);
    }
  }
  
  doc.setLineWidth(0.4);
  doc.line(pageWidth - 85, finalY + 15, pageWidth - 15, finalY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FIRMA Y SELLO', pageWidth - 50, finalY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Dirección General de Movilidad y Transporte', pageWidth - 50, finalY + 24, { align: 'center' });
  doc.text('Subsecretaría de Ordenamiento Urbano', pageWidth - 50, finalY + 28, { align: 'center' });
  
  doc.save(`Elevacion_Tribunal_${vehiculo_dominio}.pdf`);
}
