import { Hono } from 'hono'
import { sql } from '../lib/db.js'

const app = new Hono()

// GET /api/user/profile?userId=xxx
app.get('/profile', async (c) => {
  const userId = c.req.query('userId');

  if (!userId) {
    return c.json({ error: 'Missing userId' }, 400);
  }

  try {
    const result = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${userId}
    `;

    if (result.length === 0) {
      return c.json({ exists: false });
    }

    return c.json({ exists: true, profile: result[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// POST /api/user/profile
app.post('/profile', async (c) => {
  try {
    const body = await c.req.json<{
      userId: string;
      nativeLanguage: string;
      learningLanguage: string;
    }>();
    const { userId, nativeLanguage, learningLanguage } = body;

    if (!userId || !nativeLanguage || !learningLanguage) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const result = await sql`
      INSERT INTO user_profiles (user_id, native_language, learning_language)
      VALUES (${userId}, ${nativeLanguage}, ${learningLanguage})
      RETURNING *
    `;

    return c.json({ success: true, profile: result[0] }, 201);
  } catch (error) {
    console.error('Error creating profile:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default app
