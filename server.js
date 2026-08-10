const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const root = __dirname;
const initialState = {
  currentBoardId: 'launch',
  boards: [{
    id: 'launch', name: 'Product launch', color: '#685bd2',
    description: 'Everything needed to take Flowboard from a bright idea to launch day.',
    columns: [
      { id: 'ideas', name: 'Ideas', cards: [
        { id: 'c1', title: 'Collect customer story angles', description: 'Find the strongest early-adopter stories for launch week.', assignee: 'maya', due: '2026-08-15', label: 'marketing', priority: 'normal' },
        { id: 'c2', title: 'Draft launch day social posts', description: 'Create a short, warm campaign for each platform.', assignee: 'you', due: '2026-08-18', label: 'coral', priority: 'low' }
      ]},
      { id: 'progress', name: 'In progress', cards: [
        { id: 'c3', title: 'Polish onboarding flow', description: 'Make the first ten minutes feel effortless.', assignee: 'lina', due: '2026-08-12', label: 'violet', priority: 'high' },
        { id: 'c4', title: 'Prepare pricing comparison', description: 'A clear page that helps small teams choose with confidence.', assignee: 'noah', due: '2026-08-16', label: 'blue', priority: 'normal' }
      ]},
      { id: 'review', name: 'Ready for review', cards: [
        { id: 'c5', title: 'Update product screenshots', description: 'Replace the dashboard images in the announcement.', assignee: 'sam', due: '2026-08-11', label: 'violet', priority: 'high' }
      ]},
      { id: 'done', name: 'Done', cards: [
        { id: 'c6', title: 'Confirm launch checklist', description: 'Roles, comms and launch-day timings are aligned.', assignee: 'you', due: '2026-08-09', label: 'gold', priority: 'normal' }
      ]}
    ]
  }, {
    id: 'website', name: 'Website refresh', color: '#e47c6b', description: 'A calmer, clearer new home for the brand.',
    columns: [{ id: 'todo', name: 'To do', cards: [{ id: 'c7', title: 'Audit current navigation', description: '', assignee: 'noah', due: '', label: 'blue', priority: 'normal' }] }, { id: 'doing', name: 'In progress', cards: [] }, { id: 'complete', name: 'Complete', cards: [] }]
  }]
};

function createApp({ dataFile = path.join(root, 'data', 'flowboard.json') } = {}) {
  let writeQueue = Promise.resolve();
  async function readState() {
    try { return JSON.parse(await fsp.readFile(dataFile, 'utf8')); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await fsp.mkdir(path.dirname(dataFile), { recursive: true });
      await fsp.writeFile(dataFile, JSON.stringify(initialState, null, 2));
      return structuredClone(initialState);
    }
  }
  function json(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  }
  async function body(req) {
    let raw = '';
    for await (const chunk of req) { raw += chunk; if (raw.length > 1_000_000) throw new Error('Request body is too large'); }
    return JSON.parse(raw);
  }
  return http.createServer(async (req, res) => {
    try {
      if (req.url === '/api/state' && req.method === 'GET') return json(res, 200, await readState());
      if (req.url === '/api/state' && req.method === 'PUT') {
        const next = await body(req);
        if (!next || !Array.isArray(next.boards) || typeof next.currentBoardId !== 'string') return json(res, 400, { error: 'Invalid workspace data' });
        writeQueue = writeQueue.then(async () => {
          await fsp.mkdir(path.dirname(dataFile), { recursive: true });
          const temp = `${dataFile}.tmp`;
          await fsp.writeFile(temp, JSON.stringify(next, null, 2));
          await fsp.rename(temp, dataFile);
        });
        await writeQueue;
        return json(res, 200, { saved: true });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' });
      const requested = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.resolve(root, requested);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return json(res, 404, { error: 'Not found' });
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    } catch (error) { json(res, 500, { error: error.message || 'Server error' }); }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 4173);
  createApp().listen(port, () => console.log(`Flowboard is running at http://localhost:${port}`));
}

module.exports = { createApp };
