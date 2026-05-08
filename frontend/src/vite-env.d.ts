/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_HASH?: string;
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
