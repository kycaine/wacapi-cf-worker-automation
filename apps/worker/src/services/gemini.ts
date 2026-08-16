import { Bindings, ChatLog } from '../types';
import { KnowledgeService } from './knowledge';

export class GeminiService {
  constructor(private env: Bindings) { }

  async generateResponse(prompt: string, contextLogs: ChatLog[]): Promise<string | null> {
    if (!this.env.GEMINI_API_KEY || this.env.GEMINI_API_KEY === 'mock-gemini-key') {
      return "Bot's AI is not configured yet. Missing API Key.";
    }

    const model = this.env.GEMINI_MODEL || 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.env.GEMINI_API_KEY}`;

    const knowledgeService = new KnowledgeService(this.env);
    const relevantContexts = await knowledgeService.search(prompt);

    let systemPrompt = "Kamu Veronica, asisten Reternia yg ramah.\n" +
      "ATURAN:\n" +
      "1. Perkenalkan diri.pakai kata 'aku' jangan 'saya'.\n" +
      "2. Hindari pakai list/poin angka. Pakai bahasa yang friendly dan tidak kaku.\n" +
      "3. DILARANG KERAS menggunakan kata-kata slang, bahasa gaul yang tidak pantas, atau candaan yang aneh.\n" +
      "4. Selalu berikan respons yang utuh dan tidak terpotong. Batasi panjang balasan, padat, dan deskriptif (maksimal 150 kata).\n" +
      "5. Jika klien bertanya soal harga, gunakan info dari Knowledge Base dan wajib sebutkan harga termurah di Reternia mulai dari Rp500.000 (untuk website statis). Jelaskan juga bahwa estimasi final butuh SOW.\n" +
      "TUGAS: Tanya klien baru tentang Nama setelah dijawab, baru tanya Ide project yang diinginkan.\n\n";

    if (relevantContexts.length > 0) {
      systemPrompt += `Below is some relevant information from your knowledge base that might help answer the user's question:\n`;
      systemPrompt += `--- KNOWLEDGE BASE START ---\n`;
      systemPrompt += relevantContexts.map((ctx, i) => `[${i + 1}] ${ctx}`).join('\n\n');
      systemPrompt += `\n--- KNOWLEDGE BASE END ---\n\n`;
    }

    const rawContents = [];


    for (const log of [...contextLogs].reverse()) {
      rawContents.push({
        role: log.direction === 'IN' ? 'user' : 'model',
        text: log.message_text
      });
    }


    rawContents.push({
      role: 'user',
      text: prompt
    });


    const contents: any[] = [];
    for (const msg of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
        contents[contents.length - 1].parts[0].text += '\n' + msg.text;
      } else {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.text }]
        });
      }
    }

    const generateContent = async (retryCount = 0): Promise<Response> => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: contents,
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 300,
          }
        })
      });

      if (response.status === 429 && retryCount < 2) {

        await new Promise(resolve => setTimeout(resolve, 2000));
        return generateContent(retryCount + 1);
      }
      return response;
    };

    try {
      const response = await generateContent();

      if (!response.ok) {
        console.error('Gemini API Error:', await response.text());
        return null;
      }

      const data = await response.json() as any;
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text.trim();
      }

      return null;
    } catch (e) {
      console.error('Gemini Service Exception:', e);
      return null;
    }
  }
}
