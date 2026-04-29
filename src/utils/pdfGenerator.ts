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
  const titularName = person ? `${person.surname || ''}, ${person.names || ''}` : (hab.titular || '---');
  doc.text(`Nombre: ${titularName}`, 25, 95);
  doc.text(`DNI / CUIT: ${person?.idNumber || hab.idNumber || '---'}`, 25, 102);
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
  
  doc.rect(pageWidth - 70, finalY, 50, 20); // Placeholder for QR or Seal
  doc.text('SELLO MUNICIPAL', pageWidth - 45, finalY + 12, { align: 'center' });

  doc.save(`Certificado_Habilitacion_${hab.dominio}.pdf`);
}
