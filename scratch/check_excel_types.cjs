const ExcelJS = require('exceljs');
const path = require('path');

async function checkValues() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join('public', 'templates', 'HABILITACIONES 2026 (1).xlsx'));
  const worksheet = workbook.worksheets[0];
  
  const cells = ['C7', 'G8', 'C14', 'G10', 'G16'];
  cells.forEach(c => {
    const cell = worksheet.getCell(c);
    console.log(`${c} type:`, typeof cell.value);
    console.log(`${c} value:`, JSON.stringify(cell.value));
  });
}

checkValues();
