import { Context, Next } from 'hono';

export const adminAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  const secret = c.env.DASHBOARD_SECRET;

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
};
