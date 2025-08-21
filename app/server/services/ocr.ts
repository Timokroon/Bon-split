import Tesseract from 'tesseract.js';
import fs from 'fs';

export async function extractTextFromImage(filePath: string): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'nld+eng', {
      logger: m => console.log(m)
    });
    
    // Clean up the file after processing
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.warn("Could not delete temporary file:", error);
    }
    
    return text.trim();
  } catch (error) {
    console.error("OCR processing failed:", error);
    throw new Error("Failed to extract text from image: " + (error as Error).message);
  }
}
