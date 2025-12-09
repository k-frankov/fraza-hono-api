import { serve } from '@hono/node-server';
import app from './app.js';

const port = parseInt(process.env.PORT || '3000');

console.info(`🚀 Server is starting...`);
console.info(`👉 http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

