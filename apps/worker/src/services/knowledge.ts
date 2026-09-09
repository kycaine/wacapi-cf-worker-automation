import { Bindings } from '../types';
import { EmbeddingService } from './embedding';

export interface KnowledgeEntry {
  id: string;
  text_content: string;
  created_at: string;
}

export class KnowledgeService {
  private embeddingService: EmbeddingService;

  constructor(private env: Bindings) {
    this.embeddingService = new EmbeddingService(env);
  }

  private chunkText(text: string, chunkSize: number = 500): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }

  async ingest(text: string): Promise<string[]> {
    if (!this.env.VECTORIZE) {
      console.warn('VECTORIZE binding not available, skipping ingestion.');
      return [];
    }

    const chunks = this.chunkText(text);
    const vectorsToUpsert = [];
    const generatedIds: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.embeddingService.generateEmbedding(chunk);
      
      const id = crypto.randomUUID().split('-')[0];
      generatedIds.push(id);
      
      vectorsToUpsert.push({
        id,
        values: embedding,
        metadata: {
          text: chunk,
          source: 'admin-upload',
          timestamp: Date.now()
        }
      });


      await this.env.DB.prepare(`
        INSERT INTO knowledge_base (id, text_content)
        VALUES (?, ?)
      `).bind(id, chunk).run();
    }

    if (vectorsToUpsert.length > 0) {
      await this.env.VECTORIZE.upsert(vectorsToUpsert);
    }

    return generatedIds;
  }

  async listKnowledge(): Promise<KnowledgeEntry[]> {
    const { results } = await this.env.DB.prepare(`
      SELECT id, text_content, created_at 
      FROM knowledge_base 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all<KnowledgeEntry>();
    return results || [];
  }

  async deleteKnowledge(id: string): Promise<boolean> {
    try {
      await this.env.DB.prepare('DELETE FROM knowledge_base WHERE id = ?').bind(id).run();
      if (this.env.VECTORIZE) {
        await this.env.VECTORIZE.deleteByIds([id]);
      }
      return true;
    } catch (e) {
      console.error('Failed to delete knowledge:', e);
      return false;
    }
  }

  async search(query: string, topK: number = 3): Promise<string[]> {
    if (!this.env.VECTORIZE) {
      return [];
    }

    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      const searchResults = await this.env.VECTORIZE.query(queryEmbedding, {
        topK,
        returnValues: false,
        returnMetadata: 'all'
      });

      if (!searchResults.matches || searchResults.matches.length === 0) {
        return [];
      }


      return searchResults.matches
        .filter(match => match.score > 0.6)
        .map(match => match.metadata?.text as string)
        .filter(text => text !== undefined);
    } catch (e) {
      console.error('Vector search error:', e);
      return [];
    }
  }

  async syncAll(): Promise<{ processed: number, upserted: number }> {
    if (!this.env.VECTORIZE) {
      console.warn('VECTORIZE binding not available, skipping sync.');
      return { processed: 0, upserted: 0 };
    }

    // Get all entries from D1
    const { results } = await this.env.DB.prepare(`
      SELECT id, text_content, created_at 
      FROM knowledge_base
    `).all<KnowledgeEntry>();
    
    if (!results || results.length === 0) return { processed: 0, upserted: 0 };

    const vectorsToUpsert = [];
    
    // Generate embeddings and upsert
    for (const entry of results) {
      // Chunking shouldn't be strictly necessary if they just replaced the text, 
      // but let's assume text_content is one chunk for existing IDs.
      const embedding = await this.embeddingService.generateEmbedding(entry.text_content);
      vectorsToUpsert.push({
        id: entry.id,
        values: embedding,
        metadata: {
          text: entry.text_content,
          source: 'd1-sync',
          timestamp: Date.now()
        }
      });
    }

    if (vectorsToUpsert.length > 0) {
      // Upsert to Vectorize
      await this.env.VECTORIZE.upsert(vectorsToUpsert);
    }

    return { processed: results.length, upserted: vectorsToUpsert.length };
  }

  async clearAll(): Promise<{ deleted: number }> {
    const { results } = await this.env.DB.prepare(`
      SELECT id FROM knowledge_base
    `).all<{ id: string }>();

    if (results && results.length > 0) {
      const ids = results.map(r => r.id);
      
      // Delete from Vectorize in batches of 100 to avoid limits, or just all if small
      if (this.env.VECTORIZE) {
        // max 1000 ids per request usually, our data is small
        await this.env.VECTORIZE.deleteByIds(ids);
      }
    }

    await this.env.DB.prepare('DELETE FROM knowledge_base').run();
    return { deleted: results ? results.length : 0 };
  }
}
