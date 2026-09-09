import { Hono } from 'hono';
import { Bindings } from './types';
import { verifyWebhook, handleWebhook } from './controllers/webhook';
import { getDailyStats, getRecentLogs, getContacts, getLogsForSender } from './controllers/stats';
import { adminAuth } from './middlewares/auth';
import { errorHandler } from './middlewares/errorHandler';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Bindings }>();


app.use('*', cors());
app.onError(errorHandler);


app.get('/api/webhook', verifyWebhook);
app.post('/api/webhook', handleWebhook);


app.get('/api/stats/daily', adminAuth, getDailyStats);
app.get('/api/stats/logs', adminAuth, getRecentLogs);
app.get('/api/stats/contacts', adminAuth, getContacts);
app.get('/api/stats/logs/:number', adminAuth, getLogsForSender);

import { KnowledgeService } from './services/knowledge';
app.get('/api/knowledge/sync', adminAuth, async (c) => {
  const env = c.env as any; // Type workaround for Hono bindings if needed
  const knowledgeService = new KnowledgeService(env);
  const result = await knowledgeService.syncAll();
  return c.json({ success: true, ...result });
});

app.post('/api/knowledge/ingest', adminAuth, async (c) => {
  const body = await c.req.json();
  const env = c.env as any;
  const knowledgeService = new KnowledgeService(env);
  const result = await knowledgeService.ingest(body.text);
  return c.json({ success: true, ids: result });
});

app.post('/api/knowledge/clear', adminAuth, async (c) => {
  const env = c.env as any;
  const knowledgeService = new KnowledgeService(env);
  const result = await knowledgeService.clearAll();
  return c.json({ success: true, ...result });
});

import { DbService } from './services/dbService';

export default {
  fetch: app.fetch,
  async scheduled(event: any, env: Bindings, ctx: any) {
    const dbService = new DbService(env);

    ctx.waitUntil(dbService.deleteOldLogs(2));
  }
};
