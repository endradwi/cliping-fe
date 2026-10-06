import { join } from 'path';

const port = Number(process.env.PORT) || 5173;
const buildDir = join(import.meta.dir, 'build');

console.log(`Serving Cheat-Clip Web from ${buildDir} on port ${port}...`);

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;
    if (pathname === '/' || pathname === '') pathname = '/index.html';

    let file = Bun.file(join(buildDir, pathname));
    if (!(await file.exists())) {
      file = Bun.file(join(buildDir, 'index.html'));
    }

    return new Response(file);
  }
});
