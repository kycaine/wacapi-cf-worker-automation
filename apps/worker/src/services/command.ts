import { Bindings } from '../types';
import { WhatsAppService } from './whatsapp';
import { DbService } from './dbService';
import { GeminiService } from './gemini';
import { KnowledgeService } from './knowledge';

export class CommandService {
  private waService: WhatsAppService;
  private dbService: DbService;

  constructor(private env: Bindings) {
    this.waService = new WhatsAppService(env);
    this.dbService = new DbService(env);
  }

  async handleCommand(senderNumber: string, message: string, isAdminUser: boolean = false): Promise<void> {
    const text = message.trim().toLowerCase();

    let reply: string | null = '';

    if (text === '/ping') {
      if (!isAdminUser) return;
      reply = 'Pong! Bot is active and running on Cloudflare Workers.';
    } else if (text === '/help') {
      if (!isAdminUser) return;
      reply = `*WhatsApp Admin Assistant Bot*\n\nAvailable commands:\n/ping - Check bot status\n/status - Get system status\n/stats - Get today's usage metrics\n/learn <text> - Save knowledge\n/knowledge - List saved knowledge\n/forget <id> - Delete knowledge\n/reset - Clear your chat session history\n/help - Show this message`;
    } else if (text === '/status') {
      if (!isAdminUser) return;
      reply = 'All systems operational.\n- Worker: Active\n- D1 Database: Connected\n- KV Store: Connected';
    } else if (text === '/stats') {
      if (!isAdminUser) return;
      const date = new Date().toISOString().split('T')[0];
      const stats = await this.dbService.getDailyStats(date);
      if (stats) {
        reply = `*Today's Stats (${date})*\n\nUnique Senders: ${stats.unique_senders_count}\nInbound Messages: ${stats.total_inbound}\nOutbound Messages: ${stats.total_outbound}`;
      } else {
        reply = `*Today's Stats (${date})*\n\nNo data yet for today.`;
      }
    } else if (text.startsWith('/learn ')) {
      if (!isAdminUser) return;
      const content = message.slice('/learn '.length).trim();
      if (!content) {
        await this.waService.sendMessage(senderNumber, 'Usage: /learn <text to memorize>');
        return;
      }

      const knowledgeService = new KnowledgeService(this.env);
      try {
        const ids = await knowledgeService.ingest(content);
        await this.waService.sendMessage(senderNumber, `Knowledge saved to Vector Database!\nIDs: ${ids.join(', ')}`);
      } catch (e) {
        console.error('Error learning:', e);
        await this.waService.sendMessage(senderNumber, 'Failed to save knowledge.');
      }
      return;
    } else if (text === '/knowledge') {
      if (!isAdminUser) return;
      const knowledgeService = new KnowledgeService(this.env);
      try {
        const entries = await knowledgeService.listKnowledge();
        if (entries.length === 0) {
          await this.waService.sendMessage(senderNumber, 'Knowledge Base is empty.');
          return;
        }
        const listText = entries.map(e => `[ID: ${e.id}] ${e.text_content.substring(0, 300)}${e.text_content.length > 300 ? '...' : ''}`).join('\n\n');
        await this.waService.sendMessage(senderNumber, `*Knowledge Base (Max 20 Items)*\n\n${listText}\n\nType /forget <ID> to remove an entry.`);
      } catch (e) {
        console.error('Error listing knowledge:', e);
        await this.waService.sendMessage(senderNumber, 'Failed to list knowledge.');
      }
      return;
    } else if (text.startsWith('/forget ')) {
      if (!isAdminUser) return;
      const id = text.slice('/forget '.length).trim();
      if (!id) {
        await this.waService.sendMessage(senderNumber, 'Usage: /forget <ID>');
        return;
      }

      const knowledgeService = new KnowledgeService(this.env);
      const success = await knowledgeService.deleteKnowledge(id);
      if (success) {
        await this.waService.sendMessage(senderNumber, `Knowledge [${id}] has been deleted.`);
      } else {
        await this.waService.sendMessage(senderNumber, `Failed to delete knowledge [${id}].`);
      }
      return;
    } else if (text === '/reset') {
      await this.dbService.clearUserHistory(senderNumber);
      reply = 'Sesi obrolanmu berhasil direset! Mari mulai obrolan baru!';
    } else if (text.startsWith('/')) {
      if (isAdminUser) {
        reply = `Unknown command: ${message}\nType /help to see available commands.`;
      }
    } else {

      const geminiService = new GeminiService(this.env);
      const recentLogs = await this.dbService.getRecentLogsForSender(senderNumber, 10);
      reply = await geminiService.generateResponse(message, recentLogs);
    }
    if (reply) {
      const start = Date.now();
      const success = await this.waService.sendMessage(senderNumber, reply);
      const latency = Date.now() - start;

      const date = new Date().toISOString().split('T')[0];

      await this.dbService.logChat({
        sender_number: senderNumber,
        direction: 'OUT',
        message_text: reply,
        command: text.startsWith('/') ? text.split(' ')[0] : null,
        status: success ? 'SUCCESS' : 'ERROR',
        latency_ms: latency
      });

      if (success) {
        await this.dbService.recordMetrics(date, senderNumber, 'OUT');
      }
    }
  }
}
