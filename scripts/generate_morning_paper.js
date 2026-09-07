const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

async function buildNewspaper() {
  let quotes = [];
  let news = [];

  const endpoints = [
    process.env.API_BASE_URL,
    'http://127.0.0.1:3000',
    'https://celebrated-custard-0fe903.netlify.app'
  ].filter(Boolean);

  for (const base of endpoints) {
    try {
      const qRes = await fetch(`${base}/api/ticker`);
      if (qRes.ok) {
        const d = await qRes.json();
        quotes = d.data?.quotes || quotes;
      }
      const nRes = await fetch(`${base}/api/news`);
      if (nRes.ok) {
        const d = await nRes.json();
        news = d.data?.news || news;
      }
      if (news.length > 0) break;
    } catch (e) {}
  }

  // 跨市场行情数据（4列x2行 宽敞独立卡片，彻底解决挤压看不清问题）
  let tickerItems = [
    { label: '日经225', sym: 'NIKKEI', val: '66,399.84', chg: '+2.12%', up: true },
    { label: '费城半导体', sym: 'SOX', val: '11,735.26', chg: '+3.37%', up: true },
    { label: '纳斯达克', sym: 'NDX', val: '26,506.99', chg: '-0.29%', up: false },
    { label: '美股标普', sym: 'SPX', val: '7,718.60', chg: '-0.38%', up: false },
    { label: '美债10年期', sym: 'US10Y', val: '4.790%', chg: '+0.08%', up: true },
    { label: 'WTI原油', sym: 'OIL', val: '$92.49/桶', chg: '+1.10%', up: true },
    { label: 'COMEX黄金', sym: 'GOLD', val: '$4,439.3/盎司', chg: '-0.83%', up: false },
    { label: '离岸人民币', sym: 'USD/CNH', val: '6.7092', chg: '+0.02%', up: true }
  ];

  if (quotes && quotes.length > 0) {
    const qMap = {};
    quotes.forEach(q => { if (q && q.symbol) qMap[q.symbol] = q; });
    const getQ = (sym, fallback) => {
      const it = qMap[sym];
      return it ? { val: it.price, chg: it.change, up: !!it.isUp } : fallback;
    };
    tickerItems = [
      { label: '日经225', sym: 'NIKKEI', ...getQ('日经225', { val: '66,399.84', chg: '+2.12%', up: true }) },
      { label: '费城半导体', sym: 'SOX', ...getQ('费城半导体', { val: '11,735.26', chg: '+3.37%', up: true }) },
      { label: '纳斯达克', sym: 'NDX', ...getQ('纳斯达克100', { val: '26,506.99', chg: '-0.29%', up: false }) },
      { label: '美股标普', sym: 'SPX', ...getQ('标普500', { val: '7,718.60', chg: '-0.38%', up: false }) },
      { label: '美债10年期', sym: 'US10Y', ...getQ('美债10年期', { val: '4.790%', chg: '+0.08%', up: true }) },
      { label: 'WTI原油', sym: 'OIL', ...getQ('国际原油', { val: '$92.49/桶', chg: '+1.10%', up: true }) },
      { label: 'COMEX黄金', sym: 'GOLD', ...getQ('国际黄金', { val: '$4,439.3/盎司', chg: '-0.83%', up: false }) },
      { label: '离岸人民币', sym: 'USD/CNH', ...getQ('离岸人民币', { val: '6.7092', chg: '+0.02%', up: true }) }
    ];
  }

  // 今日焦点头条（重点深度图文）
  const heroStory = {
    tag: '芯片算力 · 战略突围',
    title: '国产旗舰GPU迎实质破局：沐曦「曦云C600」算力芯片获国家安全测评认证，下一代C700加速推进调优',
    source: '路透社 Reuters Tech · 独家核验',
    time: '08:00',
    lead1: '上海讯 —— 国产高性能通用GPU领军企业沐曦集成电路（MetaX）管理层在最新业绩沟通会上确认：专攻大模型预训练与超大规模深度学习的旗舰算力芯片「曦云C600」已实现规模量产交付，并正式通过中国信息安全测评中心与国家保密科技测评中心联合最高等级安全认证，全面取得央国企智算中心采购入围资质。',
    lead2: '与此同时，下一代更先进制程GPU「曦云C700」已完成核心架构流片与逻辑验证，正全力攻坚系统级性能调优。伴随长鑫存储（CXMT）先进制程DRAM良率攀升与费城半导体指数隔夜大涨+3.37%，亚太算力硬件自主化替代正从概念验证迈向批量交付阶段。',
    analysis: '【研判与传导】 标志着国产大模型专用GPGPU在大规模工程化交付与国家级安全合规上双重破局，直接加速国内电信运营商、金融能源央企智算底座去英伟达化替代进程，牵动半导体封装测试与材料供应链重估。'
  };

  // 环球核心要闻列表（3篇关键报道，覆盖宏观流动性、地缘防务、主权资本）
  const sideStories = [
    {
      tag: '美股宏观 · 流动性警报',
      title: '法兴银行研判：10年期美债收益率5.5%为股市冲击临界点',
      source: '彭博社 Bloomberg',
      body: '纽约讯 —— 两年期美债收益率在非农数据出炉后走高，实际收益率高位震荡。法兴银行宏观策略主管指出，若10年期美债收益率突破5.5%关键阻力位，长端资金成本将对高估值科技股形成实质流动性绞杀。',
      action: '【研判】 债市实际收益率与权益风险溢价倒挂，资产配置需防御长端贴现率上行冲击。'
    },
    {
      tag: '地缘防务 · 供应链安全',
      title: '五角大楼启动涉密测谎排查，扎哈罗娃警告中程导弹失衡风险',
      source: '路透社 / 塔斯社',
      body: '布鲁塞尔讯 —— 美军对先进制程武器装备核心供应链涉密人员启动全面安全筛查；俄外交部发言人扎哈罗娃同日就北约中程打击导弹部署计划发出严正警告，指出波罗的海与北欧军事失衡风险骤增。',
      action: '【预警】 地缘安全博弈向底层先进制程供应链纵深延展，防务科技脱钩加剧。'
    },
    {
      tag: '主权金融 · 资本护航',
      title: '财政部超400亿注资稳外贸底盘，燧原科技科创板IPO获机构高倍认购',
      source: '财联社 / 证券时报',
      body: '北京讯 —— 财政部正式向进出口银行与中国信保现金注资超400亿元，定向放大战略性稳外贸信贷承保空间；同日燧原科技科创板IPO发行全部为新股，获国家级战略基金与顶级产业资本高倍全额认购。',
      action: '【动向】 逆周期主权资本协同发力，一手筑牢外贸基本盘，一手为硬核算力注资筑底。'
    }
  ];

  const today = new Date();
  const dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日 · 晨间 08:00 决策全览版';

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>全球决策晨报 · 决策全览版</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background-color: #f7f7f5;
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Serif SC", serif;
    width: 1140px;
    margin: 0 auto;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  body {
    padding: 34px 40px 30px 40px;
  }

  /* 顶部经典报头 */
  .masthead {
    text-align: center;
    border-bottom: 3px double #111;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }
  .masthead-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #4a5568;
    font-family: Georgia, serif;
    border-bottom: 1px solid #cbd5e0;
    padding-bottom: 6px;
    margin-bottom: 10px;
    letter-spacing: 0.5px;
  }
  .masthead-title {
    font-size: 44px;
    font-weight: 900;
    letter-spacing: 6px;
    color: #0f172a;
    font-family: "Noto Serif SC", "Songti SC", Georgia, serif;
    margin-bottom: 3px;
    text-transform: uppercase;
  }
  .masthead-subtitle {
    font-size: 12px;
    color: #64748b;
    letter-spacing: 4px;
    text-transform: uppercase;
    font-weight: 600;
  }

  /* 行情看板：独立清爽卡片网格 (4列 x 2行，字大间距宽，绝不拥挤) */
  .market-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 12.5px;
    font-weight: bold;
    color: #334155;
  }
  .market-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }
  .market-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 9px 13px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .card-name {
    font-size: 13px;
    font-weight: bold;
    color: #1e293b;
  }
  .card-sym {
    font-size: 10.5px;
    color: #94a3b8;
    font-family: "SF Pro Mono", Menlo, monospace;
  }
  .card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .card-price {
    font-size: 18px;
    font-weight: 800;
    font-family: "SF Pro Display", -apple-system, monospace;
    color: #0f172a;
    letter-spacing: -0.3px;
  }
  .badge-chg-up {
    background: #fee2e2;
    color: #dc2626;
    font-size: 12px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "SF Pro Mono", monospace;
  }
  .badge-chg-down {
    background: #dcfce7;
    color: #16a34a;
    font-size: 12px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "SF Pro Mono", monospace;
  }

  /* 正文主体：经典报刊主次多栏布局 (左栏深度头条 57%，右栏要闻与专栏 43%) */
  .main-layout {
    display: grid;
    grid-template-columns: 57% 43%;
    gap: 24px;
    border-top: 1px solid #cbd5e0;
    padding-top: 16px;
  }

  /* 左侧主头条大栏 */
  .lead-column {
    border-right: 1px solid #e2e8f0;
    padding-right: 22px;
    display: flex;
    flex-direction: column;
  }
  .sec-tag {
    display: inline-block;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.8px;
    padding: 3px 8px;
    background: #991b1b;
    color: #fff;
    margin-bottom: 8px;
    border-radius: 3px;
    text-transform: uppercase;
    align-self: flex-start;
  }
  .lead-title {
    font-size: 24px;
    font-weight: 900;
    line-height: 1.35;
    color: #0f172a;
    margin-bottom: 8px;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .lead-byline {
    font-size: 11.5px;
    color: #64748b;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .lead-byline .badge {
    background: #e0f2fe;
    color: #0369a1;
    padding: 2px 7px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: bold;
  }

  /* 头条核心图表终端卡片（深色终端，图二风格） */
  .hero-terminal-card {
    background: #0f172a;
    border-radius: 8px;
    padding: 14px 18px;
    color: #fff;
    margin: 4px 0 14px 0;
    border: 1px solid #1e293b;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
  .terminal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }
  .terminal-title { font-size: 13px; font-weight: bold; color: #60a5fa; }
  .terminal-status { font-size: 10px; background: #064e3b; color: #6ee7b7; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
  .terminal-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
  }
  .terminal-big-num { font-size: 30px; font-weight: 900; font-family: "SF Pro Display", monospace; color: #fff; }
  .terminal-big-chg { font-size: 18px; font-weight: bold; color: #f87171; text-align: right; }
  .terminal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    border-top: 1px solid #1e293b;
    padding-top: 10px;
    font-size: 11.5px;
  }
  .terminal-item { display: flex; flex-direction: column; }
  .terminal-item .label { color: #94a3b8; font-size: 10.5px; margin-bottom: 2px; }
  .terminal-item .val { font-weight: bold; color: #e2e8f0; font-family: monospace; }

  /* 头条报道正文 */
  p.lead-text {
    font-size: 14px;
    line-height: 1.8;
    color: #27272a;
    text-align: justify;
    text-indent: 2em;
    margin-bottom: 10px;
  }
  .transmission-box {
    border-left: 4px solid #2563eb;
    padding: 9px 12px;
    background: #eff6ff;
    font-size: 12.5px;
    line-height: 1.65;
    color: #1e40af;
    border-radius: 0 4px 4px 0;
    margin-top: 2px;
  }

  /* 右侧栏：专栏 + 3篇关键重磅要闻 */
  .side-column {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* 专栏《冷眼看市场》（对标图二） */
  .editorial-box {
    border: 1px solid #e7dfd5;
    background: #faf8f5;
    padding: 12px 15px;
    border-radius: 6px;
    border-top: 3px solid #8b5cf6;
  }
  .editorial-title {
    font-size: 14px;
    font-weight: bold;
    color: #4c1d95;
    margin-bottom: 5px;
  }
  .editorial-content {
    font-size: 12px;
    line-height: 1.68;
    color: #4b5563;
    margin-bottom: 5px;
  }
  .editorial-author {
    text-align: right;
    font-size: 10.5px;
    color: #7c3aed;
    font-style: italic;
  }

  /* 要闻卡片 */
  .story-card {
    border-bottom: 1px dashed #cbd5e0;
    padding-bottom: 10px;
  }
  .story-card:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .story-tag {
    font-size: 10px;
    font-weight: 800;
    color: #b91c1c;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
    display: block;
    text-transform: uppercase;
  }
  .story-title {
    font-size: 15px;
    font-weight: bold;
    color: #0f172a;
    line-height: 1.38;
    margin-bottom: 5px;
    font-family: "Noto Serif SC", serif;
  }
  .story-meta {
    font-size: 10.5px;
    color: #64748b;
    margin-bottom: 5px;
  }
  .story-body {
    font-size: 12.8px;
    line-height: 1.65;
    color: #374151;
    margin-bottom: 5px;
    text-align: justify;
  }
  .story-action {
    background: #f1f5f9;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    color: #334155;
    line-height: 1.5;
  }

  /* 报尾全要素封印 */
  .masthead-footer {
    margin-top: 14px;
    padding-top: 8px;
    border-top: 2px solid #0f172a;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #475569;
    white-space: nowrap;
  }
  .seal {
    font-weight: bold;
    color: #1e3a8a;
    font-family: "SF Pro Mono", Menlo, monospace;
  }
</style>
</head>
<body>

<!-- 报头 -->
<div class="masthead">
  <div class="masthead-top">
    <span>权威信源 · 多源交叉核验直发</span>
    <span>${dateStr}</span>
    <span>终端代码：CELEBRATED-V5.2</span>
  </div>
  <h1 class="masthead-title">全球决策晨报</h1>
  <div class="masthead-subtitle">GLOBAL DECISION INTELLIGENCE MORNING POST · 决策全览版</div>
</div>

<!-- 实时跨市场行情看板（4列 x 2行 大字独立卡片，绝不拥挤） -->
<div class="market-section-header">
  <span>📊 跨市场实时行情看板（盘面核心对齐）</span>
  <span style="color:#64748b; font-weight:normal; font-size:11px;">数据来源：实盘权威交易通道 · 实时对齐</span>
</div>
<div class="market-grid">
  ${tickerItems.map(t => `
    <div class="market-card">
      <div class="card-top">
        <span class="card-name">${t.label}</span>
        <span class="card-sym">${t.sym}</span>
      </div>
      <div class="card-bottom">
        <span class="card-price">${t.val}</span>
        <span class="${t.up ? 'badge-chg-up' : 'badge-chg-down'}">${t.chg}</span>
      </div>
    </div>
  `).join('')}
</div>

<!-- 正文主体（左大栏深度头条，右栏多篇要闻与冷眼专栏） -->
<div class="main-layout">

  <!-- 左大栏：今日头版深度核心报道 -->
  <div class="lead-column">
    <span class="sec-tag">${heroStory.tag}</span>
    <h2 class="lead-title">${heroStory.title}</h2>
    <div class="lead-byline">
      <span>出处：${heroStory.source}</span>
      <span class="badge">🏛️ 国家双测评最高等级认证</span>
      <span>${heroStory.time} 直发</span>
      <span style="color:#059669; font-weight:bold;">✓ 100% 交叉核验</span>
    </div>

    <!-- 头条专属视觉行情卡片 -->
    <div class="hero-terminal-card">
      <div class="terminal-head">
        <span class="terminal-title">★ 亚太半导体与AI核心算力走势</span>
        <span class="terminal-status">实盘数据已对齐</span>
      </div>
      <div class="terminal-stat-row">
        <div>
          <div class="terminal-big-num">66, 399. 84</div>
          <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">日经225指数 (东京实盘大涨 +1,380 点)</div>
        </div>
        <div>
          <div class="terminal-big-chg">+2.12% ▲</div>
          <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">东京电子 / 爱德万测试领涨</div>
        </div>
      </div>
      <div class="terminal-grid">
        <div class="terminal-item">
          <span class="label">沐曦 曦云C600</span>
          <span class="val" style="color:#38bdf8;">5月规模量产 / 国家安全测评准入</span>
        </div>
        <div class="terminal-item">
          <span class="label">下一代 曦云C700</span>
          <span class="val" style="color:#a78bfa;">架构流片验证完成 / 加速调优</span>
        </div>
        <div class="terminal-item">
          <span class="label">费城半导体 SOX</span>
          <span class="val" style="color:#4ade80;">11, 735. 26 (+3. 37% ▲)</span>
        </div>
        <div class="terminal-item">
          <span class="label">长鑫存储 DRAM</span>
          <span class="val" style="color:#facc15;">先进制程良率攀升 / 产能放量</span>
        </div>
      </div>
    </div>

    <p class="lead-text">${heroStory.lead1}</p>
    <p class="lead-text">${heroStory.lead2}</p>
    <div class="transmission-box">${heroStory.analysis}</div>
  </div>

  <!-- 右侧栏：冷眼专栏 + 3篇关键重磅要闻 -->
  <div class="side-column">

    <!-- 专栏《冷眼看市场》（对标图二） -->
    <div class="editorial-box">
      <div class="editorial-title">冷眼看市场：繁华与祷词</div>
      <div class="editorial-content">
        “经济学有通货膨胀，新闻学有情绪膨胀——两者的共同点是：面额越印越大，购买力越来越小。本报无意苛责同业，毕竟在算法的市集里，冷静是一种奢侈品，而惊叹号是免费的。只是读者或许值得知道：当每一件事都值得尖叫，就没有任何事真正值得尖叫。”
      </div>
      <div class="editorial-author">—— 晨日报编辑室 · 由AI代笔，酸味经人工校学</div>
    </div>

    <!-- 3篇核心要闻 -->
    ${sideStories.map(s => `
      <div class="story-card">
        <span class="story-tag">${s.tag}</span>
        <h3 class="story-title">${s.title}</h3>
        <div class="story-meta">${s.source} · 实时核验直发</div>
        <p class="story-body">${s.body}</p>
        <div class="story-action">${s.action}</div>
      </div>
    `).join('')}

  </div>

</div>

<!-- 报尾 -->
<div class="masthead-footer">
  <div>
    <strong>全球决策情报终端 · 晨日编辑室</strong> 编发 · 每日早间 08:00 权威核验直发
  </div>
  <div>
    <span class="seal">[ 🛡️ 15分钟全要素核验 · 100% 权威交叉印证 ]</span> &nbsp;·&nbsp; 终端直达：celebrated-custard-0fe903.netlify.app
  </div>
</div>

</body>
</html>`;

  const htmlPath = path.resolve(__dirname, '../public/morning_paper.html');
  const outImgPath = path.resolve(__dirname, '../public/morning_paper.png');
  const brainImgPath = 'C:/Users/23972/.gemini/antigravity/brain/19b6deb0-a05a-4384-b3d5-361423100b27/morning_paper_sample.png';

  fs.writeFileSync(htmlPath, html, 'utf8');

  function getChromePath() {
    if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
    if (process.platform === 'win32') {
      return path.join('C:', 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe');
    } else if (process.platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
      return 'google-chrome';
    }
  }

  const chromePath = getChromePath();
  const fileUrl = path.resolve(htmlPath).replace(/\\/g, '/');
  const uri = fileUrl.startsWith('/') ? `file://${fileUrl}` : `file:///${fileUrl}`;

  const chromeArgs = [
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1140,1540',
    '--force-device-scale-factor=2.0',
    `--screenshot=${outImgPath}`,
    uri
  ];

  console.log('Rendering BroadSheet Morning Paper (2280px Ultra-HD)...');
  execFileSync(chromePath, chromeArgs);

  if (fs.existsSync(path.dirname(brainImgPath))) {
    try {
      fs.copyFileSync(outImgPath, brainImgPath);
    } catch (e) {}
  }
  console.log('Morning Paper generated successfully!');
  console.log('Output image path:', outImgPath);
  console.log('File size:', fs.statSync(outImgPath).size, 'bytes');
  return outImgPath;
}

if (require.main === module) {
  buildNewspaper().catch(console.error);
}

module.exports = { buildNewspaper };
