const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".pdf"];

export interface ParsedFile {
  name: string;
  content: string;
  size: number;
}

export interface FileValidationError {
  name: string;
  reason: string;
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

function isAllowedFile(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) return false;
  const ext = getExtension(file.name);
  return ALLOWED_EXTENSIONS.includes(ext);
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

async function extractPDFText(file: File): Promise<string> {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdfjsLib = await import("pdfjs-dist");

    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageTexts: string[] = [];
    const maxPages = Math.min(pdf.numPages, 30);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item): item is Extract<typeof item, { str: string }> => "str" in item)
        .map((item) => item.str)
        .join(" ");
      if (pageText.trim()) {
        pageTexts.push(`[Page ${i}]\n${pageText.trim()}`);
      }
    }

    let result = pageTexts.join("\n\n---\n\n");
    if (pdf.numPages > maxPages) {
      result += `\n\n[Extracted ${maxPages} of ${pdf.numPages} pages]`;
    }

    return result || "[PDF contained no extractable text — may be image-based]";
  } catch {
    return "[Failed to extract PDF text — file may be corrupted or password-protected]";
  }
}

function truncateContent(text: string, maxChars: number = 8000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[Content truncated due to length]";
}

export function validateFiles(files: File[]): {
  valid: File[];
  errors: FileValidationError[];
} {
  const valid: File[] = [];
  const errors: FileValidationError[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push({ name: file.name, reason: "File too large (max 5MB)" });
    } else if (!isAllowedFile(file)) {
      errors.push({ name: file.name, reason: "Unsupported file type" });
    } else {
      valid.push(file);
    }
  }

  return { valid, errors };
}

export async function parseFiles(files: File[]): Promise<ParsedFile[]> {
  const results: ParsedFile[] = [];

  for (const file of files) {
    const ext = getExtension(file.name);

    if (ext === ".pdf") {
      const content = await extractPDFText(file);
      results.push({
        name: file.name,
        content: truncateContent(content),
        size: file.size,
      });
      continue;
    }

    const raw = await readFileAsText(file);
    results.push({
      name: file.name,
      content: truncateContent(raw),
      size: file.size,
    });
  }

  return results;
}

export function filesToContextString(parsed: ParsedFile[]): string {
  if (parsed.length === 0) return "";

  return parsed
    .map((f) => `<file name="${f.name}" type="${getExtension(f.name)}" size="${f.size}">\n${f.content}\n</file>`)
    .join("\n\n");
}
