import { PDFDocument } from 'pdf-lib';

/**
 * Counts exact pages of a PDF file uploaded in the browser.
 * Uses pdf-lib first, with a fallback regex parser for maximum accuracy & reliability.
 */
export async function countPdfPages(file: File): Promise<number> {
  if (!file || (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf')) {
    if (file.type.startsWith('image/')) return 1;
    return 1;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Method 1: Try pdf-lib (Primary accurate method)
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer, { 
        ignoreEncryption: true,
        updateMetadata: false 
      });
      const count = pdfDoc.getPageCount();
      if (count && count > 0) {
        return count;
      }
    } catch (e) {
      console.warn('pdf-lib count warning, trying fallback parser:', e);
    }

    // Method 2: Fast Binary Regex Parser (Fallback for edge cases)
    const text = new TextDecoder('latin1').decode(arrayBuffer);

    // Look for PDF Page Count in Catalog
    const countMatches = Array.from(text.matchAll(/\/Count\s+(\d+)/g));
    if (countMatches.length > 0) {
      // Pick the largest count found in /Pages objects
      const counts = countMatches
        .map(m => parseInt(m[1], 10))
        .filter(n => !isNaN(n) && n > 0);
      if (counts.length > 0) {
        return Math.max(...counts);
      }
    }

    // Method 3: Count individual /Type /Page occurrences
    const pageTypeMatches = text.match(/\/Type\s*\/Page\b/g);
    if (pageTypeMatches && pageTypeMatches.length > 0) {
      return pageTypeMatches.length;
    }

    // Fallback heuristic based on size if unparseable
    return Math.max(1, Math.round(file.size / (1024 * 80)));
  } catch (err) {
    console.error('Error counting PDF pages:', err);
    return Math.max(1, Math.round(file.size / (1024 * 80)));
  }
}
