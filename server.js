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

  // 15分钟自动化新闻真实性与准确性自检引擎
  const VERIFY_INTERVAL_MS = 15 * 60 * 1000;
  async function triggerVerification() {
    try {
      const res = await fetch(`http://127.0.0.1:${primaryPort}/api/verify?force=true`);
      if (res.ok) {
        const d = await res.json();
        console.log(`[15分钟自动核验] 巡检成功 - 得分: ${d.data?.accuracyScore}/100 | 合格率: ${d.data?.passRate} | 总条数目: ${d.data?.totalNewsChecked} | 时间: ${d.data?.verifiedAtLocal}`);
      }
    } catch (e) {
      console.warn('[15分钟自动核验] 巡检触发异常:', e.message);
    }
  }

  // 服务启动 5 秒后执行首次核验，其后每 15 分钟循环自检
  setTimeout(triggerVerification, 5000);
  setInterval(triggerVerification, VERIFY_INTERVAL_MS);
});
