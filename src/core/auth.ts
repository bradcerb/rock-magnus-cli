import Conf from "conf";
import type { Credentials, MagnusConfig, ServerConfig } from "./types.js";

const config = new Conf<MagnusConfig>({
  projectName: "magnus-cli",
  schema: {
    servers: { type: "array", default: [] },
    defaultServer: { type: "string" },
  },
});

/** Normalize a server URL to scheme://authority */
export function normalizeServerUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
}

/** Add or update a server in the config */
export function saveServer(serverUrl: string, username: string): void {
  const url = normalizeServerUrl(serverUrl);
  const servers = config.get("servers");
  const existing = servers.find((s) => s.url === url);

  if (existing) {
    existing.username = username;
  } else {
    servers.push({ url, username });
  }

  config.set("servers", servers);

  // Auto-set default if it's the only server
  if (servers.length === 1) {
    config.set("defaultServer", url);
  }
}

/** Remove a server from the config */
export function removeServer(serverUrl: string): void {
  const url = normalizeServerUrl(serverUrl);
  const servers = config.get("servers").filter((s) => s.url !== url);
  config.set("servers", servers);

  if (config.get("defaultServer") === url) {
    config.set("defaultServer", servers[0]?.url ?? "");
  }
}

/** Get the default server URL, or undefined */
export function getDefaultServer(): string | undefined {
  return config.get("defaultServer") || config.get("servers")[0]?.url;
}

/** Get all configured servers */
export function getServers(): ServerConfig[] {
  return config.get("servers");
}

/** Set the default server */
export function setDefaultServer(serverUrl: string): void {
  config.set("defaultServer", normalizeServerUrl(serverUrl));
}

// --- Credential storage ---
// Credentials are stored in plaintext at ~/.config/magnus-cli-secrets/config.json
// (same approach as AWS CLI, gh CLI). Protect this file with filesystem permissions.

const secrets = new Conf<Record<string, Credentials>>({
  projectName: "magnus-cli-secrets",
  schema: {},
});

/** Save credentials for a server */
export function saveCredentials(serverUrl: string, username: string, password: string): void {
  const url = normalizeServerUrl(serverUrl);
  secrets.set(url, { username, password });
}

/** Get credentials for a server */
export function getCredentials(serverUrl: string): Credentials | null {
  const url = normalizeServerUrl(serverUrl);
  return secrets.get(url) ?? null;
}

/** Delete credentials for a server */
export function deleteCredentials(serverUrl: string): void {
  const url = normalizeServerUrl(serverUrl);
  secrets.delete(url);
}

// --- Cookie caching ---
// Persist .ROCK= cookie to disk to avoid re-authenticating on every command.
// Cookie expires after 24 hours.

interface CachedCookie {
  cookie: string;
  serverUrl: string;
  timestamp: number;
}

const COOKIE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const cookieStore = new Conf<Record<string, CachedCookie>>({
  projectName: "magnus-cli-cookies",
  schema: {},
});

/** Save a cookie for a server */
export function saveCookie(serverUrl: string, cookie: string): void {
  const url = normalizeServerUrl(serverUrl);
  cookieStore.set(url, { cookie, serverUrl: url, timestamp: Date.now() });
}

/** Get a cached cookie for a server, or null if expired/missing */
export function getCachedCookie(serverUrl: string): string | null {
  const url = normalizeServerUrl(serverUrl);
  const cached = cookieStore.get(url);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > COOKIE_EXPIRY_MS) {
    cookieStore.delete(url);
    return null;
  }
  return cached.cookie;
}

/** Clear cached cookie for a server */
export function clearCachedCookie(serverUrl: string): void {
  const url = normalizeServerUrl(serverUrl);
  cookieStore.delete(url);
}
