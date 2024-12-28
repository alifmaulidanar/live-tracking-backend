import { Hono } from 'hono';
import auth from './routes/auth';
import trip from './routes/trips';
import user from './routes/users';
import admin from './routes/admin';
import ticket from './routes/tickets';
import profile from './routes/profile';
import geofence from './routes/geofences';
import { corsMiddleware } from './middleware/cors';
import emergency from './routes/[emergency]/emergency';

const app = new Hono();

// Middleware global (CORS)
app.use(corsMiddleware);

// Routes
app.route('/', auth);
app.route('/', admin);
app.route('/', user);
app.route('/', profile);
app.route('/', geofence);
app.route('/', ticket);
app.route('/', trip);

// Emergency route
app.route('/api/emergency', emergency);

// Base route
app.get('/', (c) => {
  return c.text('Hello from Hono!');
});

export default app