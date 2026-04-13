const { spawn } = require('child_process');
const http = require('http');
const net = require('net');

const PYTHON = '/home/medserva/virtualenv/domains/security.medservafrica.com/public_html/securityagent/backend/3.11/bin/python3.11';
const BACKEND_DIR = '/home/medserva/domains/security.medservafrica.com/public_html/securityagent/backend';
const PORT = process.env.PORT || 3001;
const UVICORN_PORT = 8001;

const uvicorn = spawn(PYTHON, [
    '-m', 'uvicorn',
    'main:app',
    '--host', '127.0.0.1',
    '--port', String(UVICORN_PORT),
    '--workers', '1'
], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PYTHONPATH: BACKEND_DIR }
});

uvicorn.stdout.on('data', d => process.stdout.write(d));
uvicorn.stderr.on('data', d => process.stderr.write(d));
uvicorn.on('exit', code => { console.error('uvicorn exited', code); process.exit(1); });

function waitForPort(port, cb, retries = 20) {
    const sock = net.connect(port, '127.0.0.1');
    sock.on('connect', () => { sock.destroy(); cb(); });
    sock.on('error', () => {
        if (retries <= 0) { console.error('uvicorn never started'); process.exit(1); }
        setTimeout(() => waitForPort(port, cb, retries - 1), 500);
    });
}

waitForPort(UVICORN_PORT, () => {
    const proxy = http.createServer((req, res) => {
        // Strip /api prefix before forwarding to uvicorn
        const stripped = req.url.replace(/^\/api/, '') || '/';

        const options = {
            hostname: '127.0.0.1',
            port: UVICORN_PORT,
            path: stripped,
            method: req.method,
            headers: req.headers
        };

        const pReq = http.request(options, pRes => {
            res.writeHead(pRes.statusCode, pRes.headers);
            pRes.pipe(res);
        });
        pReq.on('error', e => { res.writeHead(502); res.end(e.message); });
        req.pipe(pReq);
    });

    proxy.listen(PORT, () => console.log(`Proxy listening on ${PORT} -> uvicorn:${UVICORN_PORT}`));
});
