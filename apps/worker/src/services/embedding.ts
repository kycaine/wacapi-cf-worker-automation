import { Bindings } from '../types';

export class EmbeddingService {
  constructor(private env: Bindings) {}

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.env.GEMINI_API_KEY || this.env.GEMINI_API_KEY === 'mock-gemini-key') {
      throw new Error('Missing API Key for embedding');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${this.env.GEMINI_API_KEY}`;
    
    const body = {
      model: 'models/gemini-embedding-001',
      content: {
        parts: [{ text }]
      },
      outputDimensionality: 768
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Embedding API Error:', errText);
      throw new Error('Failed to generate embedding');
    }

    const data: any = await response.json();
    if (!data.embedding || !data.embedding.values) {
      throw new Error('Invalid embedding response format');
    }

    return data.embedding.values;
  }
}
