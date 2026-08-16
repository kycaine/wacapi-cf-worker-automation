declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    KV_STORE: KVNamespace;
  }
}
