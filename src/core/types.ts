/**
 * Descriptor returned by the Magnus API for tree items.
 * Keys are camelCase (the API returns PascalCase, converted by the client).
 */
export interface ItemDescriptor {
  displayName: string;
  tooltip?: string | null;
  isFolder: boolean;
  icon?: string | null;
  iconDark?: string | null;
  uri?: string | null;
  id?: string | null;
  guid?: string | null;
  copyValue?: string | null;
  buildUri?: string | null;
  deleteUri?: string | null;
  newFileUri?: string | null;
  newFolderUri?: string | null;
  uploadFileUri?: string | null;
  uploadFolderUri?: string | null;
  remoteViewUri?: string | null;
  remoteEditUri?: string | null;
  disableOpenFile?: boolean;
}

/** Response from action endpoints (build, delete, upload, etc.) */
export interface ActionResponse {
  actionSuccessful: boolean;
  responseMessage?: string | null;
}

/** Stored server configuration */
export interface ServerConfig {
  url: string;
  username: string;
}

/** Shape of the persisted config file */
export interface MagnusConfig {
  servers: ServerConfig[];
  defaultServer?: string;
}

/** Credentials for a server */
export interface Credentials {
  username: string;
  password: string;
}
