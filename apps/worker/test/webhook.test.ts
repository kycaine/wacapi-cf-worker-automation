import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import app from '../src/index';

const mockEnv = {
  DB: env.DB,
  KV_STORE: env.KV_STORE,
  WA_PHONE_NUMBER_ID: 'mock-phone-id',
  WA_ACCESS_TOKEN: 'mock-token',
  VERIFY_TOKEN: 'test-token',
  DASHBOARD_SECRET: 'mock-dashboard-secret',
  ADMIN_NUMBERS: '123456',
  GEMINI_API_KEY: 'mock-gemini-key',
  GEMINI_MODEL: 'gemini-3.5-flash',
  VECTORIZE: {} as any,
};

describe('Webhook Controller', () => {
  it('GET /api/webhook should verify token', async () => {
    const req = new Request('http://localhost/api/webhook?hub.mode=subscribe&hub.verify_token=test-token&hub.challenge=1234');
    const res = await app.fetch(req, mockEnv as any);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('1234');
  });

  it('GET /api/webhook should reject invalid token', async () => {
    const req = new Request('http://localhost/api/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1234');
    const res = await app.fetch(req, mockEnv as any);
    expect(res.status).toBe(403);
  });

  it('POST /api/webhook should accept WhatsApp messages and return 200 immediately', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '123456',
              type: 'text',
              text: { body: '/ping' }
            }]
          }
        }]
      }]
    };

    const req = new Request('http://localhost/api/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const ctx = createExecutionContext();
    
    const fetchMock = vi.stubGlobal('fetch', async () => {
      return new Response('{}', { status: 200 });
    });

    // Provide the required environment setup schema
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

    const res = await app.fetch(req, mockEnv as any, ctx);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('EVENT_RECEIVED');

    await waitOnExecutionContext(ctx);
    vi.unstubAllGlobals();
  });
});
