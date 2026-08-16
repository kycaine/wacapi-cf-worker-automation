export type Bindings = {
  DB: D1Database;
  KV_STORE: KVNamespace;
  WA_PHONE_NUMBER_ID: string;
  WA_ACCESS_TOKEN: string;
  VERIFY_TOKEN: string;
  DASHBOARD_SECRET: string;
  DASHBOARD_USERNAME?: string;
  DASHBOARD_PASSWORD?: string;
  ADMIN_NUMBERS: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  VECTORIZE: VectorizeIndex;
  APP_SECRET: string;
};

export type ChatLog = {
  id?: number;
  sender_number: string;
  direction: 'IN' | 'OUT';
  message_text: string | null;
  command: string | null;
  status: 'SUCCESS' | 'ERROR';
  latency_ms: number | null;
  created_at?: string;
};

export type DailyMetrics = {
  date: string;
  unique_senders_count: number;
  total_inbound: number;
  total_outbound: number;
};
