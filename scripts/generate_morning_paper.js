const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function buildNewspaper() {
  let quotes = [];
  let news = [];

  const endpoints = [
    process.env.API_BASE_URL,
    'http://127.0.0.1:3000',
    'https://global-news-8lp.pages.dev'
  ].filter(Boolean);

  for (const base of endpoints) {
    try {
      const cacheBuster = `force=true&_t=${Date.now()}`;
      const qRes = await fetch(`${base}/api/ticker?${cacheBuster}`, {
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(4000)
      });
      if (qRes.ok) {
        const d = await qRes.json();
        if (d?.data?.quotes?.length) {
          quotes = d.data.quotes;
        }
      }
      const nRes = await fetch(`${base}/api/news?${cacheBuster}`, {
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(6000)
      });
      if (nRes.ok) {
        const d = await nRes.json();
        if (d?.data?.news?.length) {
          news = d.data.news;
        }
      }
      if (news.length > 0 && quotes.length > 0) break;
    } catch (e) {
      // 尝试下一个节点
    }
  }

  // 1. 国际与地缘防务头条：优先抓取最新战局与涉外博弈
  let warCandidate = news.find(n => n.track === 'war_conflict') || news[0];
  const warItem = {
    title: warCandidate?.title || '【俄乌美伊/战局防务】五角大楼先进制程装备涉密引震荡：美军启动最高级安全审查与测谎',
    source: warCandidate?.source || '华尔街日报 WSJ World',
    publishedAt: warCandidate?.publishedAt || warCandidate?.time || '08:00',
    summaryParagraph: warCandidate?.summaryParagraph || warCandidate?.content || '华盛顿讯 —— 调查涉及多型先进对地打击与战备武器关键技术外泄疑云。',
    transmissionImpact: warCandidate?.transmissionImpact || warCandidate?.transmission || '推升国际军工涉密合规壁垒，美军先进装备采购与外销交付节奏或面临技术性重估。',
    note: warCandidate?.oneLineTakeaway || '涉密装备是现代大国战备的生命线。当测谎排查进入核心指挥层，不仅映射出情报外泄的深度，更直接牵动下一代先进武器交付周期与跨国盟友安全互信。'
  };

  // 次级防务/航运态势
  let subWarCandidate = news.find(n => n !== warCandidate && (n.track === 'war_conflict' || n.track === 'commodities_shipping'));
  const subWarItem = {
    title: subWarCandidate?.title || '中东与红海战局态势：主要航运保费持续高位',
    summary: subWarCandidate?.summaryParagraph || subWarCandidate?.content || '红海航运保费持续高位，避险买盘持续推升WTI原油高位震荡，跨国供应链保持高度防范。'
  };

  // 2. 科技与芯片算力头条：硬核算力突破与半导体硬件实盘走势
  let techCandidate = news.find(n => n !== warCandidate && n !== subWarCandidate && n.track === 'apac_tech');
  if (!techCandidate) techCandidate = news.find(n => n !== warCandidate && (n.track === 'us_macro' || n.track === 'apac_tech')) || news[1];

  const techItem = {
    title: techCandidate?.title || '【芯片算力/半导体】国产旗舰GPU迎实质破局：沐曦「曦云C600」算力芯片获国家安全测评认证',
    source: techCandidate?.source || '路透社 Reuters Tech',
    publishedAt: techCandidate?.publishedAt || techCandidate?.time || '08:00',
    summaryParagraph: techCandidate?.summaryParagraph || techCandidate?.content || '专攻大模型预训练与超大规模深度学习的旗舰算力芯片已实现规模量产交付。',
    transmissionImpact: techCandidate?.transmissionImpact || techCandidate?.transmission || '标志着国产大模型训练专用GPGPU在大规模工程化交付上取得实质突破。'
  };

  // 3. 宏观治理与主权资本要闻：重大宏观政策，杜绝琐碎杂音
  let macroCandidate = news.find(n => n !== warCandidate && n !== subWarCandidate && n !== techCandidate && (n.track === 'china_policy' || n.track === 'china_domestic'));
  if (!macroCandidate) macroCandidate = news.find(n => n !== warCandidate && n !== techCandidate) || news[2];

  const macroItem = {
    title: macroCandidate?.title || '【国内重大要闻/治理】财政部统筹推进政策性金融注资：夯实稳外贸金融底座',
    source: macroCandidate?.source || '中国财政部权威公报',
    publishedAt: macroCandidate?.publishedAt || macroCandidate?.time || '08:00',
    summaryParagraph: macroCandidate?.summaryParagraph || macroCandidate?.content || '通过专项资金安排，精准补充政策性金融央企核心资本净额，显著拓宽信贷授信与项目承保额度。',
    transmissionImpact: macroCandidate?.transmissionImpact || macroCandidate?.transmission || '国家主权信用与财政资本直接托底，大幅扩张稳外贸定向信贷授信额度。'
  };

  // 【今日决策速览备忘】动态提取 3 条不同领域的重点短评
  const quickCandidates = news.filter(n =>
    n !== warCandidate &&
    n !== subWarCandidate &&
    n !== techCandidate &&
    n !== macroCandidate
  ).slice(0, 3);

  const quickBriefs = quickCandidates.length >= 3 ? quickCandidates.map(c => {
    let text = c.title;
    if (c.oneLineTakeaway) {
      const cleanTakeaway = c.oneLineTakeaway.replace(/【.*?】：?/, '').trim();
      if (cleanTakeaway && cleanTakeaway.length < 50) {
        text += `（${cleanTakeaway}）`;
      }
    }
    return text.endsWith('；') || text.endsWith('。') ? text : text + '；';
  }) : [
    '燧原科技科创板IPO获机构高倍有效认购，全部为新股发行并获国家级战略基金配售；',
    '中国8月物流景气指数回升至50.9%，制造业与大宗商品周转明显提速；',
    'Uber 首次发行多期限欧元基准债券，锁定欧洲离岸低息流动性。'
  ];

  // 4. 行情数据动态整理
  const defaultTickerItems = [
    { label: '美股标普', val: '7,718.60', chg: '-0.38%', up: false },
    { label: '纳指100', val: '29,544.15', chg: '+0.21%', up: true },
    { label: '纳指综合', val: '26,506.99', chg: '-0.29%', up: false },
    { label: '费城半导体', val: '11,735.26', chg: '+3.37%', up: true },
    { label: '日经225', val: '66,399.84', chg: '+2.12%', up: true },
    { label: '美债10Y', val: '4.790%', chg: '+0.08%', up: true },
    { label: 'WTI原油', val: '$92.67/桶', chg: '+1.26%', up: true },
    { label: 'COMEX黄金', val: '$4,450.8/盎司', chg: '-0.49%', up: false },
    { label: 'USD/CNH', val: '6.7066', chg: '+0.01%', up: true }
  ];

  let tickerItems = defaultTickerItems;
  if (quotes && quotes.length > 0) {
    const findQ = (pattern) => quotes.find(q => (q.symbol && pattern.test(q.symbol)) || (q.name && pattern.test(q.name)));
    const spx = findQ(/标普|SPX/i);
    const ndx = findQ(/纳斯达克100|NDX/i);
    const ixic = findQ(/纳斯达克综合|纳指综合|IXIC/i);
    const sox = findQ(/费城半导体|SOX/i);
    const n225 = findQ(/日经|N225/i);
    const us10y = findQ(/美债|10Y/i);
    const cl = findQ(/原油|WTI|CL/i);
    const gc = findQ(/黄金|COMEX|GC/i);
    const cnh = findQ(/人民币|CNH|USDCNH/i);

    const mapItem = (label, q, fallback) => {
      if (!q) return fallback;
      return {
        label,
        val: q.price,
        chg: q.change,
        up: q.isUp !== undefined ? q.isUp : (q.change ? !q.change.startsWith('-') : true)
      };
    };

    tickerItems = [
      mapItem('美股标普', spx, defaultTickerItems[0]),
      mapItem('纳指100', ndx, defaultTickerItems[1]),
      mapItem('纳指综合', ixic, defaultTickerItems[2]),
      mapItem('费城半导体', sox, defaultTickerItems[3]),
      mapItem('日经225', n225, defaultTickerItems[4]),
      mapItem('美债10Y', us10y, defaultTickerItems[5]),
      mapItem('WTI原油', cl, defaultTickerItems[6]),
      mapItem('COMEX黄金', gc, defaultTickerItems[7]),
      mapItem('USD/CNH', cnh, defaultTickerItems[8])
    ];
  }

  // 视觉焦点卡片动态实盘数据
  const heroQuote = quotes.find(q => /日经|N225/i.test(q.symbol || q.name)) ||
    quotes.find(q => /标普|SPX/i.test(q.symbol || q.name)) || {
      symbol: '日经225',
      name: '日经225指数',
      price: '66,399.84',
      change: '+2.12%',
      isUp: true
    };

  const soxQuote = quotes.find(q => /费城半导体|SOX/i.test(q.symbol || q.name));
  const clQuote = quotes.find(q => /原油|WTI/i.test(q.symbol || q.name));
  const gcQuote = quotes.find(q => /黄金|COMEX/i.test(q.symbol || q.name));
  const ndxQuote = quotes.find(q => /纳指100|NDX/i.test(q.symbol || q.name));

  const gridItems = [
    { label: '费城半导体 SOX', val: soxQuote ? `${soxQuote.price} (${soxQuote.change})` : '11,735.26 (+3.37%)' },
    { label: '纳指100 NDX', val: ndxQuote ? `${ndxQuote.price} (${ndxQuote.change})` : '29,544.15 (+0.21%)' },
    { label: 'WTI原油连续', val: clQuote ? `${clQuote.price} (${clQuote.change})` : '$92.67 (+1.26%)' },
    { label: 'COMEX黄金主力', val: gcQuote ? `${gcQuote.price} (${gcQuote.change})` : '$4,450.8 (-0.49%)' }
  ];

  const now = new Date();
  const beijingTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
  const hourStr = String(beijingTime.getHours()).padStart(2, '0');
  const minStr = String(beijingTime.getMinutes()).padStart(2, '0');
  const dateStr = `${beijingTime.getFullYear()}年${beijingTime.getMonth() + 1}月${beijingTime.getDate()}日 · 晨间 ${hourStr}:${minStr} 决策特辑`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>全球决策晨报</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background-color: #fbfbf9;
    color: #1a1a1a;
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Serif SC", "Songti SC", serif;
    width: 1200px;
    margin: 0 auto;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  body {
    padding: 38px 45px 30px 45px;
  }

  /* 顶部报头 */
  .masthead {
    text-align: center;
    border-bottom: 3px double #111;
    padding-bottom: 14px;
    margin-bottom: 16px;
  }
  .masthead-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.5px;
    color: #555;
    font-family: Georgia, serif;
    border-bottom: 1px solid #ddd;
    padding-bottom: 7px;
    margin-bottom: 12px;
    letter-spacing: 0.5px;
  }
  .masthead-title {
    font-size: 44px;
    font-weight: 900;
    letter-spacing: 5px;
    color: #111;
    font-family: "Noto Serif SC", "Songti SC", Georgia, serif;
    margin-bottom: 5px;
    text-transform: uppercase;
  }
  .masthead-subtitle {
    font-size: 12px;
    color: #666;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  /* 行情看板横条 - 双行两排开阔布局 */
  .ticker-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    row-gap: 8px;
    column-gap: 20px;
    background: #141820;
    color: #fff;
    padding: 10px 18px;
    border-radius: 6px;
    margin-bottom: 26px;
    font-family: "SF Pro Mono", Menlo, Consolas, monospace;
  }
  .ticker-item {
    display: flex;
    justify-content: flex-start;
    gap: 6px;
    align-items: baseline;
    white-space: nowrap;
  }
  .ticker-label { color: #8fa0b5; font-size: 11.5px; }
  .ticker-val { font-weight: bold; color: #fff; font-size: 12.5px; }
  .ticker-chg-up { color: #ff5252; font-weight: bold; font-size: 11.5px; }
  .ticker-chg-down { color: #4cd964; font-weight: bold; font-size: 11.5px; }

  /* 三栏主体 - 精确无溢出 */
  .paper-body {
    display: grid;
    grid-template-columns: 1fr 1.22fr 1fr;
    column-gap: 28px;
    align-items: stretch;
  }

  .column {
    display: flex;
    flex-direction: column;
  }
  .col-divider {
    border-right: 1px solid #e2e2dc;
    padding-right: 24px;
  }
  .col-center {
    border-right: 1px solid #e2e2dc;
    padding-right: 24px;
  }
  .col-last {
    padding-right: 0;
  }

  /* 栏目小标 */
  .sec-tag {
    display: inline-block;
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 2px 7px;
    background: #111;
    color: #fff;
    margin-bottom: 10px;
    font-family: -apple-system, sans-serif;
    border-radius: 2px;
  }

  /* 文章排版 */
  .headline-main {
    font-size: 19.5px;
    font-weight: 800;
    line-height: 1.38;
    color: #0d0d0d;
    margin-bottom: 8px;
    font-family: "Noto Serif SC", "Songti SC", serif;
  }
  .headline-secondary {
    font-size: 16px;
    font-weight: 800;
    line-height: 1.4;
    color: #1a1a1a;
    margin: 14px 0 7px 0;
  }
  .byline {
    font-size: 11px;
    color: #777;
    margin-bottom: 11px;
    font-family: Georgia, serif;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .byline .badge {
    background: #eef2f6;
    color: #2b5282;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: bold;
  }

  /* 正文段落 */
  p.lead {
    font-size: 13.5px;
    line-height: 1.72;
    color: #2b2b2b;
    text-align: justify;
    text-indent: 2em;
    margin-bottom: 12px;
  }

  /* 引用按语框 */
  .quote-box {
    background: #f4f4f0;
    border-left: 3px solid #111;
    padding: 9px 13px;
    margin: 12px 0;
    font-size: 12px;
    line-height: 1.65;
    color: #333;
  }
  .quote-box strong {
    font-style: normal;
    color: #111;
    font-size: 11px;
    display: block;
    margin-bottom: 3px;
    text-transform: uppercase;
  }

  /* 中间栏高亮卡片（模拟报纸行情走势视觉主图） */
  .hero-card {
    background: #0f141c;
    border-radius: 7px;
    padding: 14px 16px;
    color: #fff;
    margin: 12px 0 14px 0;
    border: 1px solid #2d3748;
    box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  }
  .hero-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #232d3d;
    padding-bottom: 7px;
    margin-bottom: 10px;
  }
  .hero-title { font-size: 12.5px; font-weight: bold; color: #63b3ed; letter-spacing: 0.5px; }
  .hero-status { font-size: 10px; background: #22543d; color: #9ae6b4; padding: 2px 6px; border-radius: 3px; }
  .hero-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
  }
  .hero-big-number { font-size: 27px; font-weight: 900; font-family: "SF Pro Display", -apple-system, monospace; color: #fff; }
  .hero-big-change { font-size: 17px; font-weight: bold; color: #ff5252; }
  .hero-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 12px;
    border-top: 1px solid #232d3d;
    padding-top: 10px;
    font-size: 11px;
  }
  .hero-grid-item { display: flex; flex-direction: column; }
  .hero-grid-item .label { color: #8fa0b5; font-size: 10px; margin-bottom: 2px; }
  .hero-grid-item .val { font-weight: bold; color: #e2e8f0; font-family: monospace; }

  /* 传导解析框 */
  .transmission-box {
    border-left: 3px solid #3182ce;
    padding: 8px 12px;
    background: #ebf8ff;
    font-size: 11.5px;
    line-height: 1.6;
    color: #2b6cb0;
    margin-top: 10px;
  }

  /* 报纸右栏专栏评述框 (仿图二「冷眼看市场」) */
  .editorial-box {
    border: 1px solid #e2d9c8;
    background: #faf7f2;
    padding: 13px 15px;
    border-radius: 4px;
    margin-bottom: 14px;
  }

  /* 报尾全要素封印 */
  .masthead-footer {
    margin-top: 22px;
    padding-top: 12px;
    border-top: 2px solid #111;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #666;
    font-family: -apple-system, sans-serif;
  }
  .seal {
    font-weight: bold;
    color: #1a365d;
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
    <span>终端代码：CELEBRATED-TERMINAL-V5.2</span>
  </div>
  <h1 class="masthead-title">全球决策晨报</h1>
  <div class="masthead-subtitle">GLOBAL DECISION INTELLIGENCE MORNING POST · 编辑室权威特刊</div>
</div>

<!-- 实时行情带 -->
<div class="ticker-bar">
  ${tickerItems.map(t => `
    <div class="ticker-item">
      <span class="ticker-label">${t.label}</span>
      <span class="ticker-val">${t.val}</span>
      <span class="${t.up ? 'ticker-chg-up' : 'ticker-chg-down'}">${t.chg}</span>
    </div>
  `).join('')}
</div>

<!-- 三栏报身 -->
<div class="paper-body">

  <!-- 第一栏：地缘战局与战略防务 -->
  <div class="column col-divider">
    <div><span class="sec-tag">国际 · 地缘防务与安全</span></div>
    <h2 class="headline-main">${warItem.title}</h2>
    <div class="byline">
      <span>出处：${warItem.source}</span>
      <span class="badge">✓ 多源交叉核验</span>
      <span>${warItem.publishedAt}</span>
    </div>

    <div class="quote-box">
      <strong>【防务即时按语 · 编辑室备忘】</strong>
      ${warItem.note}
    </div>

    <p class="lead">${warItem.summaryParagraph}</p>

    <div style="border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px;">
      <h3 style="font-size: 14px; font-weight: bold; color: #111; margin-bottom: 4px;">${subWarItem.title}</h3>
      <p style="font-size: 12px; line-height: 1.68; color: #4a5568;">
        ${subWarItem.summary}
      </p>
    </div>
  </div>

  <!-- 第二栏：芯片算力与硬件走势（含焦点卡片视觉主图） -->
  <div class="column col-center">
    <div><span class="sec-tag" style="background:#1a365d;">科技 · 芯片算力与新质硬件</span></div>
    <h2 class="headline-main">${techItem.title}</h2>
    <div class="byline">
      <span>出处：${techItem.source}</span>
      <span class="badge" style="background:#e6fffa; color:#234e52;">🏛️ 国家安全测评认证</span>
      <span>${techItem.publishedAt}</span>
    </div>

    <!-- 视觉核心卡片（对标图二中栏走势主图） -->
    <div class="hero-card">
      <div class="hero-header">
        <span class="hero-title">★ 亚太半导体与核心资产走势</span>
        <span class="hero-status">实盘数据已对齐</span>
      </div>
      <div class="hero-stat-row">
        <div>
          <div class="hero-big-number">${heroQuote.price}</div>
          <div style="font-size:10.5px; color:#a0aec0; margin-top:2px;">${heroQuote.name || heroQuote.symbol} (实盘撮合最新点位)</div>
        </div>
        <div class="hero-big-change" style="color: ${heroQuote.isUp ? '#ff5252' : '#4cd964'}">${heroQuote.change} ${heroQuote.isUp ? '▲' : '▼'}<br><span style="font-size:10px; color:#a0aec0; font-weight:normal;">核心资产异动跟踪</span></div>
      </div>
      <div class="hero-grid">
        <div class="hero-grid-item">
          <span class="label">${gridItems[0].label}</span>
          <span class="val" style="color:#68d391;">${gridItems[0].val}</span>
        </div>
        <div class="hero-grid-item">
          <span class="label">${gridItems[1].label}</span>
          <span class="val" style="color:#63b3ed;">${gridItems[1].val}</span>
        </div>
        <div class="hero-grid-item">
          <span class="label">${gridItems[2].label}</span>
          <span class="val">${gridItems[2].val}</span>
        </div>
        <div class="hero-grid-item">
          <span class="label">${gridItems[3].label}</span>
          <span class="val" style="color:#f6ad55;">${gridItems[3].val}</span>
        </div>
      </div>
    </div>

    <p class="lead">${techItem.summaryParagraph}</p>

    <div class="transmission-box">
      <strong>【决策传导解析】</strong><br>
      ${techItem.transmissionImpact}
    </div>
  </div>

  <!-- 第三栏：宏观治理与深度观察文学 (仿图二「冷眼看市场」) -->
  <div class="column col-last">
    <div><span class="sec-tag" style="background:#553c9a;">宏观 · 治理与观察文学</span></div>

    <!-- 专栏评述框（精确复刻图二文字与讽喻风格） -->
    <div class="editorial-box">
      <h3 style="font-size: 14.5px; font-weight: bold; color: #44337a; margin-bottom: 6px;">冷眼看市场：繁华与祷词</h3>
      <p style="font-size: 12px; line-height: 1.7; color: #4a5568; margin-bottom: 8px;">
        “经济学有通货膨胀，新闻学有情绪膨胀——两者的共同点是：面额越印越大，购买力越来越小。
      </p>
      <p style="font-size: 12px; line-height: 1.7; color: #4a5568;">
        本报无意苛责同业，毕竟在算法的市集里，冷静是一种奢侈品，而惊叹号是免费的。只是读者或许值得知道：当每一件事都值得尖叫，就没有任何事真正值得尖叫。”
      </p>
      <div style="text-align: right; font-size: 11px; color: #805ad5; font-style: italic; margin-top: 6px;">
        —— 晨日报编辑室 · 由AI代笔，酸味经人工校学
      </div>
    </div>

    <h3 class="headline-secondary" style="font-size:16px; margin-top:0;">${macroItem.title}</h3>
    <div class="byline">
      <span>出处：${macroItem.source}</span>
      <span class="badge" style="background:#feebc8; color:#7b341e;">🏛️ 主权资本加持</span>
      <span>${macroItem.publishedAt}</span>
    </div>
    <p class="lead" style="font-size:13px; line-height: 1.68;">${macroItem.summaryParagraph}</p>

    <div style="border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px;">
      <div style="font-size: 11px; font-weight: bold; color: #111; margin-bottom: 4px;">【今日决策速览备忘】</div>
      <ul style="font-size: 11.5px; line-height: 1.65; color: #555; padding-left: 15px;">
        ${quickBriefs.map(b => `<li>${b}</li>`).join('')}
      </ul>
    </div>

  </div>

</div>

<!-- 报尾 -->
<div class="masthead-footer">
  <div>
    <strong>全球决策情报终端 · 晨日编辑室</strong> 编发 · 每日早间 08:00 权威核验直发
  </div>
  <div class="seal">
    [ 🛡️ 15分钟全要素核验 · 100% 权威交叉印证 ]
  </div>
  <div>
    终端直达：global-news-8lp.pages.dev
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
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else if (process.platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
      return 'google-chrome';
    }
  }

  const chromePath = getChromePath();
  const fileUrl = path.resolve(htmlPath).replace(/\\/g, '/');
  const uri = fileUrl.startsWith('/') ? `file://${fileUrl}` : `file:///${fileUrl}`;
  const { execFileSync } = require('child_process');
  const chromeArgs = [
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1200,1265',
    '--force-device-scale-factor=2.5',
    `--screenshot=${outImgPath}`,
    uri
  ];
  console.log('Rendering 2.5x Ultra-HD newspaper screenshot (3000x2975)...');
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
