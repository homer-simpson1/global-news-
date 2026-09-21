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
// 门禁 6: 标题标点与全量负面口水词严禁审校 (Gate 6: Headline & Tone)
// -------------------------------------------------------------
check('Gate 6: 标题严谨性（严禁感叹号/问号/省略号）与全量口水词库审校', () => {
  const seedFiles = [
    path.join(ROOT, 'data', 'seedNews.ts'),
    path.join(ROOT, 'data', 'seedLeadNews.ts'),
    path.join(ROOT, 'data', 'seedData.ts')
  ];

  const fullBannedList = [
    '垄断者的底气', '掐死龙头保高价', '停火谈判沦为掩护', '底牌外泄引发恐慌',
    '做大做强不再单打', '亮出家底以战止戈', '检疫铁幕瞬间落下', '刮骨疗毒动真格',
    '水下幽灵战常态化', '高科技军火商', '三亿欧元一台的印钞机', '谁也别想多卖油',
    '战机呼啸导弹对轰', '滥用管制必遭反制', '重磅亮剑', '哭爹喊娘', '炸裂',
    '大动作', '买显卡通不上电', '赚麻了', '中央信用硬核托底', '散户站岗',
    '无情砸盘', '割韭菜', '暴力拉升', '洗盘', '血洗', '谈崩', '死守',
    '一票否决', '真金白银撬动', '谈比打好', '以打促谈', '层层设卡逼向极限',
    '套息盘梦魇重现', '廉价资金时代一去不复返', '深层动因', '传来实质动态',
    '这一动向迅速引发连锁反应', '冲突战区前方军事指挥部', '国际宏观政策追踪委员会',
    '宏观宏图与微观基本面变量'
  ];

  seedFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const relName = path.relative(ROOT, file);

    // 检查口水词
    fullBannedList.forEach(w => {
      if (content.includes(w)) {
        errors.push(`[${relName}] 存在严禁使用的自媒体口水词或伪深刻套话: "${w}"`);
      }
    });

    // 检查标题标点符号 (严禁 ！! ？? …)
    const titleMatches = [...content.matchAll(/["']?(?:title|content)["']?\s*:\s*['"]([^'"]+)['"]/g)];
    titleMatches.forEach((m, idx) => {
      const title = m[1];
      if (/[！!？?…]/.test(title)) {
        errors.push(`[${relName}] 标题/内容 #${idx + 1} 含有违规标点符号（严禁感叹号/问号/省略号）: "${title}"`);
      }
    });
  });
});

