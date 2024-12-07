import { Hono } from 'hono';
import auth from './routes/auth';
import user from './routes/users';
import profile from './routes/profile';
import location from './routes/location';
import { corsMiddleware } from './middleware/cors';

const app = new Hono();

// Middleware global (CORS)
app.use(corsMiddleware);

// Routes
app.route('/', auth);
app.route('/', location);
app.route('/', user);
app.route('/', profile);

// Base route
app.get('/', (c) => {
  return c.text('Hello from Hono!');
});

export default app