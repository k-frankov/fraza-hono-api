import { createMiddleware } from 'hono/factory';
import { getAuth } from '../lib/firebase.js';
import { Variables } from '../types.js';

// Middleware to verify Firebase token
export const verifyFirebaseToken = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Add user info to context
    c.set('user', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: typeof decodedToken.name === 'string' ? decodedToken.name : undefined,
      picture: typeof decodedToken.picture === 'string' ? decodedToken.picture : undefined,
    });

    await next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
});

