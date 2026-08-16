import { Context, Next } from 'hono';

export const adminAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check for Basic auth (Dashboard)
  if (authHeader.startsWith('Basic ')) {
    const b64auth = authHeader.split(' ')[1];
    const [user, pass] = atob(b64auth).split(':');
    
    if (
      c.env.DASHBOARD_USERNAME && c.env.DASHBOARD_PASSWORD &&
      user === c.env.DASHBOARD_USERNAME && pass === c.env.DASHBOARD_PASSWORD
    ) {
      return await next();
    }
  }

  // Fallback to Bearer auth (Legacy Dashboard Secret)
  const secret = c.env.DASHBOARD_SECRET;
  if (authHeader === `Bearer ${secret}`) {
    return await next();
  }

  return c.json({ error: 'Unauthorized' }, 401);
};
