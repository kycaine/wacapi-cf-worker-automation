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