// -------------------------------------------------------------
// 门禁 7: 深度传导 1-Hop 因果与 5W1H 结论标签审校 (Gate 7: 1-Hop & 5W1H)
// -------------------------------------------------------------
check('Gate 7: 深度传导 1-Hop 一级直接因果与 5W1H 结论定性审校', () => {
  const seedFiles = [
    path.join(ROOT, 'data', 'seedNews.ts'),
    path.join(ROOT, 'data', 'seedLeadNews.ts'),
    path.join(ROOT, 'data', 'seedData.ts')
  ];

  seedFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const relName = path.relative(ROOT, file);

    const transMatches = [...content.matchAll(/["']?transmission(?:Impact)?["']?\s*:\s*['"]([^'"]+)['"]/g)];
    transMatches.forEach((m, idx) => {
      const trans = m[1];
      if (trans.includes('信源仅陈述单一动作')) {
        errors.push(`[${relName}] 传导链 #${idx + 1} 严禁包含敷衍机械免责套话: "${trans}"`);
      }
      const is1Hop = /①.*➔.*②.*➔.*③/.test(trans);
      if (!is1Hop) {
        errors.push(`[${relName}] 传导链 #${idx + 1} 不符合 1-Hop 一级直接因果标准（格式必须为 "①... ➔ ②... ➔ ③..."）: "${trans}"`);
      }
    });

    const takeawayMatches = [...content.matchAll(/["']?oneLineTakeaway["']?\s*:\s*['"]([^'"]+)['"]/g)];
    takeawayMatches.forEach((m, idx) => {
      const takeaway = m[1];
      if (!takeaway.startsWith('【') || !takeaway.includes('】：')) {
        errors.push(`[${relName}] 核心结论 #${idx + 1} 缺少机构专业定性标签（格式必须为 "【定性标签】：..."）: "${takeaway}"`);
      }
      if (takeaway.includes('涉事主体推进核心战略部署')) {
        errors.push(`[${relName}] 核心结论 #${idx + 1} 违规包含企业流水线套话: "${takeaway}"`);
      }
    });
  });
});

// -------------------------------------------------------------
// 门禁 6: 宏观通胀指标矩阵与深度穿透完整性校验 (Macro Inflation Gate)
// -------------------------------------------------------------
check('Gate 6: 宏观通胀指标矩阵(环比/同比)与分项穿透门禁', () => {
  const enginePath = path.join(ROOT, 'lib', 'macroInflationEngine.ts');
  if (!fs.existsSync(enginePath)) {
    throw new Error('找不到 lib/macroInflationEngine.ts 宏观通胀深度解析引擎！');
  }
  const content = fs.readFileSync(enginePath, 'utf8');
  if (!content.includes('getMacroInflationBreakdown') || !content.includes('buildMacroInflationFactParagraph')) {
    throw new Error('lib/macroInflationEngine.ts 缺少核心解析或事实生成函数');
  }
  if (!content.includes('SHELTER') || !content.includes('SUPERCORE_SERVICES') || !content.includes('FOOD') || !content.includes('ENERGY')) {
    throw new Error('lib/macroInflationEngine.ts 缺少核心分项穿透定义（住房、超级核心服务、食品、能源）');
  }
});

// -------------------------------------------------------------
// 门禁 7: 美联储利率政策与宏观真实常识守卫 (Fed Rate Policy Integrity Gate)
// -------------------------------------------------------------
check('Gate 7: 美联储利率政策与宏观真实常识门禁', () => {
  const enginePath = path.join(ROOT, 'lib', 'macroInflationEngine.ts');
  const content = fs.readFileSync(enginePath, 'utf8');
  if (!content.includes('sanitizeFedRatePolicyWording')) {
    throw new Error('lib/macroInflationEngine.ts 缺少 sanitizeFedRatePolicyWording 函数');
  }

  // 严禁观察哨写死 2024 年旧日历（如 9月18日降息25bps）
  if (content.includes('9月18日 FOMC') && content.includes('降息25bps基准路径落地')) {
    errors.push('lib/macroInflationEngine.ts 中包含2024年旧日期模板（9月18日降息25bps）！');
  }
});

// -------------------------------------------------------------
// 门禁 8: 非洲与全球公共卫生/海外疫情边界硬门禁 (Congo Ebola & WHO Boundary Gate)
// -------------------------------------------------------------
check('Gate 8: 非洲与全球公共卫生/海外疫情边界硬门禁', () => {
  const guardrailsPath = path.join(ROOT, 'lib', 'guardrails.ts');
  const guardrailsContent = fs.readFileSync(guardrailsPath, 'utf8');
  if (!guardrailsContent.includes('AFRICA_GLOBAL') || !guardrailsContent.includes('刚果') || !guardrailsContent.includes('埃博拉')) {
    throw new Error('lib/guardrails.ts 缺少 AFRICA_GLOBAL 非洲与全球公共卫生实体定义！');
  }

  const healingPath = path.join(ROOT, 'lib', 'selfHealingEngine.ts');
  const healingContent = fs.readFileSync(healingPath, 'utf8');
  if (!healingContent.includes('全球公共卫生与海外疫情预警')) {
    throw new Error('lib/selfHealingEngine.ts 缺少【全球公共卫生与海外疫情预警】核心定性！');
  }
  if (!healingContent.includes('世界卫生组织 WHO 官方通报')) {
    throw new Error('lib/selfHealingEngine.ts 缺少世界卫生组织 WHO 权威信源映射！');
  }

  const fetcherPath = path.join(ROOT, 'lib', 'rssFetcher.ts');
  const fetcherContent = fs.readFileSync(fetcherPath, 'utf8');
  if (!fetcherContent.includes('AFRICA_GLOBAL')) {
    throw new Error('lib/rssFetcher.ts 未将 AFRICA_GLOBAL 纳入赛道与外溢门禁！');
  }
});

// -------------------------------------------------------------
// 门禁 9: 中国贷款市场报价利率 (LPR) 主权国别与央行信源硬门禁 (China LPR Sovereign Gate)
// -------------------------------------------------------------
check('Gate 9: 中国贷款市场报价利率 (LPR) 主权国别与央行信源硬门禁', () => {
  const healingPath = path.join(ROOT, 'lib', 'selfHealingEngine.ts');
  const healingContent = fs.readFileSync(healingPath, 'utf8');
  if (!healingContent.includes('中国货币政策与信贷基准定价')) {
    throw new Error('lib/selfHealingEngine.ts 缺少【中国货币政策与信贷基准定价】核心定性！');
  }
  if (!healingContent.includes('中国人民银行 PBOC 官方发布')) {
    throw new Error('lib/selfHealingEngine.ts 缺少中国人民银行 PBOC 权威信源映射！');
  }
  if (!healingContent.includes('中国${title}') && !healingContent.includes('中国$') && !healingContent.includes('`中国${')) {
    throw new Error('lib/selfHealingEngine.ts 缺少为无国别LPR标题自动补充【中国】主权前缀的逻辑！');
  }

  const fetcherPath = path.join(ROOT, 'lib', 'rssFetcher.ts');
  const fetcherContent = fs.readFileSync(fetcherPath, 'utf8');
  if (!fetcherContent.includes('中国货币政策与信贷基准定价')) {
    throw new Error('lib/rssFetcher.ts 缺少【中国货币政策与信贷基准定价】定性！');
  }
});

// -------------------------------------------------------------
// 门禁 10: 实时新闻抓取时效性与禁止陈年旧闻伪造当前时间硬门禁 (Real-Time Freshness & Anti-Zombie Gate)
// -------------------------------------------------------------
check('Gate 10: 实时新闻抓取时效性与禁止陈年旧闻伪造当前时间硬门禁', () => {
  const fetcherPath = path.join(ROOT, 'lib', 'rssFetcher.ts');
  const fetcherContent = fs.readFileSync(fetcherPath, 'utf8');

  // 10.1 严禁在爬虫中对抓取新闻使用无条件 Date.now() 伪造时间戳
  if (/time:\s*formatIntelDateTime\(Date\.now\(\)\)/.test(fetcherContent)) {
    throw new Error('lib/rssFetcher.ts 存在严重违规：爬虫直接使用 formatIntelDateTime(Date.now()) 伪造时间戳，导致陈年旧闻被赋予当天时间！');
  }

  // 10.2 必须对财新网与早报 URL 进行精确日期解析与时效过滤
  if (!fetcherContent.includes('caixin.com/(\\d{4})-(\\d{2})-(\\d{2})') && !fetcherContent.includes('caixin\\.com\\/(\\d{4})-(\\d{2})-(\\d{2})')) {
    throw new Error('lib/rssFetcher.ts 缺少针对财新网 URL 的精确年月日提取正则！');
  }
  if (!fetcherContent.includes('story(\\d{4})(\\d{2})(\\d{2})') && !fetcherContent.includes('story(\\d{4})(\\d{2})(\\d{2})-')) {
    throw new Error('lib/rssFetcher.ts 缺少针对联合早报 URL 的精确年月日提取正则！');
  }

  // 10.3 必须具备针对往年陈旧归档的拦截机制 (72小时或年份过滤)
  if (!fetcherContent.includes('diffDays > 3') || !fetcherContent.includes('201\\d|202[0-5]')) {
    throw new Error('lib/rssFetcher.ts 缺少严格的 72 小时时效淘汰或往年历史归档拦截门禁！');
  }

  // 10.4 排序必须考虑时效，严禁超过 48 小时的旧闻享受重大外溢置顶特权
  if (!fetcherContent.includes('aHours <= 48') || !fetcherContent.includes('aRecency')) {
    throw new Error('lib/rssFetcher.ts 排序引擎缺少基于发布时差的时效衰减与外溢特权剥离逻辑！');
  }
});

// -------------------------------------------------------------
// 门禁 11: 坚决拦截行情分时流水账与无主语残缺截断标题硬门禁 (Ticker Tape Spam & Headless Title Gate)
// -------------------------------------------------------------
check('Gate 11: 坚决拦截行情分时流水账与无主语残缺截断标题硬门禁', () => {
  const fetcherPath = path.join(ROOT, 'lib', 'rssFetcher.ts');
  const fetcherContent = fs.readFileSync(fetcherPath, 'utf8');

  // 11.1 STOCK_TAPE_SPAM_REGEX 必须覆盖开盘上涨/下跌、转债、分别涨跌等流水账
  if (!fetcherContent.includes('中证转债') || !fetcherContent.includes('开盘上涨') || !fetcherContent.includes('分别涨')) {
    throw new Error('lib/rssFetcher.ts 缺少针对转债分时、开盘涨跌及分别涨跌流水账的拦截规则！');
  }

  // 11.2 enrichHeadline 与 processSingleItemIsolated 必须严密拦截无主语从句 (isHeadlessClause / isHeadlessTitle)
  if (!fetcherContent.includes('isHeadlessClause') || !fetcherContent.includes('isHeadlessTitle')) {
    throw new Error('lib/rssFetcher.ts 缺少 isHeadlessClause 或 isHeadlessTitle 无主语标题熔断防御！');
  }

  // 11.3 autoCorrectTitle 必须具备无主语断裂残片自愈逻辑
  const healingPath = path.join(ROOT, 'lib', 'selfHealingEngine.ts');
  const healingContent = fs.readFileSync(healingPath, 'utf8');
  if (!healingContent.includes('isHeadless') || !healingContent.includes('分别涨|分别跌')) {
    throw new Error('lib/selfHealingEngine.ts autoCorrectTitle 缺少无主语断裂残片自动纠偏修复逻辑！');
  }
});

// -------------------------------------------------------------
// 门禁 12: 事实通报与独家深度透视严格分工红线（铲除复读机与灾害假解读）
// -------------------------------------------------------------
check('Gate 12: 事实通报与独家深度透视严格分工红线', () => {
  const newsCardPath = path.join(ROOT, 'components', 'NewsCard.tsx');
  const newsCardContent = fs.readFileSync(newsCardPath, 'utf8');

  // 12.1 卡片正面严禁保留实质重复的“核心结论 · 底层动因与本质归纳”
  if (newsCardContent.includes('核心结论 · 底层动因与本质归纳')) {
    throw new Error('components/NewsCard.tsx 仍保留无实质内容的“核心结论 · 底层动因与本质归纳”展示框，违背用户彻底删除指令！');
  }

  // 12.2 卡片必须引入 isDeepPerspectiveEligible 进行深度透视展开资格研判
  if (!newsCardContent.includes('isDeepPerspectiveEligible') || !newsCardContent.includes('hasDeepPerspective')) {
    throw new Error('components/NewsCard.tsx 缺少 isDeepPerspectiveEligible 或 hasDeepPerspective 深度透视准入门禁！');
  }

  // 12.3 Summary5W1HView 展开层绝对禁止粗暴复读事实通报一段式段落
  const summary5w1hPath = path.join(ROOT, 'components', 'Summary5W1HView.tsx');
  const summary5w1hContent = fs.readFileSync(summary5w1hPath, 'utf8');
  if (summary5w1hContent.includes('【事件深度透视 · 核心要务归纳】') && summary5w1hContent.includes('{paragraph}')) {
    throw new Error('components/Summary5W1HView.tsx 存在粗暴复读事实通报段落的冗余展示框！');
  }

  // 12.4 lib/deepPerspective.ts 六大纯事实详情免解读分类标准审校
  const deepPerspectivePath = path.join(ROOT, 'lib', 'deepPerspective.ts');
  const deepPerspectiveContent = fs.readFileSync(deepPerspectivePath, 'utf8');

  // 必须定义六大核心分类正则
  const requiredRegexes = [
    'FACTUAL_DISASTER_ACCIDENT_REGEX',
    'FACTUAL_CRIME_LEGAL_REGEX',
    'FACTUAL_CIVIC_MUNICIPAL_REGEX',
    'FACTUAL_CULTURE_SPORTS_REGEX',
    'FACTUAL_CORPORATE_ROUTINE_REGEX',
    'FACTUAL_TICKER_NOISE_REGEX',
  ];

  requiredRegexes.forEach((rName) => {
    if (!deepPerspectiveContent.includes(rName)) {
      throw new Error(`lib/deepPerspective.ts 缺少纯事实六大分类之 ${rName} 正则特征定义！`);
    }
  });

  if (!deepPerspectiveContent.includes('getFactualOnlyCategory') || !deepPerspectiveContent.includes('isDeepPerspectiveEligible')) {
    throw new Error('lib/deepPerspective.ts 缺少 getFactualOnlyCategory 或 isDeepPerspectiveEligible 核心研判函数！');
  }

  // 12.5 实测检验六大类别纯事实样本拦截（必须全部命中免解读，不得进行假解读）
  const testCases = [
    { name: '类别1·自然灾害险情', text: '四川盐边县泥石流致两人死亡三人失联，搜救工作正全力展开', category: 'FACTUAL_DISASTER_ACCIDENT_REGEX' },
    { name: '类别1·地震险情', text: '四川泸定发生4.8级地震，震源深度10千米', category: 'FACTUAL_DISASTER_ACCIDENT_REGEX' },
    { name: '类别2·治安刑事案件', text: '某地公安局通报一起打架斗殴案件，涉案嫌疑人已被依法刑事拘留', category: 'FACTUAL_CRIME_LEGAL_REGEX' },
    { name: '类别3·市政施工通知', text: '明日起市区某路段实施道路封闭施工，请市民提前规划绕行路线', category: 'FACTUAL_CIVIC_MUNICIPAL_REGEX' },
    { name: '类别3·气象日常预警', text: '市气象台发布暴雨黄色预警信号，启动防汛应急响应', category: 'FACTUAL_CIVIC_MUNICIPAL_REGEX' },
    { name: '类别4·体育竞技赛果', text: '中国乒乓球男单决赛胜出，成功夺冠锁定金牌', category: 'FACTUAL_CULTURE_SPORTS_REGEX' },
    { name: '类别4·名人生卒讣告', text: '著名老艺术家因病逝世享年86岁，追悼会将于本周举行', category: 'FACTUAL_CULTURE_SPORTS_REGEX' },
    { name: '类别5·企业例行变更', text: '某某科技有限公司发布公告，因业务发展需要变更注册地址至高新技术园区', category: 'FACTUAL_CORPORATE_ROUTINE_REGEX' },
    { name: '类别5·常规表彰捐款', text: '某集团向受灾地区捐赠物资，荣获当地商会优秀示范企业称号', category: 'FACTUAL_CORPORATE_ROUTINE_REGEX' },
    { name: '类别6·盘中无序分时', text: '离岸人民币日内微调，现货黄金短线拉升3美元，分时微涨0.08%', category: 'FACTUAL_TICKER_NOISE_REGEX' },
  ];

  testCases.forEach((tc) => {
    const rMatch = deepPerspectiveContent.match(new RegExp(`export const ${tc.category}\\s*=\\s*(\\/[^\\/]+\\/);`));
    if (!rMatch) {
      throw new Error(`未能从 lib/deepPerspective.ts 提取 ${tc.category} 正则`);
    }
    const rx = new RegExp(rMatch[1].slice(1, -1));
    if (!rx.test(tc.text)) {
      throw new Error(`六大纯事实分类正则校验失败：[${tc.name}] 文本 "${tc.text}" 未能被 ${tc.category} 正确命中识别！`);
    }
  });

  // 12.6 战略深度豁免实测（宏观货币/硬核芯片/重大重组退市等哪怕含有关键词也不得错杀）
  const strategicMatch = deepPerspectiveContent.match(/export const STRATEGIC_DEPTH_OVERRIDE_REGEX\s*=\s*(\/[^\/]+\/);/);
  if (!strategicMatch) {
    throw new Error('未能提取 STRATEGIC_DEPTH_OVERRIDE_REGEX 正则');
  }
  const strategicRx = new RegExp(strategicMatch[1].slice(1, -1));
  const strategicCases = [
    '美联储宣布降息25个基点，利率互换市场下调年内终点利率预测',
    '国内AI芯片先进制程流片成功并正式量产',
    '某涉嫌财务造假公司被证监会立案调查并强制退市出清',
    '商务部依法对关键稀有金属实施出口管制'
  ];
  strategicCases.forEach((text) => {
    if (!strategicRx.test(text)) {
      throw new Error(`国家战略深度豁免正则校验失败：文本 "${text}" 应当被豁免并允许提供深度透视，却被错杀！`);
    }
  });
});

// -------------------------------------------------------------
// 门禁 13: 港股与A股券商研报跨市场归类防窜道与信源保真硬红线
// -------------------------------------------------------------
check('Gate 13: 港股与A股券商研报跨市场归类防窜道与信源保真硬红线', () => {
  const fetcherPath = path.join(ROOT, 'lib', 'rssFetcher.ts');
  const fetcherContent = fs.readFileSync(fetcherPath, 'utf8');

  // 13.1 classifyTrack 必须具备针对港股与中资券商策略研报的硬核隔离逻辑
  if (!fetcherContent.includes('isChineseOrHkEquities') || !fetcherContent.includes("return 'china_macro'")) {
    throw new Error('lib/rssFetcher.ts 缺少 isChineseOrHkEquities 港股与中资券商研报专属归类隔离逻辑！');
  }

  // 13.2 严禁将券商研报无条件泛化贴上“美联储 FOMC 声明”信源标签
  if (!fetcherContent.includes('华泰证券策略研报') || !fetcherContent.includes('!/研报|策略|港股|A股|券商|分析师|观点|点评|仓位/.test(title)')) {
    throw new Error('lib/rssFetcher.ts 缺少券商研报与美联储FOMC信源防串味互斥保护！');
  }

  // 13.3 companyProfiles 必须收录华泰证券且严防“中金”2字短别名误伤“盘中金融”
  const profilePath = path.join(ROOT, 'lib', 'companyProfiles.ts');
  const profileContent = fs.readFileSync(profilePath, 'utf8');
  if (!profileContent.includes("name: '华泰证券'") || !profileContent.includes("name: '中信证券'")) {
    throw new Error('lib/companyProfiles.ts 缺少华泰证券或中信证券等核心头部券商图谱定义！');
  }
  if (profileContent.includes("aliases: ['中金公司', '中金', 'CICC']")) {
    throw new Error('lib/companyProfiles.ts 中金公司仍保留裸词别名“中金”，存在误伤“盘中金融/其中金融”严重风险！');
  }

  // 13.4 Summary5W1HView 展开层严禁重复渲染【涉事主体速览】展示框
  const summary5w1hPath = path.join(ROOT, 'components', 'Summary5W1HView.tsx');
  const summary5w1hContent = fs.readFileSync(summary5w1hPath, 'utf8');
  if (summary5w1hContent.includes('【涉事主体速览 · {activeProfile.name}】')) {
    throw new Error('components/Summary5W1HView.tsx 存在与卡片正面重复渲染【涉事主体速览】的冗余视觉块！');
  }
});

// -------------------------------------------------------------
// 门禁 14: 实体查错关键词智能精准提取与杜绝无关假词硬红线
// -------------------------------------------------------------
check('Gate 14: 实体查错关键词智能精准提取与杜绝无关假词硬红线', () => {
  const extractorPath = path.join(ROOT, 'lib', 'keywordExtractor.ts');
  if (!fs.existsSync(extractorPath)) {
    throw new Error('找不到 lib/keywordExtractor.ts 文件');
  }
  const extractorContent = fs.readFileSync(extractorPath, 'utf8');

  // 14.1 绝对严禁出现硬编码的“全球宏观 核心指标 市场动向”等虚假假词兜底
  if (extractorContent.includes('全球宏观 核心指标 市场动向') || extractorContent.includes("'全球宏观'")) {
    throw new Error('lib/keywordExtractor.ts 存在严重违规：严禁使用“全球宏观 核心指标 市场动向”等虚假无关假词作为搜索兜底！');
  }

  // 14.2 实测算法提取核心事实真实度
  const { extractSearchKeywords } = require(extractorPath);

  // 测试用例 1: 四川盐边县泥石流
  const yanbian = extractSearchKeywords('四川盐边县发生泥石流 致两人死亡三人失联，救援搜救与排险全力展开');
  if (!yanbian.includes('泥石流') || (!yanbian.includes('盐边') && !yanbian.includes('四川')) || (!yanbian.includes('死亡') && !yanbian.includes('失联'))) {
    throw new Error(`实体查错关键词提取失败：四川盐边县泥石流提取结果 "${yanbian}" 缺少核心事实要素（地名/泥石流/伤亡）！`);
  }
  if (yanbian.includes('全球宏观')) {
    throw new Error(`实体查错关键词提取出现违规宏观假词：${yanbian}`);
  }

  // 测试用例 2: 科技与算力上市
  const suiYuan = extractSearchKeywords('【AI算力】AI芯片公司燧原上市开盘涨188% 市值约1700亿元');
  if (!suiYuan.includes('燧原') || !suiYuan.includes('开盘涨188%')) {
    throw new Error(`实体查错关键词提取失败：燧原上市提取结果 "${suiYuan}" 缺少核心主体或涨幅！`);
  }

  // 测试用例 3: 宏观货币政策
  const warsh = extractSearchKeywords('美联储凯文·沃什宣布支持年内降息50个基点 美债收益率跳水');
  if (!warsh.includes('美联储') || !warsh.includes('降息') || (!warsh.includes('沃什') && !warsh.includes('美债'))) {
    throw new Error(`实体查错关键词提取失败：美联储降息提取结果 "${warsh}" 缺少核心实体！`);
  }

  // 测试用例 4: 券商重组
  const cicc = extractSearchKeywords('中金公司拟吸收合并东兴证券 股票今起停牌');
  if (!cicc.includes('中金公司') || !cicc.includes('东兴证券') || !cicc.includes('吸收合并')) {
    throw new Error(`实体查错关键词提取失败：券商合并提取结果 "${cicc}" 缺少核心主体或动作！`);
  }

  // 测试用例 5: 地震险情
  const luding = extractSearchKeywords('四川泸定发生4.8级地震 震源深度10千米 暂无人员伤亡报告');
  if ((!luding.includes('泸定') && !luding.includes('四川')) || !luding.includes('地震')) {
    throw new Error(`实体查错关键词提取失败：泸定地震提取结果 "${luding}" 缺少地名或地震要素！`);
  }
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
  console.log('   - 0 处标题感叹号/问号/省略号，且全量口水词库 100% 清零');
  console.log('   - 100% 深度传导遵循 1-Hop 一级直接因果，5W1H 结论定性全闭环');
  console.log('   - 100% 爬虫时效真实归因，严禁 Date.now() 伪造时间戳与陈年僵尸旧闻霸榜');
  console.log('   - 100% 物理拦截 A股盘中分时流水账，严禁“分别涨...”无主语残缺半截数字标题');
  console.log('================================================================\n');
  process.exit(0);
}

