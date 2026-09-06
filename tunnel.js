const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('======================================================');
console.log('   GLOBAL INTEL TERMINAL // 全球决策情报站');
console.log('   正在启动本地服务与全球公网通道...');
console.log('======================================================\n');

// 1. 检查或启动本地 Next.js 服务
function ensureServerRunning(callback) {
  const req = http.get('http://127.0.0.1:3000', (res) => {
    console.log('[1/2] 本地服务已在运行中 (端口 3000/8501 就绪)');
    callback();
  });

  req.on('error', () => {
    console.log('[1/2] 正在启动本地核心服务 (server.js)...');
    const serverProc = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'ignore',
      detached: true,
    });
    serverProc.unref();

    // 等待服务就绪
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      http.get('http://127.0.0.1:3000', (res) => {
        clearInterval(checkInterval);
        console.log('[1/2] 本地服务启动成功！');
        callback();
      }).on('error', () => {
        if (attempts > 30) {
          clearInterval(checkInterval);
          console.error('本地服务启动超时，请重试');
        }
      });
    }, 1000);
  });
}

// 2. 启动 Cloudflare Tunnel 并提取公网网址
function startTunnel() {
  const cloudflaredPath = path.join(__dirname, 'cloudflared.exe');
  if (!fs.existsSync(cloudflaredPath)) {
    console.error(`未找到 cloudflared.exe，请确保其位于: ${cloudflaredPath}`);
    return;
  }

  console.log('[2/2] 正在建立 Cloudflare 全球公网隧道 (免域名免配置)...');
  console.log('请稍候约 5~10 秒，系统将自动弹出公网网址...\n');

  const tunnel = spawn(cloudflaredPath, ['tunnel', '--url', 'http://127.0.0.1:3000'], {
    cwd: __dirname,
  });

  let urlFound = false;

  function checkChunk(chunk) {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !urlFound) {
      urlFound = true;
      const publicUrl = match[0];

      console.log('\n======================================================');
      console.log('  ★ 专属公网网址已生成 (手机与朋友均可直接打开):');
      console.log(`  >>>  ${publicUrl}  <<<`);
      console.log('======================================================\n');
      console.log('提示：');
      console.log('1. 可以将上方链接直接发到微信，或在手机浏览器中打开。');
      console.log('2. 保持此窗口打开，即可随时多人在线访问。');
      console.log('3. 关闭此黑色窗口即停止公网分享。\n');

      // 自动在默认浏览器中打开
      exec(`start ${publicUrl}`);
    }
  }

  tunnel.stdout.on('data', checkChunk);
  tunnel.stderr.on('data', checkChunk);

  tunnel.on('close', (code) => {
    console.log(`\n隧道已关闭 (code: ${code})`);
  });
}

ensureServerRunning(() => {
  startTunnel();
});
