import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configureErrorReporting,
  installGlobalErrorHandlers,
  reportUnexpectedError,
  resetErrorReportingForTests,
} from "../src/lib/errorReporting";
import { validateErrorReportPayload } from "../shared/contracts/error-report";

describe("alpha error reporting", () => {
  afterEach(() => {
    resetErrorReportingForTests();
    vi.restoreAllMocks();
  });

  it("redacts sensitive text and rejects unknown fields", () => {
    expect(validateErrorReportPayload({
      version: "git-0123456789abcdef",
      category: "javascript",
      message: "alpha@example.test Bearer secret eyJabcdefgh.ijklmnop.qrstuvwx google_id=116454642023353142354 state={gold:500}",
      surface: "window",
    })).toMatchObject({
      message: "[email-redacted] Bearer [redacted] [jwt-redacted] google_id=[redacted] state=[redacted]",
    });
    expect(validateErrorReportPayload({
      version: "local-dev",
      category: "react",
      message: "failure",
      surface: "app",
      gameState: {},
    })).toBeNull();
  });

  it("deduplicates equivalent failures and swallows transport outages", async () => {
    const transport = vi.fn().mockRejectedValue(new Error("collector offline"));
    configureErrorReporting(transport);
    const error = new Error("render failed for alpha@example.test");

    await reportUnexpectedError({ category: "react", error, surface: "app" });
    await reportUnexpectedError({ category: "javascript", error, surface: "window" });

    expect(transport).toHaveBeenCalledOnce();
    expect(transport).toHaveBeenCalledWith(expect.objectContaining({
      message: "render failed for [email-redacted]",
    }));
  });

  it("captures global errors and unhandled rejections", async () => {
    const transport = vi.fn(async () => undefined);
    configureErrorReporting(transport);
    const uninstall = installGlobalErrorHandlers();

    window.dispatchEvent(new ErrorEvent("error", { error: new Error("global failure") }));
    const rejection = new Event("unhandledrejection") as PromiseRejectionEvent;
    Object.defineProperty(rejection, "reason", { value: new Error("promise failure") });
    window.dispatchEvent(rejection);

    await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(2));
    expect(transport).toHaveBeenCalledWith(expect.objectContaining({ category: "javascript" }));
    expect(transport).toHaveBeenCalledWith(expect.objectContaining({ category: "unhandledrejection" }));
    uninstall();
  });
});
