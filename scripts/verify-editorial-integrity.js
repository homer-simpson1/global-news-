/**
 * 全球决策情报终端 · 深度采编与工程防范红线校验门禁 (Editorial & Architectural Integrity Linter)
 *
 * 作为构建与提交前置硬门禁 (Pre-build Gate)，一旦触碰任何一条红线立即抛出错误打断构建 (exit 1)。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = [];

function check(title, fn) {
  try {
    fn();
  } catch (err) {
    errors.push(`[${title}] ${err.message}`);
  }
}

console.log('================================================================');
console.log('     🛡️ 全球决策情报终端 · 深度采编真实性与架构红线硬门禁审校');
console.log('================================================================');

// -------------------------------------------------------------
// 门禁 1: 静态新闻种子库 (data/seedNews.ts) 事实与要素闭环检验
// -------------------------------------------------------------
check('Gate 1: 新闻种子数据事实准确性与 5W1H 闭环审校', () => {
  const seedPath = path.join(ROOT, 'data', 'seedNews.ts');
  if (!fs.existsSync(seedPath)) {
    throw new Error('找不到 data/seedNews.ts 文件');
  }
  const content = fs.readFileSync(seedPath, 'utf8');

  // 1.1 绝对禁止虚构军事地缘概念（如霍尔木兹多国联军）
  if (/霍尔木兹.*多国联军|波斯湾.*多国联军/.test(content)) {
    throw new Error('检测到严重事实硬伤：霍尔木兹海峡/波斯湾不存在所谓“多国联军”，应准确指称为“美英海事联盟（IMSC）与欧洲护航编队（EMASOH）”');
  }

  // 1.2 分条细致审校：逐条核查 5W1H 闭环与概念隔离
  const items = content.split(/{\s*id:\s*['"][^'"]+['"]/);
  const disasterHypeRegex = /泥石流|滑坡|山洪|地质灾害|坍塌|遇难|人员伤亡/;
  const badTransmissionRegex = /智造企业.*回暖|实物货流回暖|低风险理财|代工厂|买显卡/;

  items.slice(1).forEach((item, idx) => {
    const titleMatch = item.match(/title:\s*['"]([^'"]+)['"]/);
    const whoMatch = item.match(/who:\s*['"]([^'"]+)['"]/);
    const whereMatch = item.match(/where:\s*['"]([^'"]+)['"]/);
    const title = titleMatch ? titleMatch[1] : `条目 #${idx}`;
    const who = whoMatch ? whoMatch[1] : '';
    const where = whereMatch ? whereMatch[1] : '';

    // 灾害事故与商业赚钱串味
    if (disasterHypeRegex.test(item) && badTransmissionRegex.test(item)) {
      errors.push(`新闻《${title}》存在灾害事故与商业赚钱概念串味（将制造回暖/买显卡套给灾害险情）`);
    }

    // 标题提及“多国/联盟”，5W1H 的 who 必须具备具体国别或行动代号
    if (/多国|联盟|联合护航/.test(title)) {
      if (!/美|英|法|德|意|荷|丹|日|韩|沙特|巴林|阿联酋|阿根廷|巴西|智利|IMSC|EMASOH|AGENOR|CMF|北约|欧盟/.test(who)) {
        errors.push(`新闻《${title}》标题提及“多国/联盟”，但 5W1H 的 who 未明确列出具体参与国或官方行动机构（当前为: ${who}）`);
      }
    }

    // 非西藏事件严禁出现“喜马拉雅”、“樟木口岸”
    if (!/吉隆|西藏|中尼|日喀则|定日/.test(title) && /喜马拉雅|樟木口岸/.test(where)) {
      errors.push(`新闻《${title}》非西藏事件，但 where 错误填入“喜马拉雅/樟木口岸”`);
    }
  });
});

// -------------------------------------------------------------
// 门禁 2: 金融行情资产专属容差审校 (lib/quotesVerifier.ts)
// -------------------------------------------------------------
check('Gate 2: 全球金融行情大类专属容差与基差仲裁审校', () => {
  const verifierPath = path.join(ROOT, 'lib', 'quotesVerifier.ts');
  if (!fs.existsSync(verifierPath)) {
    throw new Error('找不到 lib/quotesVerifier.ts 文件');
  }
  const content = fs.readFileSync(verifierPath, 'utf8');

  // 必须具备针对 US10Y 债券收益率的基点容差
  if (!content.includes("spec.key === 'US10Y'") || !content.includes('0.08')) {
    throw new Error('美债10年期收益率 (US10Y) 缺少基点点差专属容差（必须允许绝对点差 <= 0.08 即 8 bps）');
  }

  // 必须具备针对 N225 日经225 的期现基差合理容差
  if (!content.includes("spec.key === 'N225'") || !content.includes('0.85')) {
    throw new Error('日经225指数 (N225) 缺少跨市场期现基差 (Basis) 合理区间容差（必须允许 0.85% 以内的正常期现升贴水）');
  }

  // 必须具备针对 费城半导体 SOX 的东财直连代码 (251.SOX)
  if (!content.includes('251.SOX')) {
    throw new Error('费城半导体指数 (SOX) 缺少东方财富通道直连代码 (251.SOX)，可能导致单源退化并误报偏差超限');
  }

  // 必须具备单源降级基准容差（不得用 0.25% 错杀日内正常波动）
  if (!content.includes('isSingleSourceFallback') || !content.includes('5.0')) {
    throw new Error('缺少单源降级容差保护：当全网仅单源开盘时必须放宽至日内正常波动区间(5.0%)，避免将正常涨幅误报为偏差超限');
  }
});

// -------------------------------------------------------------
// 门禁 3: UI 视口层叠正序与防腰斩架构审校 (app/page.tsx)
// -------------------------------------------------------------
check('Gate 3: UI 顶栏与股市栏物理正序审校（杜绝滚动腰斩与堆叠冲突）', () => {
  const pagePath = path.join(ROOT, 'app', 'page.tsx');
  if (!fs.existsSync(pagePath)) {
    throw new Error('找不到 app/page.tsx 文件');
  }
  const content = fs.readFileSync(pagePath, 'utf8');

  const headerIdx = content.indexOf('<Header');
  const tickerIdx = content.indexOf('<MarketTicker');

  if (headerIdx === -1 || tickerIdx === -1) {
    throw new Error('页面缺少 Header 或 MarketTicker 组件');
  }

  // 顶栏 Header 必须排在股市行情栏 MarketTicker 之前
  if (headerIdx > tickerIdx) {
    throw new Error('严重 UI 层级隐患：MarketTicker 被排在 Header 上方。下滑滚动时 Header 会自下而上穿过吸顶的 MarketTicker 导致文字腰斩！必须保持 Header 在前、MarketTicker 在后的物理正序！');
  }

  // MarketTicker 必须具备 sticky top-0
  if (!content.includes('sticky top-0') || !content.includes('z-40')) {
    throw new Error('MarketTicker 必须具备 sticky top-0 z-40，确保下滑时稳定常驻视口顶端');
  }
});

// -------------------------------------------------------------
// 门禁 4: 全域自愈引擎防线完备性审校 (lib/selfHealingEngine.ts)
// -------------------------------------------------------------
check('Gate 4: 全域自愈引擎实体与术语防护门禁审校', () => {
  const enginePath = path.join(ROOT, 'lib', 'selfHealingEngine.ts');
  if (!fs.existsSync(enginePath)) {
    throw new Error('找不到 lib/selfHealingEngine.ts 文件');
  }
  const content = fs.readFileSync(enginePath, 'utf8');

  // 必须包含对霍尔木兹海峡多国联军的动态自动转轨纠偏规则
  if (!content.includes('霍尔木兹') || !content.includes('美英海事联盟与欧洲护航编队')) {
    throw new Error('selfHealingEngine.ts 缺少对霍尔木兹海峡伪概念的动态转轨自愈规则');
  }
});

// -------------------------------------------------------------
// 门禁 5: 深度透视严禁负面词库审校 (Negative Buzzwords Gate)
// -------------------------------------------------------------
check('Gate 5: 深度透视严禁负面词库审校（杜绝自媒体口水套话与泛化代词）', () => {
  const seedPath = path.join(ROOT, 'data', 'seedNews.ts');
  const content = fs.readFileSync(seedPath, 'utf8');

  const bannedKeywords = [
    '站岗', '躺赢', '躺着数钱', '割韭菜', '无情砸盘',
    '吃大波红利', '惨遭爆仓', '连根拔起', '风声鹤唳', '干翻人类',
    '彻底沦为军火商', '某巨头', '三家新贵', '某高官', '有关部门',
    '业内人士', '失势老股', '大发横财', '高位接盘'
  ];

  const lines = content.split('\n');
  bannedKeywords.forEach((word) => {
    lines.forEach((l, idx) => {
      if (l.includes(word)) {
        errors.push(`第 ${idx + 1} 行包含 "${word}": ${l.trim()}`);
      }
    });
  });

  // 严禁二极管句式
  lines.forEach((l, idx) => {
    if (/谁能.*?谁才能真正|表面上看是.*?实际上是|谁也不想在高位/.test(l)) {
      errors.push(`第 ${idx + 1} 行包含二极管句式: ${l.trim()}`);
    }
  });
});

// -------------------------------------------------------------
// 汇总输出与退出码控制
// -------------------------------------------------------------
if (errors.length > 0) {
  console.error('\n❌ 门禁审校未通过！共发现 ' + errors.length + ' 处违规:');
  errors.forEach((e, i) => console.error('  ' + (i + 1) + '. ' + e));
  console.error('\n[熔断触发] 请立即修正上述违规项后再行提交或构建！\n');
  process.exit(1);
} else {
  console.log('\n✅ 恭喜！所有深度采编规范与工程架构红线审校 100% 通过！');
  console.log('   - 0 处地缘防务概念捏造/张冠李戴');
  console.log('   - 0 处标题与 5W1H 要素脱节');
  console.log('   - 0 处资产大类容差误判隐患');
  console.log('   - 0 处 UI 层叠穿透腰斩隐患');
  console.log('   - 0 处深度透视口水话与自媒体二极管套话');
  console.log('================================================================\n');
  process.exit(0);
}
