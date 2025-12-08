import { serve } from '@hono/node-server';
import app from './app';

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server is starting...`);
console.log(`👉 http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

