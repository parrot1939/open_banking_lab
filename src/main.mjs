import pg from 'pg';
import { createApp } from './app.mjs';
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 2000, query_timeout: 2500 });
db.on('error', error => console.error(JSON.stringify({ event: 'database_idle_error', code: error.code })));
const server = createApp(db);
server.listen(3000, '0.0.0.0');
process.once('SIGTERM', () => server.close(() => db.end()));
