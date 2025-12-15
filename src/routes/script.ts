import { Hono } from 'hono';
import { processScript } from '../lib/script-processor.js';
import { processChunksWithAudio } from '../lib/azure-tts.js';
import { sql } from '../lib/db.js';

const app = new Hono();

// POST /api/script/process
app.post('/process', async (c) => {
  try {
    const body = await c.req.json<{
      script: string;
      learningLanguage: string;
      nativeLanguage?: string;
      userId?: string;
    }>();
    const { script, learningLanguage, nativeLanguage, userId = 'anonymous' } = body;

    if (!script || !learningLanguage) {
      return c.json({ 
        error: 'Missing required fields: script and learningLanguage' 
      }, 400);
    }

    // 1. Process script with AI
    const result = await processScript(script, learningLanguage, nativeLanguage);

    // 2. Save script to DB
    const [savedScript] = (await sql`
      INSERT INTO scripts (
        user_id, 
        title, 
        original_script, 
        native_language, 
        learning_language
      ) VALUES (
        ${userId}, 
        ${result.title}, 
        ${result.refinedScript}, 
        ${nativeLanguage || 'English'}, 
        ${learningLanguage}
      )
      RETURNING id
    `) as [{ id: number }];

    // 3. Generate Audio for chunks
    // Use userId as a folder prefix for better organization in Blob Storage
    const audioChunks = await processChunksWithAudio(
      result.chunks,
      `${userId}/script_${savedScript.id}`,
      {
        nativeLanguage: nativeLanguage || 'en-US',
        learningLanguage: learningLanguage
      }
    );

    // 4. Save chunks to DB
    for (let i = 0; i < audioChunks.length; i++) {
      const chunk = audioChunks[i];
      await sql`
        INSERT INTO script_chunks (
          script_id,
          sequence_order,
          native_text,
          learning_text,
          native_audio_url,
          learning_audio_url
        ) VALUES (
          ${savedScript.id},
          ${i + 1},
          ${chunk.original},
          ${chunk.translation},
          ${chunk.originalAudioUrl || null},
          ${chunk.translationAudioUrl || null}
        )
      `;
    }

    return c.json({ 
      success: true, 
      scriptId: savedScript.id,
      refinedScript: result.refinedScript,
      chunks: audioChunks
    });

  } catch (error) {
    console.error('Script processing error:', error);
    return c.json({ 
      error: 'Failed to process script',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
