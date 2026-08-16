import { env } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import { DbService } from '../src/services/dbService';
import { Bindings } from '../src/types';

const getEnv = (): Bindings => ({
  DB: env.DB,
  KV_STORE: env.KV_STORE,
  WA_PHONE_NUMBER_ID: 'mock-phone-id',
  WA_ACCESS_TOKEN: 'mock-token',
  VERIFY_TOKEN: 'mock-verify-token',
  DASHBOARD_SECRET: 'mock-dashboard-secret',
  ADMIN_NUMBERS: '62812345678',
  GEMINI_API_KEY: 'mock-gemini-key',
  GEMINI_MODEL: 'gemini-3.5-flash',
  VECTORIZE: {} as any,
});

describe('DbService', () => {
  let dbService: DbService;

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
    await env.DB.prepare('DELETE FROM chat_logs').run();
    await env.DB.prepare('DELETE FROM daily_metrics').run();
    
    dbService = new DbService(getEnv());
  });

  it('should log a chat message', async () => {
    await dbService.logChat({
      sender_number: '123456',
      direction: 'IN',
      message_text: 'hello',
      command: null,
      status: 'SUCCESS',
      latency_ms: 10
    });

    const logs = await dbService.getRecentLogs(10);
    expect(logs.length).toBe(1);
    expect(logs[0].sender_number).toBe('123456');
    expect(logs[0].direction).toBe('IN');
  });

  it('should update daily metrics correctly', async () => {
    const date = '2023-01-01';
    
    await dbService.recordMetrics(date, 'user1', 'IN');
    let stats = await dbService.getDailyStats(date);
    expect(stats?.unique_senders_count).toBe(1);
    expect(stats?.total_inbound).toBe(1);
    expect(stats?.total_outbound).toBe(0);

    await dbService.recordMetrics(date, 'user1', 'IN');
    stats = await dbService.getDailyStats(date);
    expect(stats?.unique_senders_count).toBe(1);
    expect(stats?.total_inbound).toBe(2);

    await dbService.recordMetrics(date, 'user2', 'OUT');
    stats = await dbService.getDailyStats(date);
    expect(stats?.unique_senders_count).toBe(2);
    expect(stats?.total_inbound).toBe(2);
    expect(stats?.total_outbound).toBe(1);
  });
});
