const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../server');

test('workspace data is persisted by the API', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'flowboard-'));
  const server = createApp({ dataFile: path.join(temp, 'workspace.json') });
  await new Promise(resolve => server.listen(0, resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const initial = await (await fetch(`${url}/api/state`)).json();
    initial.boards[0].name = 'Saved board';
    const saved = await fetch(`${url}/api/state`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(initial) });
    assert.equal(saved.status, 200);
    const reloaded = await (await fetch(`${url}/api/state`)).json();
    assert.equal(reloaded.boards[0].name, 'Saved board');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(temp, { recursive: true, force: true });
  }
});
