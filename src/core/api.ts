import axios, { type AxiosInstance, type AxiosRequestConfig, type Method } from "axios";
import FormData from "form-data";
import { readFile } from "node:fs/promises";
import { basename, join as pathJoin } from "node:path";
import { readdir, stat } from "node:fs/promises";
import { getCredentials, normalizeServerUrl, saveCookie, getCachedCookie, clearCachedCookie } from "./auth.js";
import type { ActionResponse, ItemDescriptor } from "./types.js";

/** Reviver that converts PascalCase keys to camelCase */
function toCamelCaseReviver(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      if (/^[A-Z]/.test(key)) {
        const camel = key.charAt(0).toLowerCase() + key.substring(1);
        obj[camel] = obj[key];
        delete obj[key];
      }
    }
  }
  return value;
}

export class MagnusClient {
  private http: AxiosInstance;
  private cookies: Map<string, string> = new Map();
  private verbose = false;

  constructor(options?: { verbose?: boolean }) {
    this.verbose = options?.verbose ?? false;
    this.http = axios.create({
      timeout: 10_000,
      headers: { "Content-Type": "application/json" },
      transformResponse: (data: unknown) => {
        if (typeof data === "string" && data !== "") {
          try {
            return JSON.parse(data, toCamelCaseReviver);
          } catch {
            return data;
          }
        }
        return data;
      },
    });

    if (this.verbose) {
      this.http.interceptors.request.use((config) => {
        console.error(`-> ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      });
      this.http.interceptors.response.use((response) => {
        console.error(`<- ${response.status} ${response.statusText}`);
        return response;
      });
    }
  }

  // ── Auth ──────────────────────────────────────────────────

  /** Authenticate and cache the .ROCK= cookie for a server */
  async login(serverUrl: string, username?: string, password?: string): Promise<boolean> {
    const base = normalizeServerUrl(serverUrl);

    if (!username || !password) {
      const creds = getCredentials(base);
      if (!creds) return false;
      username = creds.username;
      password = creds.password;
    }

    try {
      const loginUrl = `${base}/api/Auth/Login`;
      const response = await this.http.post(loginUrl, JSON.stringify({ username, password }));

      if (response.status !== 200 && response.status !== 204) return false;

      const setCookie = response.headers["set-cookie"];
      if (!setCookie) return false;

      const rockCookie = (Array.isArray(setCookie) ? setCookie : [setCookie])
        .find((c) => c.startsWith(".ROCK="));

      if (!rockCookie) return false;

      const cookieValue = rockCookie.split(";")[0];
      this.cookies.set(base, cookieValue);
      saveCookie(base, cookieValue);
      return true;
    } catch {
      return false;
    }
  }

  /** Get auth cookie, logging in if needed */
  private async getCookie(serverUrl: string): Promise<string> {
    const base = normalizeServerUrl(serverUrl);

    // Check in-memory cache first
    if (this.cookies.has(base)) return this.cookies.get(base)!;

    // Check disk cache
    const cached = getCachedCookie(base);
    if (cached) {
      this.cookies.set(base, cached);
      return cached;
    }

    // Fall back to login
    const ok = await this.login(base);
    if (!ok) throw new Error(`Unable to authenticate with ${base}. Run: magnus login`);
    return this.cookies.get(base)!;
  }

  /** Make a request, retrying once on 401 with a fresh login */
  private async requestWithRetry<T>(config: AxiosRequestConfig, serverUrl: string): Promise<T> {
    const base = normalizeServerUrl(serverUrl);
    try {
      const res = await this.http.request<T>(config);
      return res.data;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        // Clear cached cookie and re-authenticate
        clearCachedCookie(base);
        this.cookies.delete(base);
        const ok = await this.login(base);
        if (!ok) throw new Error(`Unable to authenticate with ${base}. Run: magnus login`);

        // Retry with new cookie
        config.headers = { ...config.headers, Cookie: this.cookies.get(base)! };
        const res = await this.http.request<T>(config);
        return res.data;
      }
      throw error;
    }
  }

  private authedConfig(cookie: string): AxiosRequestConfig {
    return { headers: { Cookie: cookie } };
  }

  // ── Read operations ───────────────────────────────────────

  /** Get the server descriptor (name, capabilities, etc.) */
  async getServerDescriptor(serverUrl: string): Promise<ItemDescriptor> {
    const base = normalizeServerUrl(serverUrl);
    const cookie = await this.getCookie(base);
    const url = `${base}/api/TriumphTech/Magnus/GetServer`;
    return this.requestWithRetry<ItemDescriptor>({ method: "GET", url, headers: { Cookie: cookie } }, base);
  }

  /** List children of a tree path. Pass undefined/null for root. */
  async getChildItems(serverUrl: string, path?: string | null): Promise<ItemDescriptor[]> {
    const base = normalizeServerUrl(serverUrl);
    const cookie = await this.getCookie(base);
    const apiPath = path || "api/TriumphTech/Magnus/GetTreeItems/root";
    const url = apiPath.includes("://") ? apiPath : `${base}/${apiPath}`;
    return this.requestWithRetry<ItemDescriptor[]>({ method: "GET", url, headers: { Cookie: cookie } }, base);
  }

  /** Read file content as a Buffer */
  async readFile(serverUrl: string, filePath: string): Promise<Buffer> {
    const base = normalizeServerUrl(serverUrl);
    const cookie = await this.getCookie(base);
    const url = `${base}/api/TriumphTech/Magnus${filePath}`;
    const data = await this.requestWithRetry<ArrayBuffer>({
      method: "GET",
      url,
      responseType: "arraybuffer",
      headers: { Cookie: cookie },
    }, base);
    return Buffer.from(data);
  }

  /** Write content to a file on the server */
  async writeFile(serverUrl: string, filePath: string, content: Buffer | string): Promise<void> {
    const base = normalizeServerUrl(serverUrl);
    const cookie = await this.getCookie(base);
    const url = `${base}/api/TriumphTech/Magnus${filePath}`;
    const data = typeof content === "string" ? Buffer.from(content) : content;
    await this.requestWithRetry<unknown>({
      method: "POST",
      url,
      data,
      responseType: "arraybuffer",
      headers: { "Content-Type": "application/octet-stream", Cookie: cookie },
    }, base);
  }

  // ── Action operations ─────────────────────────────────────

  /** Trigger a build action */
  async build(serverUrl: string, buildUri: string): Promise<ActionResponse> {
    return this.action("POST", serverUrl, buildUri);
  }

  /** Delete a resource */
  async deleteResource(serverUrl: string, deleteUri: string): Promise<ActionResponse> {
    return this.action("DELETE", serverUrl, deleteUri);
  }

  /** Create a new file */
  async createFile(serverUrl: string, newFileUri: string, filename: string): Promise<ActionResponse> {
    return this.action("POST", serverUrl, newFileUri, filename, (cfg) => {
      cfg.headers = { ...cfg.headers, "Content-Type": "text/plain" };
    });
  }

  /** Create a new folder */
  async createFolder(serverUrl: string, newFolderUri: string, name: string): Promise<ActionResponse> {
    return this.action("POST", serverUrl, newFolderUri, name, (cfg) => {
      cfg.headers = { ...cfg.headers, "Content-Type": "text/plain" };
    });
  }

  /** Upload files to the server */
  async uploadFiles(serverUrl: string, uploadUri: string, localPaths: string[]): Promise<ActionResponse> {
    const base = normalizeServerUrl(serverUrl);
    const cookie = await this.getCookie(base);
    const url = this.resolveUrl(base, uploadUri);

    const formData = new FormData();

    for (const filePath of localPaths) {
      const file = await readFile(filePath);
      formData.append("files", file, basename(filePath));
    }

    return this.requestWithRetry<ActionResponse>({
      method: "POST",
      url,
      data: formData,
      headers: { ...formData.getHeaders(), Cookie: cookie },
      timeout: 30_000,
    }, base);
  }

  /** Upload a directory to the server */
  async uploadDirectory(serverUrl: string, uploadUri: string, localDir: string): Promise<ActionResponse> {
    const base = normalizeServerUrl(serverUrl);
    const cookie = await this.getCookie(base);
    const url = this.resolveUrl(base, uploadUri);

    const formData = new FormData();
    let fileCount = 0;
    let totalSize = 0;

    async function appendDir(dirPath: string, relativeParts: string[]): Promise<void> {
      const children = await readdir(dirPath);
      for (const child of children) {
        const childPath = pathJoin(dirPath, child);
        const childStat = await stat(childPath);
        if (childStat.isFile()) {
          fileCount++;
          totalSize += childStat.size;
          if (fileCount > 10_000) throw new Error("Cannot upload more than 10,000 files at once.");
          if (totalSize > 100_000_000) throw new Error("Cannot upload more than 100MB at once.");
          const file = await readFile(childPath);
          formData.append("files", file, { filepath: [...relativeParts, child].join("/") });
        } else if (childStat.isDirectory()) {
          await appendDir(childPath, [...relativeParts, child]);
        }
      }
    }

    await appendDir(localDir, []);

    return this.requestWithRetry<ActionResponse>({
      method: "POST",
      url,
      data: formData,
      headers: { ...formData.getHeaders(), Cookie: cookie },
      timeout: 60_000,
    }, base);
  }

  // ── Helpers ───────────────────────────────────────────────

  private async action(
    method: Method,
    serverUrl: string,
    actionUri: string,
    data?: unknown,
    customize?: (cfg: AxiosRequestConfig) => void,
  ): Promise<ActionResponse> {
    const base = normalizeServerUrl(serverUrl);
    const cookie = await this.getCookie(base);
    const url = this.resolveUrl(base, actionUri);

    const cfg: AxiosRequestConfig = {
      method,
      url,
      data,
      headers: { Cookie: cookie },
      timeout: 30_000,
    };

    if (customize) customize(cfg);

    return this.requestWithRetry<ActionResponse>(cfg, base);
  }

  private resolveUrl(base: string, uri: string): string {
    if (uri.includes("://")) return uri;
    if (uri.startsWith("/")) return `${base}${uri}`;
    return `${base}/${uri}`;
  }
}
