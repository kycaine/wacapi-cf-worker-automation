import { Context } from 'hono';
import { Bindings } from '../types';
import { isAdmin } from '../config/env';
import { CommandService } from '../services/command';
import { DbService } from '../services/dbService';

async function verifySignature(secret: string, signature: string, payload: string): Promise<boolean> {
  if (!signature.startsWith('sha256=')) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return signature === expectedSignature;
}

export const verifyWebhook = (c: Context<{ Bindings: Bindings }>) => {
  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (mode === 'subscribe' && token === c.env.VERIFY_TOKEN) {
    return c.text(challenge || '', 200);
  }
  return c.text('Forbidden', 403);
};

export const handleWebhook = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const signature = c.req.header('x-hub-signature-256');
    const rawBody = await c.req.text();

    if (c.env.APP_SECRET) {
      if (!signature) {
        console.warn('Missing webhook signature');
        return c.text('Forbidden', 403);
      }
      
      const isValid = await verifySignature(c.env.APP_SECRET, signature, rawBody);
      if (!isValid) {
        console.warn('Invalid webhook signature');
        return c.text('Forbidden', 403);
      }
    }

    const body = JSON.parse(rawBody);

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.value && change.value.messages) {
            for (const message of change.value.messages) {
              if (message.type === 'text') {
                const senderNumber = message.from;
                const text = message.text.body;

                c.executionCtx.waitUntil((async () => {
                  try {
                    const dbService = new DbService(c.env);
                    const date = new Date().toISOString().split('T')[0];

                    await dbService.logChat({
                      sender_number: senderNumber,
                      direction: 'IN',
                      message_text: text,
                      command: text.startsWith('/') ? text.split(' ')[0] : null,
                      status: 'SUCCESS',
                      latency_ms: 0
                    });
                    await dbService.recordMetrics(date, senderNumber, 'IN');

                    const isAdminUser = isAdmin(c.env, senderNumber);
                    const cmdService = new CommandService(c.env);
                    await cmdService.handleCommand(senderNumber, text, isAdminUser);
                  } catch (e) {
                    console.error('Error processing webhook async tasks:', e);
                  }
                })());
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Invalid JSON received', e);
  }

  return c.text('EVENT_RECEIVED', 200);
};
