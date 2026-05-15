const ExcelJS = require('exceljs');

async function checkExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('c:/Users/Jota/Documents/migracion/pdf-platform/public/templates/HABILITACIONES 2026 (1).xlsx');
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    console.log('No worksheets found');
    return;
  }
  
  console.log('Sheet Name:', worksheet.name);
  
  for (let r = 1; r <= 50; r++) {
    let rowValues = [];
    for (let c = 1; c <= 15; c++) {
      const cell = worksheet.getCell(r, c);
      const val = cell.value ? (typeof cell.value === 'object' ? JSON.stringify(cell.value) : cell.value) : '';
      rowValues.push(`${cell.address}:${val}`);
    }
    console.log(rowValues.join(' | '));
  }
}

checkExcel().catch(console.error);
