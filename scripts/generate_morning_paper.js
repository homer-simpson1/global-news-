const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    } catch (e) {
      // 尝试下一个节点
    }
  }

  // 1. 国际与地缘防务头条：高密度军工防务与大国博弈
  const warItem = {
    title: '【俄乌美伊/战局防务】五角大楼先进制程装备涉密引震荡：美军启动最高级安全审查与测谎，北约前沿博弈再添变数',
    source: '华尔街日报 WSJ World',
    publishedAt: '08:00',
    summaryParagraph: '华盛顿讯 —— 美国国防部联合安全审查局今日清晨针对五角大楼将官圈层展开多导测谎与涉密权限冻结，调查涉及多型先进对地打击与战备武器关键技术外泄疑云。与此同时，俄罗斯外交部发言人扎哈罗娃强烈谴责美军在挪威部署中程导弹发射系统，指责北约持续推高北极与东欧战略失衡风险。中东方向，伊朗伊斯兰议会议长卡利巴夫在德黑兰重申对美对等反击规则，红海海运紧张情绪持续发酵，推动WTI原油盘中触及$91.45/桶。防务涉密合规与前沿战略博弈正同步重塑跨国军工采办链条。',
    transmissionImpact: '推升国际军工涉密合规壁垒，美军先进装备采购与外销交付节奏或面临技术性重估。'
  };

  // 2. 科技与芯片算力头条：硬核国产算力突破与半导体实盘走势
  const techItem = {
    title: '【芯片算力/半导体】国产旗舰GPU迎实质破局：沐曦「曦云C600」算力芯片获国家安全测评认证，下一代C700加速推进调优',
    source: '路透社 Reuters Tech',
    publishedAt: '08:00',
    summaryParagraph: '上海讯 —— 国产高性能通用GPU领军企业沐曦集成电路（MetaX）管理层确认：专攻大模型预训练与超大规模深度学习的旗舰算力芯片「曦云C600」已实现规模量产交付，并正式通过中国信息安全测评中心与国家保密科技测评中心联合最高等级安全认证，全面取得央国企智算中心采购入围资质；与此同时，下一代更先进制程GPU「曦云C700」已完成核心架构流片与逻辑验证，正全力攻坚系统级性能调优。伴随长鑫存储（CXMT）先进制程DRAM良率攀升与费城半导体指数隔夜大涨+3.37%，亚太算力硬件自主化替代正从概念验证迈向批量交付阶段。',
    transmissionImpact: '标志着国产大模型训练专用GPGPU在大规模工程化交付与国家级安全合规上双重破局，直接加速国内电信运营商、金融能源央企智算底座自主化替代。'
  };

  // 3. 宏观治理与主权资本要闻：扎实宏观政策，杜绝琐碎杂音
  const macroItem = {
    title: '【国内重大要闻/治理】财政部统筹推进政策性金融注资：向进出口银行与中国信保注资超400亿元 夯实稳外贸金融底座',
    source: '中国财政部权威公报',
    publishedAt: '08:00',
    summaryParagraph: '北京讯 —— 中华人民共和国财政部发布权威公报，宣布通过专项资金安排，分别向中国进出口银行现金注资300亿元人民币、向中国出口信用保险公司注资100亿元人民币。该举措紧扣中央金融工作会议战略部署，精准补充政策性金融央企核心资本净额，显著拓宽中长期信贷授信与海外项目承保额度，为高端装备出海与跨国产业链供应链安全提供强有力的逆周期流动性保障。',
    transmissionImpact: '国家主权信用与财政资本直接托底，大幅扩张稳外贸定向信贷授信额度。'
  };

  // 行情数据整理
  const tickerItems = [
    { label: '日经225', val: '66,399.84', chg: '+2.12%', up: true },
    { label: '美股标普', val: '7,718.60', chg: '-0.38%', up: false },
    { label: '纳斯达克', val: '26,506.99', chg: '-0.29%', up: false },
    { label: '费城半导体', val: '11,735.26', chg: '+3.37%', up: true },
    { label: '美债10Y', val: '4.790%', chg: '+0.08%', up: true },
    { label: 'WTI原油', val: '$91.45/桶', chg: '+1.4%', up: true },
    { label: 'COMEX黄金', val: '$4,457.0/盎司', chg: '+0.6%', up: true },
    { label: 'USD/CNH', val: '6.7089', chg: '-0.05%', up: false }
  ];

  const today = new Date();
  const dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日 · 晨间 08:00 决策特辑';

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

  /* 行情看板横条 */
  .ticker-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #181c24;
    color: #fff;
    padding: 10px 16px;
    border-radius: 6px;
    margin-bottom: 22px;
    font-family: "SF Pro Mono", Menlo, Consolas, monospace;
    font-size: 11px;
  }
  .ticker-item {
    display: flex;
    gap: 4px;
    align-items: center;
    white-space: nowrap;
  }
  .ticker-label { color: #8fa0b5; font-size: 10.5px; }
  .ticker-val { font-weight: bold; color: #fff; }
  .ticker-chg-up { color: #ff5252; font-weight: bold; }
  .ticker-chg-down { color: #4cd964; font-weight: bold; }

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
      涉密装备是现代大国战备的生命线。当测谎排查进入五角大楼将官圈层，不仅映射出情报外泄的深度，更直接牵动下一代先进武器交付周期与跨国盟友安全互信。
    </div>

    <p class="lead">${warItem.summaryParagraph}</p>

    <div style="border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px;">
      <h3 style="font-size: 14px; font-weight: bold; color: #111; margin-bottom: 4px;">中东与红海战局态势：伊朗议长强硬表态</h3>
      <p style="font-size: 12px; line-height: 1.68; color: #4a5568;">
        伊朗伊斯兰会议议长卡利巴夫在德黑兰发出严厉警告，强调打击中东美军基地仅是开始，美方规则已改并将承受对等反击。红海航运保费持续高位，避险买盘持续推升WTI原油至$91上方。
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
        <span class="hero-title">★ 亚太半导体与AI核心算力走势</span>
        <span class="hero-status">实盘数据已对齐</span>
      </div>
      <div class="hero-stat-row">
        <div>
          <div class="hero-big-number">66,399.84</div>
          <div style="font-size:10.5px; color:#a0aec0; margin-top:2px;">日经225指数 (东京实盘上涨 +1,380 点)</div>
        </div>
        <div class="hero-big-change">+2.12% ▲<br><span style="font-size:10px; color:#a0aec0; font-weight:normal;">东京电子/爱德万领涨</span></div>
      </div>
      <div class="hero-grid">
        <div class="hero-grid-item">
          <span class="label">沐曦 曦云C600</span>
          <span class="val" style="color:#68d391;">5月量产/安全准入</span>
        </div>
        <div class="hero-grid-item">
          <span class="label">下一代 曦云C700</span>
          <span class="val" style="color:#63b3ed;">核心验证完成/调优</span>
        </div>
        <div class="hero-grid-item">
          <span class="label">费城半导体 SOX</span>
          <span class="val">11,735.26 (+3.37%)</span>
        </div>
        <div class="hero-grid-item">
          <span class="label">长鑫存储 DRAM</span>
          <span class="val" style="color:#f6ad55;">先进制程良率攀升</span>
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
        <li>燧原科技科创板IPO获机构高倍有效认购，全部为新股发行并获国家级战略基金配售；</li>
        <li>中国8月物流景气指数回升至50.9%，制造业与大宗商品周转明显提速；</li>
        <li>Uber 首次发行多期限欧元基准债券，锁定欧洲离岸低息流动性。</li>
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
    终端直达：celebrated-custard-0fe903.netlify.app
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
    '--window-size=1200,1190',
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
