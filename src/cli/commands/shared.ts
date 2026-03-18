import { MagnusClient } from "../../core/api.js";
import { getDefaultServer } from "../../core/auth.js";

export class NoServerError extends Error {
  constructor() {
    super("No server specified. Use --server <url> or run: magnus login <url>");
    this.name = "NoServerError";
  }
}

export class AuthError extends Error {
  constructor(serverUrl: string) {
    super(`Failed to authenticate with ${serverUrl}. Run: magnus login`);
    this.name = "AuthError";
  }
}

/** Resolve the server URL from --server flag or default config */
export function resolveServer(opts: { server?: string }): string {
  const url = opts.server ?? getDefaultServer();
  if (!url) {
    throw new NoServerError();
  }
  return url;
}

/** Create an authenticated MagnusClient */
export async function getClient(serverUrl: string, opts?: Record<string, unknown>): Promise<MagnusClient> {
  const client = new MagnusClient({ verbose: Boolean(opts?.verbose) });
  const ok = await client.login(serverUrl);
  if (!ok) {
    throw new AuthError(serverUrl);
  }
  return client;
}
