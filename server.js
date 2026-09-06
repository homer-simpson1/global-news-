const { createServer } = require('http');
const next = require('next');

const dev = false;
const hostname = '0.0.0.0';
const primaryPort = 3000;
const legacyPort = 8501;

const app = next({ dev, hostname, port: primaryPort });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // 主服务：端口 3000
  const serverPrimary = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error handling request on 3000:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  serverPrimary.listen(primaryPort, '0.0.0.0', () => {
    console.log(`[OK] 主服务已就绪: http://localhost:${primaryPort} 或 http://127.0.0.1:${primaryPort}`);
  });

  // 兼容服务：端口 8501 (满足习惯访问 8501 端口的用户)
  const serverLegacy = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error handling request on 8501:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  serverLegacy.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[提示] 8501 端口已被占用，请使用 3000 端口访问`);
    } else {
      console.error('8501 服务异常:', err);
    }
  });

  serverLegacy.listen(legacyPort, '0.0.0.0', () => {
    console.log(`[OK] 兼容服务已就绪: http://localhost:${legacyPort} 或 http://127.0.0.1:${legacyPort}`);
  });
});
