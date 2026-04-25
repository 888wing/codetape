import { createServer } from 'node:http';
import { watch, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { loadCodetapeData } from '../utils/load-codetape-data.js';
import { generateDashboard } from '../dashboard.js';

export async function serve(args) {
  const projectDir = process.cwd();
  const codetapeDir = join(projectDir, '.codetape');

  // 1. Check .codetape/ exists
  if (!existsSync(codetapeDir)) {
    console.error('\nCodetape is not initialized. Run: npx codetape init\n');
    process.exit(1);
  }

  // 2. Parse --port flag (default 3210)
  let port = 3210;
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    port = parseInt(args[portIdx + 1], 10);
    if (isNaN(port)) port = 3210;
  }

  // 3. Read package version
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'));

  // 4. Track SSE clients
  const sseClients = new Set();

  // 5. Create HTTP server
  const server = createServer((req, res) => {
    // GET / → HTML dashboard
    if (req.url === '/' || req.url === '/index.html') {
      const data = loadCodetapeData(projectDir);
      const html = generateDashboard(data, pkg.version);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // GET /api/data → JSON
    if (req.url === '/api/data') {
      const data = loadCodetapeData(projectDir);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': `http://localhost:${port}`
      });
      res.end(JSON.stringify(data));
      return;
    }

    // GET /events → SSE
    if (req.url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': `http://localhost:${port}`
      });
      res.write('data: connected\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    // 404 everything else
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  // 6. Watch .codetape/ for changes, debounced
  let debounceTimer = null;
  try {
    watch(codetapeDir, { recursive: true }, (eventType, filename) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const payload = JSON.stringify({ type: 'change', file: filename });
        for (const client of sseClients) {
          client.write(`data: ${payload}\n\n`);
        }
      }, 300);
    });
  } catch (err) {
    console.warn('Warning: file watching not available. Dashboard will not auto-refresh.');
  }

  // 7. Start server
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n✓ Codetape Dashboard: ${url}`);
    console.log('✓ Watching .codetape/ for changes');
    console.log('\nPress Ctrl+C to stop\n');

    // 8. Auto-open browser
    const openCmd = process.platform === 'darwin' ? 'open'
      : process.platform === 'win32' ? 'start'
      : 'xdg-open';
    execFile(openCmd, [url]);
  });

  // 9. Handle port already in use
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${port} is already in use. Try: npx codetape serve --port ${port + 1}\n`);
      process.exit(1);
    }
    throw err;
  });

  // 10. Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n■ Dashboard stopped.');
    server.close();
    process.exit(0);
  });
}
