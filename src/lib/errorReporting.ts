import {
  sanitizeDiagnosticText,
  type ErrorReportCategory,
  type ErrorReportPayload,
} from "../../shared/contracts/error-report";
import { BUILD_VERSION } from "./buildVersion";

type ErrorReportTransport = (payload: ErrorReportPayload) => Promise<void>;
type ErrorReportInput = {
  category: ErrorReportCategory;
  error: unknown;
  stack?: string;
  requestId?: string;
  errorCode?: string;
  httpStatus?: number;
  surface: string;
};

const DEDUPLICATION_WINDOW_MS = 30_000;
const recentReports = new Map<string, number>();
let transport: ErrorReportTransport | null = null;

function errorDetails(error: unknown, stackOverride?: string): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: sanitizeDiagnosticText(error.message || error.name, 500),
      ...(stackOverride || error.stack ? { stack: sanitizeDiagnosticText(stackOverride ?? error.stack ?? "", 4_000) } : {}),
    };
  }
  if (typeof error === "string") return { message: sanitizeDiagnosticText(error, 500) };
  return { message: "Unknown technical error" };
}

function pruneRecentReports(now: number): void {
  for (const [fingerprint, reportedAt] of recentReports) {
    if (now - reportedAt > DEDUPLICATION_WINDOW_MS) recentReports.delete(fingerprint);
  }
}

export function configureErrorReporting(nextTransport: ErrorReportTransport): void {
  transport = nextTransport;
}

export async function reportUnexpectedError(input: ErrorReportInput): Promise<void> {
  if (!transport) return;
  const details = errorDetails(input.error, input.stack);
  const payload: ErrorReportPayload = {
    version: BUILD_VERSION,
    category: input.category,
    message: details.message,
    ...(details.stack ? { stack: details.stack } : {}),
    ...(input.requestId ? { requestId: sanitizeDiagnosticText(input.requestId, 128) } : {}),
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    ...(input.httpStatus ? { httpStatus: input.httpStatus } : {}),
    surface: input.surface,
  };
  const fingerprint = payload.category === "api_4xx" || payload.category === "api_5xx"
    ? [payload.category, payload.message, payload.errorCode ?? "", payload.httpStatus ?? "", payload.surface].join("|")
    : [payload.message, payload.stack ?? ""].join("|");
  const now = Date.now();
  pruneRecentReports(now);
  if (recentReports.has(fingerprint)) return;
  recentReports.set(fingerprint, now);
  try {
    await transport(payload);
  } catch {
    // Error reporting is best effort and must never hide the original failure.
  }
}

export function installGlobalErrorHandlers(): () => void {
  const onError = (event: ErrorEvent) => {
    void reportUnexpectedError({
      category: "javascript",
      error: event.error ?? event.message,
      surface: "window",
    });
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    void reportUnexpectedError({
      category: "unhandledrejection",
      error: event.reason,
      surface: "window",
    });
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}

export function resetErrorReportingForTests(): void {
  transport = null;
  recentReports.clear();
}
