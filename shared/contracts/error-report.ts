export const ERROR_REPORT_CATEGORIES = [
  "react",
  "javascript",
  "unhandledrejection",
  "timeout",
  "api_4xx",
  "api_5xx",
] as const;

export type ErrorReportCategory = (typeof ERROR_REPORT_CATEGORIES)[number];

export type ErrorReportPayload = {
  version: string;
  category: ErrorReportCategory;
  message: string;
  stack?: string;
  requestId?: string;
  errorCode?: string;
  httpStatus?: number;
  surface: string;
};

const ALLOWED_KEYS = new Set(["version", "category", "message", "stack", "requestId", "errorCode", "httpStatus", "surface"]);
const VERSION_PATTERN = /^(?:local-dev|git-[0-9a-f]{7,40})$/;
const SURFACE_PATTERN = /^[a-z0-9_./:-]{1,64}$/i;
const ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,64}$/;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const BEARER_PATTERN = /\bBearer\s+[^\s,;]+/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const SECRET_PARAMETER_PATTERN = /([?&#](?:access_token|refresh_token|token|apikey|authorization|email)=)[^&#\s]+/gi;
const GOOGLE_ID_PATTERN = /\b\d{16,24}\b/g;
const SENSITIVE_FIELD_PATTERN = /(["']?(?:state|resources|heroes|inventory|transcript|payload|command|email|access_token|refresh_token|authorization|google_id|user_id)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|\{[^}]*\}|\[[^\]]*\]|[^,\s}]+)/gi;

export function sanitizeDiagnosticText(value: string, maxLength: number): string {
  return value
    .replace(BEARER_PATTERN, "Bearer [redacted]")
    .replace(JWT_PATTERN, "[jwt-redacted]")
    .replace(EMAIL_PATTERN, "[email-redacted]")
    .replace(SECRET_PARAMETER_PATTERN, "$1[redacted]")
    .replace(GOOGLE_ID_PATTERN, "[google-id-redacted]")
    .replace(SENSITIVE_FIELD_PATTERN, "$1[redacted]")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function validateErrorReportPayload(value: unknown): ErrorReportPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !ALLOWED_KEYS.has(key))) return null;
  if (typeof record.version !== "string" || !VERSION_PATTERN.test(record.version)) return null;
  if (typeof record.category !== "string" || !ERROR_REPORT_CATEGORIES.includes(record.category as ErrorReportCategory)) return null;
  if (typeof record.message !== "string") return null;
  if (typeof record.surface !== "string" || !SURFACE_PATTERN.test(record.surface)) return null;
  if (record.stack !== undefined && typeof record.stack !== "string") return null;
  if (record.requestId !== undefined && typeof record.requestId !== "string") return null;
  if (record.errorCode !== undefined && (typeof record.errorCode !== "string" || !ERROR_CODE_PATTERN.test(record.errorCode))) return null;
  if (record.category === "api_4xx") {
    if (!Number.isInteger(record.httpStatus) || Number(record.httpStatus) < 400 || Number(record.httpStatus) > 499) return null;
  } else if (record.category === "api_5xx") {
    if (!Number.isInteger(record.httpStatus) || Number(record.httpStatus) < 500 || Number(record.httpStatus) > 599) return null;
  } else if (record.errorCode !== undefined || record.httpStatus !== undefined) return null;

  const message = sanitizeDiagnosticText(record.message, 500);
  const stack = record.stack === undefined ? undefined : sanitizeDiagnosticText(record.stack as string, 4_000);
  const requestId = record.requestId === undefined ? undefined : sanitizeDiagnosticText(record.requestId as string, 128);
  if (!message || (record.stack !== undefined && !stack) || (record.requestId !== undefined && !requestId)) return null;

  return {
    version: record.version,
    category: record.category as ErrorReportCategory,
    message,
    ...(stack ? { stack } : {}),
    ...(requestId ? { requestId } : {}),
    ...(typeof record.errorCode === "string" ? { errorCode: record.errorCode } : {}),
    ...(typeof record.httpStatus === "number" ? { httpStatus: record.httpStatus } : {}),
    surface: record.surface,
  };
}
