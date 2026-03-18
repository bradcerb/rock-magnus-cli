import pc from "picocolors";
import type { AxiosError } from "axios";

/** Wrap a command action with centralized error handling */
export function withErrorHandler<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      const message = formatError(error);
      console.error(pc.red(message));
      process.exitCode = 1;
    }
  };
}

function formatError(error: unknown): string {
  if (isAxiosError(error)) {
    const code = error.code;
    const status = error.response?.status;

    if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "EAI_AGAIN") {
      return `Could not connect to server. Check the URL and your network connection.`;
    }
    if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
      return `Request timed out. The server may be slow or unreachable.`;
    }
    if (status === 401 || status === 403) {
      return `Authentication failed. Run: magnus login`;
    }
    if (status === 404) {
      const url = error.config?.url ?? "";
      return `Resource not found: ${url}`;
    }
    if (status) {
      const data = error.response?.data;
      const detail = typeof data === "object" && data !== null && "message" in data
        ? (data as { message: string }).message
        : typeof data === "string" ? data : "";
      return `Server returned ${status}${detail ? `: ${detail}` : ""}`;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true
  );
}
