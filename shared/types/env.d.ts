interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly INTERNAL_API_URL: string; // Добавьте эту строку
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
