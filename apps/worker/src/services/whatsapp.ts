import { Bindings } from '../types';

export class WhatsAppService {
  constructor(private env: Bindings) {}

  async sendMessage(to: string, message: string): Promise<boolean> {
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
        return false;
      }

      return true;
    } catch (e) {
      console.error('WhatsApp Service Error:', e);
      return false;
    }
  }
}
