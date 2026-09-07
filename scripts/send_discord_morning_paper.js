const fs = require('fs');
const path = require('path');
const { buildNewspaper } = require('./generate_morning_paper');

// 若在 Windows 本地运行且检测到 Clash/本地代理，自动挂载 Dispatcher
if (process.platform === 'win32') {
  try {
    const { ProxyAgent, setGlobalDispatcher } = require('undici');
    const proxyUrl = process.env.https_proxy || process.env.http_proxy || 'http://127.0.0.1:7897';
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
  } catch (e) {}
}

// 读取 Webhook 配置
function getWebhookUrl() {
  // 1. 命令行参数
  if (process.argv[2] && process.argv[2].startsWith('http')) {
    return process.argv[2].trim();
  }

  // 2. 环境变量
  if (process.env.DISCORD_WEBHOOK_URL) {
    return process.env.DISCORD_WEBHOOK_URL.trim();
  }

  // 3. 配置文件 config/discord_webhook.txt
  const cfgPath = path.resolve(__dirname, '../config/discord_webhook.txt');
  if (fs.existsSync(cfgPath)) {
    const content = fs.readFileSync(cfgPath, 'utf8').trim();
    if (content.startsWith('http')) {
      return content;
    }
  }

  return null;
}

async function sendMorningPaperToDiscord() {
  console.log('=== 全球决策晨报 · Discord 发送调度器 ===');

  // 1. 生成最新高清晨报长图
  console.log('1. 正在抓取实时数据并生成高清晨报长图...');
  const imgPath = await buildNewspaper();

  if (!fs.existsSync(imgPath)) {
    console.error('错误：未找到生成的晨报长图：', imgPath);
    process.exit(1);
  }

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.log('\n[!] 提示：未检测到 Discord Webhook URL。');
    console.log('长图已成功生成在本地：');
    console.log(' -> ' + imgPath);
    console.log('\n如需自动推送到 Discord 群，只需将群频道的 Webhook URL 填入:');
    console.log(' -> ' + path.resolve(__dirname, '../config/discord_webhook.txt'));
    console.log('或直接运行：node scripts/send_discord_morning_paper.js <YOUR_DISCORD_WEBHOOK_URL>\n');
    return { success: false, reason: 'no_webhook', imgPath };
  }

  console.log('2. 正在上传并推送晨报长图到 Discord 频道...');
  const fileBuffer = fs.readFileSync(imgPath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const formData = new FormData();
  formData.append('payload_json', JSON.stringify({
    content: '☀️ **全球决策晨报 · 早间 08:00 权威核验特刊**\n> 跨市场实时行情 · 芯片算力 · 地缘博弈 · 冷眼观察\n> 15分钟全要素交叉核验 · 100% 权威交叉印证\n> 终端直达: https://global-news-8lp.pages.dev'
  }));
  formData.append('files[0]', blob, 'morning_paper.png');

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });

    if (res.ok || res.status === 204) {
      console.log('✅ [成功] 晨报长图已成功推送到 Discord 频道！');
      return { success: true, imgPath };
    } else {
      const errText = await res.text();
      console.error(`❌ [失败] Discord 返回错误 HTTP ${res.status}:`, errText);
      return { success: false, error: errText };
    }
  } catch (err) {
    console.error('❌ [网络错误] 发送到 Discord 失败:', err.message);
    return { success: false, error: err.message };
  }
}

if (require.main === module) {
  sendMorningPaperToDiscord().catch(console.error);
}

module.exports = { sendMorningPaperToDiscord };
