import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

const schema = z.object({
  name: z.string().optional().default('World'),
});

app.get('/', zValidator('query', schema), (c) => {
  const { name } = c.req.valid('query');
  return c.json({ message: `Hello, ${name}!` });
});

export default app;
