import { Bindings, ChatLog, DailyMetrics } from '../types';

export class DbService {
  constructor(private env: Bindings) {}

  async logChat(log: ChatLog): Promise<void> {
    const query = `
      INSERT INTO chat_logs (sender_number, direction, message_text, command, status, latency_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await this.env.DB.prepare(query)
      .bind(
        log.sender_number,
        log.direction,
        log.message_text,
        log.command,
        log.status,
        log.latency_ms
      )
      .run();
  }

  async recordMetrics(date: string, senderNumber: string, direction: 'IN' | 'OUT'): Promise<void> {

    const kvKey = `unique_senders:${date}`;
    const sendersStr = await this.env.KV_STORE.get(kvKey);
    const senders: string[] = sendersStr ? JSON.parse(sendersStr) : [];
    
    let isUnique = false;
    if (!senders.includes(senderNumber)) {
      senders.push(senderNumber);
      await this.env.KV_STORE.put(kvKey, JSON.stringify(senders), { expirationTtl: 86400 * 2 });
      isUnique = true;
    }

    const query = `
      INSERT INTO daily_metrics (date, unique_senders_count, total_inbound, total_outbound)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        unique_senders_count = unique_senders_count + ?,
        total_inbound = total_inbound + ?,
        total_outbound = total_outbound + ?
    `;

    await this.env.DB.prepare(query)
      .bind(
        date,
        isUnique ? 1 : 0,
        direction === 'IN' ? 1 : 0,
        direction === 'OUT' ? 1 : 0,
        isUnique ? 1 : 0,
        direction === 'IN' ? 1 : 0,
        direction === 'OUT' ? 1 : 0
      )
      .run();
  }

  async getDailyStats(date: string): Promise<DailyMetrics | null> {
    return this.env.DB.prepare(`SELECT * FROM daily_metrics WHERE date = ?`)
      .bind(date)
      .first<DailyMetrics>();
  }

  async getRecentLogs(limit = 100): Promise<ChatLog[]> {
    const { results } = await this.env.DB.prepare(`SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT ?`)
      .bind(limit)
      .all<ChatLog>();
    return results;
  }

  async getContacts(): Promise<{ sender_number: string; message_text: string; created_at: string }[]> {
    const query = `
      SELECT sender_number, message_text, created_at
      FROM chat_logs
      WHERE id IN (
        SELECT MAX(id)
        FROM chat_logs
        GROUP BY sender_number
      )
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const { results } = await this.env.DB.prepare(query).all();
    return results as any;
  }

  async getRecentLogsForSender(senderNumber: string, limit = 50): Promise<ChatLog[]> {
    const { results } = await this.env.DB.prepare(
      `SELECT * FROM chat_logs WHERE sender_number = ? ORDER BY created_at DESC LIMIT ?`
    )
      .bind(senderNumber, limit)
      .all<ChatLog>();
    return results;
  }

  async clearUserHistory(senderNumber: string): Promise<void> {
    await this.env.DB.prepare(
      `DELETE FROM chat_logs WHERE sender_number = ?`
    )
      .bind(senderNumber)
      .run();
  }

  async deleteOldLogs(daysToKeep: number): Promise<void> {
    await this.env.DB.prepare(
      `DELETE FROM chat_logs WHERE created_at < datetime('now', ?)`
    )
      .bind(`-${daysToKeep} days`)
      .run();
  }
}
