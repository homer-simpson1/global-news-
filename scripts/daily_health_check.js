const fs = require('fs');
const path = require('path');

async function runDailyHealthCheck() {
  console.log('====================================================');
  console.log('       [全球决策情报终端] 每日联网接口与数据自动巡检');
  console.log('====================================================');
  console.log('巡检执行时间:', new Date().toLocaleString('zh-CN', { hour12: false }));

  const endpoints = [
    { name: '华尔街见闻 7x24 全球快讯', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=global-channel&limit=5' },
    { name: '华尔街见闻 7x24 A股要闻', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=a-stock-channel&limit=5' },
    { name: '华尔街见闻 7x24 外汇通道', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=forex-channel&limit=5' },
    { name: '华尔街见闻 7x24 大宗商品', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=commodity-channel&limit=5' },
    { name: '新浪财经 7x24 全球直播流', url: 'https://zhibo.sina.com.cn/api/zhibo/feed?page=1&page_size=5&zhibo_id=152' },
    { name: '新浪全球高频行情引擎', url: 'https://hq.sinajs.cn/list=gb_inx,gb_ndx,gb_sox,hf_CL,hf_GC', headers: { Referer: 'https://finance.sina.com.cn' } },
    { name: '美联储 (FRED) 10年美债基准', url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10' }
  ];

  let passed = 0;
  const auditDetails = [];

  for (const ep of endpoints) {
    const t0 = Date.now();
    try {
      const res = await fetch(ep.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          ...(ep.headers || {})
        }
      });
      const ms = Date.now() - t0;
      if (res.ok) {
        passed++;
        console.log('[PASS] ' + ep.name + ' - 状态码: ' + res.status + ', 延迟: ' + ms + 'ms');
        auditDetails.push({ name: ep.name, ok: true, latency: ms });
      } else {
        console.log('[WARN] ' + ep.name + ' - 响应异常: ' + res.status);
        auditDetails.push({ name: ep.name, ok: false, status: res.status });
      }
    } catch (err) {
      console.log('[FAIL] ' + ep.name + ' - 异常: ' + err.message);
      auditDetails.push({ name: ep.name, ok: false, error: err.message });
    }
  }

  // 检查本机 API 输出
  let localApiStatus = '未连通';
  try {
    const localRes = await fetch('http://127.0.0.1:3000/api/ticker');
    if (localRes.ok) {
      const d = await localRes.json();
      const sp = d.data.quotes.find(q => q.symbol === '标普500')?.price;
      const ndx = d.data.quotes.find(q => q.symbol === '纳斯达克100')?.price;
      localApiStatus = '正常运行 (标普500: ' + sp + ', 纳指100: ' + ndx + ')';
    }
  } catch(e) {
    localApiStatus = '端口未启动或连接受阻';
  }

  const logEntry = '[' + new Date().toISOString() + '] 联网接口巡检结果: 通道通过率 ' + passed + '/' + endpoints.length + ', 本地服务: ' + localApiStatus + '\n';
  const logPath = path.join(__dirname, '..', 'logs', 'daily_audit.log');
  fs.appendFileSync(logPath, logEntry, 'utf8');

  console.log('----------------------------------------------------');
  console.log('巡检结论: 通道连通通过率: ' + passed + '/' + endpoints.length);
  console.log('终端行情与服务状态: ' + localApiStatus);
  console.log('巡检日志已持久化至: ' + logPath);
  console.log('====================================================');
}

runDailyHealthCheck();
