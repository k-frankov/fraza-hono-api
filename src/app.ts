import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { initializeFirebase } from './lib/firebase';
import { Variables } from './types';

// Routes
import healthRoute from './routes/health';
import helloRoute from './routes/hello';
import profileRoute from './routes/profile';

// Initialize services
initializeFirebase();

const app = new Hono<{ Variables: Variables }>();

// Global Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: '*', // Configure appropriately for production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Mount routes
app.route('/health', healthRoute);
app.route('/api/hello', helloRoute);
app.route('/api/profile', profileRoute);

// Root endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'Fraza Hono API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: `Route ${c.req.path} not found` }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`❌ Error: ${err.message}`);
  return c.json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message 
  }, 500);
});

export default app;
