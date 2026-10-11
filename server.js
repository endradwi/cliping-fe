import { join } from 'path';

const port = Number(process.env.PORT) || 5173;
const buildDir = join(import.meta.dir, 'build');
const apiBackend = (process.env.PUBLIC_API_URL || process.env.API_URL || 'https://api-clip.endra.web.id').replace(/\/$/, '');

console.log(`Serving Cheat-Clip Web from ${buildDir} on port ${port}...`);
console.log(`API reverse proxy configured to: ${apiBackend}`);

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Zero-CORS API reverse proxy directly to backend
    if (pathname.startsWith('/api/')) {
      const targetUrl = `${apiBackend}${pathname}${url.search}`;
      const headers = new Headers(req.headers);
      const targetHost = new URL(apiBackend).host;
      headers.set('host', targetHost);

      const fetchOptions = {
        method: req.method,
        headers,
        duplex: 'half'
      };

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        fetchOptions.body = req.body;
      }

      try {
        return await fetch(targetUrl, fetchOptions);
      } catch (err) {
        console.error(`Reverse proxy error for ${targetUrl}:`, err);
        return new Response(JSON.stringify({ success: false, error: { message: 'Gateway proxy error' } }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    let filePath = pathname === '/' || pathname === '' ? '/index.html' : pathname;
    let file = Bun.file(join(buildDir, filePath));
    if (!(await file.exists())) {
      file = Bun.file(join(buildDir, 'index.html'));
    }

    return new Response(file);
  }
});
