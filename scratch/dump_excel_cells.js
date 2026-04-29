import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function dumpCells() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '../public/templates/ActaInspeccionTemplate.xlsx');
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  console.log('Dumping all non-empty cells:');
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      const value = cell.value;
      if (value) {
        console.log(`Cell ${cell.address}: ${JSON.stringify(value)}`);
      }
    });
  });
}

dumpCells().catch(console.error);
