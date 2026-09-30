const { spawn } = require('child_process');
const path = require('path');

const nodeExec = 'E:\\nvm\\v24.20.0\\node.exe';
const serverScript = path.resolve(__dirname, '..', 'server.js');
const cwd = path.resolve(__dirname, '..');

let isShuttingDown = false;

function startServer() {
  if (isShuttingDown) return;
  console.log('[DAEMON SUPERVISOR] 正在启动全球决策情报终端主服务 (端口 3000 / 8501)...');

  const child = spawn(nodeExec, [serverScript], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, PORT: '3000' },
  });

  child.on('exit', (code, signal) => {
    if (isShuttingDown) return;
    console.warn(`[DAEMON SUPERVISOR] 监测到主服务退出 (Code: ${code}, Signal: ${signal})，AI 站长将在 1 秒后自动自愈拉起...`);
    setTimeout(startServer, 1000);
  });

  child.on('error', (err) => {
    console.error('[DAEMON SUPERVISOR] 进程启动异常:', err);
    setTimeout(startServer, 2000);
  });
}

process.on('SIGINT', () => {
  isShuttingDown = true;
  process.exit(0);
});

process.on('SIGTERM', () => {
  isShuttingDown = true;
  process.exit(0);
});

startServer();
