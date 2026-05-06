import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Forzar el uso del motor integrado (Fake Worker) para evitar errores de red
// @ts-ignore
if (typeof window !== 'undefined' && 'Worker' in window) {
  // Solo intentamos configurar si estamos en el navegador
  // @ts-ignore
  import('pdfjs-dist/build/pdf.worker.mjs?url').then(m => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = m.default;
  }).catch(() => {
    console.warn("Usando motor de PDF integrado por precaución.");
  });
}

export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

export async function splitPdf(pdfBuffer: ArrayBuffer, pageIndices: number[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));
  return await newPdf.save();
}

export async function getPdfPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  const pdf = await PDFDocument.load(pdfBuffer);
  return pdf.getPageCount();
}

export function downloadPdf(data: Uint8Array, filename: string) {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function pdfToImages(pdfBuffer: ArrayBuffer): Promise<string[]> {
  const loadingTask = pdfjsLib.getDocument({ 
    data: pdfBuffer,
    // Configuraciones de compatibilidad extrema
    disableWorker: true,
    verbosity: 0
  });
  
  const pdf = await loadingTask.promise;
  const imageUrls: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      imageUrls.push(base64);
    }
    // Liberar memoria de la página
    page.cleanup();
  }

  return imageUrls;
}
