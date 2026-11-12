import { once } from 'node:events';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../src/app.mjs';

test('utrata i odzyskanie połączenia z bazą', async t => {
  let available = true;
  const logs = [];
  const db = { async query(sql) {
    if (!available) throw Object.assign(new Error('internal detail'), { code: 'ECONNREFUSED' });
    return { rows: sql === 'SELECT 1' ? [] : [{ account_id: 'DEMO-01', balance_cents: 12500 }] };
  }};
  const app = createApp(db, line => logs.push(JSON.parse(line))).listen(0, '127.0.0.1');
  t.after(() => app.close());
  await once(app,'listening');
  const request = path => fetch('http://127.0.0.1:' + app.address().port + path);
  assert.equal((await request('/health/ready')).status, 200);
  assert.deepEqual(await (await request('/api/balances')).json(),
    { balances: [{ account_id: 'DEMO-01', balance_cents: 12500 }] });
  available = false;
  assert.equal((await request('/health/live')).status, 200);
  assert.equal((await request('/health/ready')).status, 503);
  const failed = await request('/api/balances');
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { error: 'database_unavailable' });
  assert.ok(logs.some(line => line.code === 'ECONNREFUSED'));
  available = true;
  assert.equal((await request('/health/ready')).status, 200);
  assert.equal((await request('/missing')).status, 404);
});
