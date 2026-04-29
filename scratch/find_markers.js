import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findMarkers() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '../public/templates/ActaInspeccionTemplate.xlsx');
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  console.log('Searching for markers...');
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.includes('$')) {
        console.log(`FOUND at ${cell.address}: ${val}`);
      }
    });
  });
}

findMarkers().catch(console.error);
