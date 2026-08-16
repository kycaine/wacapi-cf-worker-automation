import { Context } from 'hono';
import { Bindings } from '../types';
import { DbService } from '../services/dbService';

export const getDailyStats = async (c: Context<{ Bindings: Bindings }>) => {
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  const dbService = new DbService(c.env);
  
  const stats = await dbService.getDailyStats(date);
  return c.json({ data: stats || null });
};

export const getRecentLogs = async (c: Context<{ Bindings: Bindings }>) => {
  const limit = parseInt(c.req.query('limit') || '100', 10);
  const dbService = new DbService(c.env);
  
  const logs = await dbService.getRecentLogs(limit);
  return c.json({ data: logs });
};

export const getContacts = async (c: Context<{ Bindings: Bindings }>) => {
  const dbService = new DbService(c.env);
  const contacts = await dbService.getContacts();
  return c.json({ data: contacts });
};

export const getLogsForSender = async (c: Context<{ Bindings: Bindings }>) => {
  const number = c.req.param('number');
  if (!number) {
    return c.json({ error: 'Missing number parameter' }, 400);
  }
  
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const dbService = new DbService(c.env);
  
  const logs = await dbService.getRecentLogsForSender(number, limit);
  // Sort logs ascending for chat bubble display (oldest first)
  const sortedLogs = logs.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
  return c.json({ data: sortedLogs });
};
