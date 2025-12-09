import { Hono } from 'hono';
import { sql } from '../lib/db.js';

const app = new Hono();

// GET /api/scripts/list?userId=xxx
app.get('/list', async (c) => {
  try {
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'Missing userId parameter' }, 400);
    }

    const scripts = await sql`
      SELECT 
        s.id,
        s.title,
        s.native_language,
        s.learning_language,
        s.created_at,
        COUNT(sc.id) as chunk_count
      FROM scripts s
      LEFT JOIN script_chunks sc ON sc.script_id = s.id
      WHERE s.user_id = ${userId}
      GROUP BY s.id, s.title, s.native_language, s.learning_language, s.created_at
      ORDER BY s.created_at DESC
    `;

    return c.json({ 
      success: true,
      scripts
    });

  } catch (error) {
    console.error('Failed to fetch scripts:', error);
    return c.json({ 
      error: 'Failed to fetch scripts',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/scripts/:id
app.get('/:id', async (c) => {
  try {
    const scriptId = c.req.param('id');

    if (!scriptId) {
      return c.json({ error: 'Missing script ID' }, 400);
    }

    const [script] = await sql`
      SELECT 
        id,
        user_id,
        title,
        original_script,
        native_language,
        learning_language,
        created_at
      FROM scripts
      WHERE id = ${scriptId}
    `;

    if (!script) {
      return c.json({ error: 'Script not found' }, 404);
    }

    const chunks = await sql`
      SELECT 
        id,
        sequence_order,
        native_text,
        learning_text,
        native_audio_url,
        learning_audio_url
      FROM script_chunks
      WHERE script_id = ${scriptId}
      ORDER BY sequence_order ASC
    `;

    return c.json({ 
      success: true,
      script,
      chunks
    });

  } catch (error) {
    console.error('Failed to fetch script:', error);
    return c.json({ 
      error: 'Failed to fetch script',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
