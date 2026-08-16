import { env } from 'cloudflare:test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandService } from '../src/services/command';
import { Bindings } from '../src/types';

const getEnv = (): Bindings => ({
  DB: env.DB,
  KV_STORE: env.KV_STORE,
  WA_PHONE_NUMBER_ID: 'mock-phone-id',
  WA_ACCESS_TOKEN: 'mock-token',
  VERIFY_TOKEN: 'mock-verify-token',
  DASHBOARD_SECRET: 'mock-dashboard-secret',
  ADMIN_NUMBERS: '123456',
  GEMINI_API_KEY: 'mock-gemini-key',
  GEMINI_MODEL: 'gemini-3.5-flash',
  VECTORIZE: {} as any,
});

describe('CommandService', () => {
  let cmdService: CommandService;

  beforeEach(async () => {
    const schema = `
      CREATE TABLE IF NOT EXISTS chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_number TEXT NOT NULL,
        direction TEXT NOT NULL,
        message_text TEXT,
        command TEXT,
        status TEXT,
        latency_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS daily_metrics (
        date TEXT PRIMARY KEY,
        unique_senders_count INTEGER DEFAULT 0,
        total_inbound INTEGER DEFAULT 0,
        total_outbound INTEGER DEFAULT 0
      );
    `;
    for (const stmt of schema.split(';')) {
      if (stmt.trim()) await env.DB.prepare(stmt).run();
    }
    cmdService = new CommandService(getEnv());
  });

  it('should handle /ping command', async () => {
    let sentMessage = '';
    const fetchMock = vi.stubGlobal('fetch', async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      sentMessage = body.text.body;
      return new Response('{}', { status: 200 });
    });

    await cmdService.handleCommand('123456', '/ping');
    expect(sentMessage).toContain('Pong!');
    vi.unstubAllGlobals();
  });
});
