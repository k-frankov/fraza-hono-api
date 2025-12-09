import { Hono } from 'hono';
import { SnippetRequestSchema } from '../lib/studio-types.js';
import { generateScript } from '../lib/studio-generator.js';

const app = new Hono();

// POST /api/studio/generate
app.post('/generate', async (c) => {
  try {
    const body = await c.req.json<unknown>();
    const result = SnippetRequestSchema.safeParse(body);

    if (!result.success) {
      return c.json({ 
        error: 'Invalid request',
        details: result.error.issues 
      }, 400);
    }

    const scriptRequest = result.data;

    // Use explicit `language` from client request (frontend sends `locale` from store).
    // Do NOT perform server-side profile lookup for language — the UI is authoritative.
    const language = 'language' in scriptRequest ? scriptRequest.language : 'en';

    // Attach language to generator input and generate script
    const generatorInput = { ...scriptRequest, language };
    const script = await generateScript(generatorInput);

    return c.json({ 
      success: true, 
      script: script 
    });

  } catch (error) {
    console.error('Script generation error:', error);
    return c.json({ 
      error: 'Failed to generate script',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
