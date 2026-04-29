import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkTemplate() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '../public/templates/ActaInspeccionTemplate.xlsx');
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  console.log('Searching for placeholders with $...');
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      const value = cell.value;
      if (value && typeof value === 'string' && value.includes('$')) {
        console.log(`Cell ${cell.address}: "${value}"`);
      }
    });
  });
}

checkTemplate().catch(console.error);
