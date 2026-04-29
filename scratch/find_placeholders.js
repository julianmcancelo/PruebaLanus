import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findAnyPlaceholder() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '../public/templates/ActaInspeccionTemplate.xlsx');
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  console.log('Searching for any placeholder-like string ($ or {})...');
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.includes('$') || val.includes('{') || val.includes('}')) {
        console.log(`Cell ${cell.address}: ${val}`);
      }
    });
  });
}

findAnyPlaceholder().catch(console.error);
