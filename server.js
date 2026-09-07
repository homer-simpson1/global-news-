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

  // 每日早间 08:00 自动生成晨报长图并推送到 Discord (0 Token 本地免唤醒)
  let lastMorningSentDate = '';
  function checkMorningPaperSchedule() {
    const now = new Date();
    if (now.getHours() === 8 && lastMorningSentDate !== now.toDateString()) {
      lastMorningSentDate = now.toDateString();
      console.log(`[早间 08:00 晨报调度] 触发晨报长图生成与推送...`);
      try {
        const { sendMorningPaperToDiscord } = require('./scripts/send_discord_morning_paper');
        sendMorningPaperToDiscord().then(res => {
          console.log('[早间 08:00 晨报调度] 执行结果:', res?.success ? '推送成功' : '完成 (等待 Webhook 填入)');
        }).catch(err => {
          console.error('[早间 08:00 晨报调度] 执行异常:', err.message);
        });
      } catch (err) {
        console.error('[早间 08:00 晨报调度] 模块调用异常:', err.message);
      }
    }
  }
  setInterval(checkMorningPaperSchedule, 30 * 1000);
});
