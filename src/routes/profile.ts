import { Hono } from 'hono';
import { verifyFirebaseToken } from '../middleware/auth';
import { Variables } from '../types';

const app = new Hono<{ Variables: Variables }>();

app.use('*', verifyFirebaseToken);

app.get('/', (c) => {
  const user = c.get('user');
  
  return c.json({
    message: 'Authenticated successfully',
    user: {
      uid: user.uid,
      email: user.email,
      name: user.name,
      picture: user.picture,
    }
  });
});

export default app;
