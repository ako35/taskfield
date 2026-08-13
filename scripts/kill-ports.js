const { execSync } = require('node:child_process');

const ports = ['3000', '5173', '8081'];

for (const port of ports) {
    try {
        if (process.platform === 'win32') {
            execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F >nul 2>&1`, { stdio: 'ignore' });
        } else {
            execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: 'ignore' });
        }
    } catch {
        // ignore: port may already be free
    }
}
