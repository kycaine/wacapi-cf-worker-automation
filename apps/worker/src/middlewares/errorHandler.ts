import { Context } from 'hono';

export const errorHandler = (err: Error, c: Context) => {
  console.error('Unhandled Exception:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
};
