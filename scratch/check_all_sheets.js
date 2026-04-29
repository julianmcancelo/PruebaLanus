import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkAllSheets() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '../public/templates/ActaInspeccionTemplate.xlsx');
  await workbook.xlsx.readFile(filePath);
  
  workbook.eachSheet((worksheet, sheetId) => {
    console.log(`Checking Sheet: ${worksheet.name}`);
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const val = cell.value ? cell.value.toString() : '';
        if (val.includes('$')) {
          console.log(`FOUND at ${worksheet.name}!${cell.address}: ${val}`);
        }
      });
    });
  });
}

checkAllSheets().catch(console.error);
