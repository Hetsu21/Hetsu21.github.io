/** Local preview with automatic HTML rebuilds when src/ changes. */
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {watch} from 'node:fs';
import {dirname, extname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './build.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const port = Number(process.env.PORT || 8080);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

await build();
let pending = false;
let running = false;
let timer;
async function rebuild() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  try {
    await build();
  } catch (error) {
    console.error(`Build failed; keeping the previous page: ${error.message}`);
  } finally {
    running = false;
    if (pending) {
      pending = false;
      await rebuild();
    }
  }
}
const watcher = watch(resolve(root, 'src'), {recursive: true}, () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 80);
});

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, {Allow: 'GET, HEAD'}).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    const file = resolve(
      dist,
      '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname),
    );
    if (!file.startsWith(dist + sep)) {
      response.writeHead(403).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.on('error', error => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Port ${port} is busy. Stop the other preview, or run PORT=8081 npm run dev.`
      : error.message,
  );
  watcher.close();
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Portfolio: http://127.0.0.1:${port}/`);
  console.log('Watching src/. Save changes, then refresh your browser.');
});
function stop() {
  clearTimeout(timer);
  watcher.close();
  server.close();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
