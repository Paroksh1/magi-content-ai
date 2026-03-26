const DANGEROUS_TAG_PATTERN = /<\s*\/?\s*(script|style|iframe|object|embed|form|input|textarea|select|button|meta|link|base|applet)[^>]*>/gi;
const EVENT_HANDLER_PATTERN = /\s+on\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URL_PATTERN = /href\s*=\s*["']\s*javascript:/gi;
const DATA_URL_PATTERN = /src\s*=\s*["']\s*data:/gi;

export function sanitizeHTML(html: string): string {
  return html
    .replace(DANGEROUS_TAG_PATTERN, "")
    .replace(EVENT_HANDLER_PATTERN, "")
    .replace(JAVASCRIPT_URL_PATTERN, 'href="')
    .replace(DATA_URL_PATTERN, 'src="');
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function normalizeAIHTML(raw: string): string {
  const sanitized = sanitizeHTML(raw.trim());
  if (!sanitized) return "";
  return sanitized.startsWith("<") ? sanitized : `<p>${sanitized}</p>`;
}
