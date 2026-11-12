import { createServer } from 'node:http';

export function createApp(db, logger = console.log) {
  return createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
      logger(JSON.stringify({ method: req.method, path: req.url, status }));
    };
    if (req.method !== 'GET') return send(405, { error: 'method_not_allowed' });
    if (req.url === '/health/live') return send(200, { status: 'up' });
    try {
      if (req.url === '/health/ready') {
        await db.query('SELECT 1');
        return send(200, { status: 'ready' });
      }
      if (req.url === '/api/balances') {
        const result = await db.query('SELECT account_id, balance_cents FROM demo_balance ORDER BY account_id');
        return send(200, { balances: result.rows });
      }
      return send(404, { error: 'not_found' });
    } catch (error) {
      logger(JSON.stringify({ event: 'database_query_failed', code: error.code ?? 'unknown' }));
      return send(503, { error: 'database_unavailable' });
    }
  });
}
