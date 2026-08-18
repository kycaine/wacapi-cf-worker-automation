import { Bindings } from '../types';

export class WhatsAppService {
  constructor(private env: Bindings) {}

  async sendMessage(to: string, message: string): Promise<{success: boolean, error?: string}> {
    const url = `https://graph.facebook.com/v20.0/${this.env.WA_PHONE_NUMBER_ID}/messages`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.WA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            body: message,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WhatsApp API Error:', errorText);
        return { success: false, error: errorText };
      }

      return { success: true };
    } catch (e: any) {
      console.error('WhatsApp Service Error:', e);
      return { success: false, error: e.message || String(e) };
    }
  }
}
