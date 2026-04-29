import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkNamedRanges() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '../public/templates/ActaInspeccionTemplate.xlsx');
  await workbook.xlsx.readFile(filePath);
  
  console.log('Checking Named Ranges:');
  const worksheet = workbook.getWorksheet(1);
  // Unfortunately exceljs doesn't have a direct "eachNamedRange" on worksheet easily
  // but we can check the workbook.
  
  // workbook.definedNames is not public but let's check it loosely
  if (workbook.definedNames) {
    console.log(JSON.stringify(workbook.definedNames.model, null, 2));
  }
}

checkNamedRanges().catch(console.error);
