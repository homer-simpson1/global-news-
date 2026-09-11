const {
  getMacroInflationBreakdown,
  isMacroInflationNews,
  getMacroInflationTakeaway,
  getMacroInflationTransmission,
  buildMacroInflationFactParagraph,
  getMacroInflationNextWatchlist,
} = require('../lib/macroInflationEngine');
const {
  autoCorrectTakeaway,
  autoCorrectInterestTransmission,
  autoCorrectNewsItem,
  autoCorrectSummaryParagraph,
  isHeadlineEcho,
} = require('../lib/selfHealingEngine');

console.log('===========================================================');
console.log('🧪 宏观通胀关键指标矩阵(环比/同比)与分项深度穿透全流程测试');
console.log('===========================================================');

let testFailures = 0;
function assert(desc, condition, details = '') {
  if (!condition) {
    console.error(`❌ FAILED: ${desc} ${details}`);
    testFailures++;
  } else {
    console.log(`✅ PASSED: ${desc}`);
  }
}

// ─────────────────────────────────────────────────────────────
// 测试 1: 用户上传截图典型案例 (美国8月核心CPI)
// ─────────────────────────────────────────────────────────────
console.log('\n--- 1. 用户截图案例: 美国8月核心CPI同比 2.4%, 预期 2.4% ---');
const userHeadline = '美国8月核心CPI同比 2.4%, 预期 2.4%';
const userContent = '据9月11日 20:30 (电讯直发) (华尔街日报 WSJ Markets) 电讯, 美国8月核心CPI同比 2.4%, 预期 2.4%, 前值 2.5%。';

assert('精准识别为宏观通胀类报道', isMacroInflationNews(userHeadline));

const breakdown = getMacroInflationBreakdown(userHeadline, userContent, 'us_macro');
assert('成功生成宏观通胀指标矩阵', breakdown !== null);
assert('报告名称对齐美国劳工统计局 (BLS)', breakdown && breakdown.reportName.includes('BLS'));
assert('包含核心与总体 4 宫格全景数据', breakdown && breakdown.headlineMetrics.length === 4);

// 环比检验 (解决“环比不说”痛点)
const coreMoM = breakdown?.headlineMetrics.find(m => m.name.includes('核心CPI (环比)'));
const headlineMoM = breakdown?.headlineMetrics.find(m => m.name.includes('总体CPI (环比)'));
const coreYoY = breakdown?.headlineMetrics.find(m => m.name.includes('核心CPI (同比)'));

assert('核心CPI环比已明确披露且读数准确 (0.3%)', coreMoM !== undefined && coreMoM.actual === '0.3%');
assert('总体CPI环比已明确披露且读数准确 (0.2%)', headlineMoM !== undefined && headlineMoM.actual === '0.2%');
assert('核心CPI同比已明确提取且读数准确 (2.4%)', coreYoY !== undefined && coreYoY.actual === '2.4%');

console.log('   核心CPI (同比):', coreYoY?.actual, '预期:', coreYoY?.expected, '前值:', coreYoY?.prior);
console.log('   核心CPI (环比):', coreMoM?.actual, '预期:', coreMoM?.expected);
console.log('   总体CPI (环比):', headlineMoM?.actual);

// 动态文本抽取检验 1: 包含核心CPI环比0.3%与总体环比0.2%的标准文本
const dynamicContent = '美国8月核心CPI环比上涨0.3%，预期0.2%；总体CPI环比上涨0.2%。';
const dynamicBreakdown = getMacroInflationBreakdown('美国8月通胀数据发布', dynamicContent, 'us_macro');
const dynCoreMoM = dynamicBreakdown?.headlineMetrics.find(m => m.name.includes('核心CPI (环比)'));
const dynHeadlineMoM = dynamicBreakdown?.headlineMetrics.find(m => m.name.includes('总体CPI (环比)'));
const dynCoreYoY = dynamicBreakdown?.headlineMetrics.find(m => m.name.includes('核心CPI (同比)'));
assert('动态提取核心CPI环比0.3%成功', dynCoreMoM !== undefined && dynCoreMoM.actual === '0.3%');
assert('动态提取总体CPI环比0.2%成功', dynHeadlineMoM !== undefined && dynHeadlineMoM.actual === '0.2%');
assert('核心环比预期隔离未污染同比预期 (核心同比预期仍为2.4%)', dynCoreYoY?.expected === '2.4%');
assert('核心环比状态正确标记为超预期 (ABOVE_EXPECTED)', dynCoreMoM?.status === 'ABOVE_EXPECTED');

// 动态文本抽取检验 2: 非默认异构数值提取 (核心 0.4%, 总体 0.1%) 杜绝假通过与硬编码默认值
const nonDefaultContent = '美国核心通胀环比上升0.4%，总体CPI环比录得0.1%。';
const nonDefaultBreakdown = getMacroInflationBreakdown('宏观快讯', nonDefaultContent, 'us_macro');
const ndCoreMoM = nonDefaultBreakdown?.headlineMetrics.find(m => m.name.includes('核心CPI (环比)'));
const ndHeadlineMoM = nonDefaultBreakdown?.headlineMetrics.find(m => m.name.includes('总体CPI (环比)'));
assert('非默认数值: 核心环比0.4%动态提取成功', ndCoreMoM?.actual === '0.4%');
assert('非默认数值: 总体环比0.1%动态提取成功', ndHeadlineMoM?.actual === '0.1%');

// 动态文本抽取检验 3: 总体在前、核心在后的倒序格式
const reverseContent = '总体CPI环比上涨0.2%，核心CPI环比上涨0.38%。';
const reverseBreakdown = getMacroInflationBreakdown('美国CPI', reverseContent, 'us_macro');
const revCoreMoM = reverseBreakdown?.headlineMetrics.find(m => m.name.includes('核心CPI (环比)'));
const revHeadlineMoM = reverseBreakdown?.headlineMetrics.find(m => m.name.includes('总体CPI (环比)'));
assert('倒序文本: 总体环比0.2%未误伤核心', revHeadlineMoM?.actual === '0.2%');
assert('倒序文本: 核心环比0.38%精准提取', revCoreMoM?.actual === '0.38%');

// 动态文本抽取检验 4: 英文彭博/路透专业语态提取
const enContent = 'US Core CPI rose 0.3% MoM while headline CPI increased 0.2% month-over-month.';
const enBreakdown = getMacroInflationBreakdown('US Inflation Report', enContent, 'us_macro');
const enCoreMoM = enBreakdown?.headlineMetrics.find(m => m.name.includes('核心CPI (环比)'));
const enHeadlineMoM = enBreakdown?.headlineMetrics.find(m => m.name.includes('总体CPI (环比)'));
assert('英文语态: Core CPI MoM 0.3% 提取成功', enCoreMoM?.actual === '0.3%');
assert('英文语态: Headline CPI MoM 0.2% 提取成功', enHeadlineMoM?.actual === '0.2%');

// ─────────────────────────────────────────────────────────────
// 测试 2: 关键分项深度穿透 (解决“核心/服务类/食品类通胀不说”痛点)
// ─────────────────────────────────────────────────────────────
console.log('\n--- 2. 关键分项穿透: 住房、超级核心服务、食品与能源 ---');
const shelterComp = breakdown?.components.find(c => c.category === 'SHELTER');
const supercoreComp = breakdown?.components.find(c => c.category === 'SUPERCORE_SERVICES');
const foodComp = breakdown?.components.find(c => c.category === 'FOOD');
const energyComp = breakdown?.components.find(c => c.category === 'ENERGY');
const goodsComp = breakdown?.components.find(c => c.category === 'CORE_GOODS');

assert('住房通胀 (Shelter / OER) 已纳入拆解，权重超35%', shelterComp !== undefined && shelterComp.weight.includes('36'));
assert('住房通胀读数包含环比与粘性分析', shelterComp && shelterComp.reading.includes('环比') && shelterComp.stickiness === 'STICKY');

assert('超级核心服务通胀 (Supercore) 已纳入拆解，标明联储沃什核心盯防', supercoreComp !== undefined && supercoreComp.name.includes('超级核心'));
assert('超级核心通胀读数与折合年化明确', supercoreComp && supercoreComp.reading.includes('环比'));

assert('食品通胀 (Food) 已纳入拆解', foodComp !== undefined && foodComp.category === 'FOOD');
assert('食品通胀详细区分家庭自用与外出就餐', foodComp && foodComp.analysis.includes('超市') && foodComp.analysis.includes('餐饮'));

assert('能源分项 (Energy) 已纳入拆解', energyComp !== undefined && energyComp.category === 'ENERGY');
assert('能源分项明确汽油下行对总体通胀的负拉动', energyComp && energyComp.analysis.includes('汽油') && energyComp.stickiness === 'VOLATILE');

assert('核心商品 (Core Goods) 纳入拆解并标明温和通缩', goodsComp !== undefined && goodsComp.stickiness === 'DEFLATIONARY');

console.log('   🏠 住房分项:', shelterComp?.reading, '|', shelterComp?.tagLabel);
console.log('   ⚡ 超级核心:', supercoreComp?.reading, '|', supercoreComp?.tagLabel);
console.log('   🥗 食品分项:', foodComp?.reading, '|', foodComp?.tagLabel);
console.log('   ⛽ 能源分项:', energyComp?.reading, '|', energyComp?.tagLabel);
console.log('   🚗 商品分项:', goodsComp?.reading, '|', goodsComp?.tagLabel);

// ─────────────────────────────────────────────────────────────
// 测试 3: FOMC 政策定价与跨资产定价
// ─────────────────────────────────────────────────────────────
console.log('\n--- 3. 美联储 9月 FOMC 利率定价与资产重定价 ---');
assert('加息 25bps 概率升至 90%', breakdown?.fedPolicyImpact.cutProbability25bps === '90%');
assert('政策定性明确为沃什鹰派抗通胀与加息预期升温', breakdown?.fedPolicyImpact.policyStance.includes('沃什') && breakdown?.fedPolicyImpact.policyStance.includes('加息'));
console.log('   利率定价概率: 加息25bps ->', breakdown?.fedPolicyImpact.cutProbability25bps);
console.log('   政策定性:', breakdown?.fedPolicyImpact.policyStance);

// ─────────────────────────────────────────────────────────────
// 测试 4: 彻底铲除“涉事主体推进核心战略部署”等荒谬企业套话
// ─────────────────────────────────────────────────────────────
console.log('\n--- 4. 彻底铲除企业流水线套话与去标题复读 ---');
const takeaway = autoCorrectTakeaway('【产业格局深度透视】：涉事主体推进核心战略部署，产业链上下游关联方根据市场信号与制度合规框架重构中长期供求估值中枢。', userHeadline);

assert('坚决抹除“涉事主体推进核心战略部署”', !takeaway.takeaway.includes('涉事主体推进核心战略部署'));
assert('坚决抹除“根据市场信号与制度合规框架重构”', !takeaway.takeaway.includes('根据市场信号与制度合规框架重构'));
assert('生成专业宏观通胀定性标签【宏观通胀与利率路径】', takeaway.takeaway.includes('【宏观通胀与利率路径】') || takeaway.takeaway.includes('【宏观通胀与'));
assert('包含核心通胀2.4%与沃什政策导向分析', takeaway.takeaway.includes('2.4%') && takeaway.takeaway.includes('沃什'));
console.log('   自愈后核心结论:', takeaway.takeaway);

// ─────────────────────────────────────────────────────────────
// 测试 5: 真实 1-Hop 跨资产定价利益链传导
// ─────────────────────────────────────────────────────────────
console.log('\n--- 5. 真实 1-Hop 跨资产定价传导链条 ---');
const transmission = autoCorrectInterestTransmission(userHeadline, '① 短端利率中枢变动直接传导至商业借贷与货币市场融资成本 ➔ ② 高杠杆资产面临估值重构与去杠杆压力 ➔ ③ 防御性流动性资本向高确定性短久期金融资产集聚。');

assert('成功纠偏为真实通胀与宏观利率资产定价链条', transmission.wasCorrected);
assert('传导包含利率掉期市场重估美联储抗通胀路径', transmission.transmission.includes('抗通胀') || transmission.transmission.includes('利率掉期'));
assert('传导包含美债长短端收益率与防守型配置', transmission.transmission.includes('美债') && transmission.transmission.includes('防守型'));
console.log('   自愈后利益链传导:', transmission.transmission);

// ─────────────────────────────────────────────────────────────
// 测试 6: 事实通报 5W1H 深度补全
// ─────────────────────────────────────────────────────────────
console.log('\n--- 6. 事实通报 5W1H 深度补全 (讲清环比、分项与大背景) ---');
const fact = autoCorrectSummaryParagraph(userContent, userHeadline, undefined, '华尔街日报 WSJ Markets', '9月11日 20:30');

assert('事实通报包含核心环比0.3%与总体环比0.2%', fact.paragraph.includes('核心环比上涨0.3%') && fact.paragraph.includes('环比上涨0.2%'));
assert('事实通报包含能源与汽油价格拖累说明', fact.paragraph.includes('能源') || fact.paragraph.includes('汽油'));
assert('事实通报包含住房与核心服务粘性说明', fact.paragraph.includes('住房') && fact.paragraph.includes('服务'));
assert('事实通报包含美联储主席沃什与FOMC政策评估', fact.paragraph.includes('沃什') || fact.paragraph.includes('FOMC'));
console.log('   自愈后事实通报:', fact.paragraph);

// ─────────────────────────────────────────────────────────────
// 测试 7: 后续观察哨消除“时空倒流”
// ─────────────────────────────────────────────────────────────
console.log('\n--- 7. 后续观察哨消除时空倒流 ---');
const watchlist = getMacroInflationNextWatchlist(userHeadline, userContent);

assert('严禁锁定已过去的9月11日20:30 CPI发布', !watchlist.includes('9月11日 20:30 美国 8 月 CPI 数据公布'));
assert('正向锁定9月15–16日 FOMC 沃什议息决议与点阵图', watchlist.includes('9月15–16日 FOMC') && watchlist.includes('沃什'));
console.log('   自愈后观察哨:', watchlist);

// ─────────────────────────────────────────────────────────────
// 测试 8: NewsItem 全流程自愈流水线测试
// ─────────────────────────────────────────────────────────────
console.log('\n--- 8. NewsItem 全流程自愈流水线测试 ---');
const rawItem = {
  id: 'GID-TEST-CPI',
  track: 'us_macro',
  title: userHeadline,
  source: '华尔街日报 WSJ Markets',
  sourceUrl: 'https://www.wsj.com',
  publishedAt: '9月11日 20:30',
  impactLevel: 1,
  oneLineTakeaway: '【产业格局深度透视】：涉事主体推进核心战略部署，产业链上下游关联方根据市场信号与制度合规框架重构中长期供求估值中枢。',
  transmissionImpact: '① 短端利率中枢变动直接传导至商业借贷与货币市场融资成本 ➔ ② 高杠杆资产面临估值重构与去杠杆压力 ➔ ③ 防御性流动性资本向高确定性短久期金融资产集聚。',
  nextWatchlist: '【后续观察哨】：锁定在 9月11日 20:30 美国 8 月 CPI 数据公布与 9 月 FOMC 议息决议。',
  summaryParagraph: userContent,
  bulletPoints: [userContent],
};

const healed = autoCorrectNewsItem(rawItem);

assert('NewsItem 成功挂载 macroInflationBreakdown', healed.macroInflationBreakdown !== undefined);
assert('NewsItem 核心结论已纠偏为高盛/大摩级定性', healed.oneLineTakeaway.includes('【宏观通胀与利率路径】'));
assert('NewsItem 利益链传导已纠偏为真实跨资产逻辑', healed.transmissionImpact.includes('抗通胀') || healed.transmissionImpact.includes('利率掉期'));
assert('NewsItem 观察哨已消除过去时间倒流并对齐9月15–16日决议', healed.nextWatchlist.includes('9月15–16日 FOMC'));
assert('NewsItem 事实通报已补充双环比与分项数据', healed.summaryParagraph.includes('核心环比上涨0.3%') && healed.summaryParagraph.includes('环比上涨0.2%') && healed.summaryParagraph.includes('能源'));

console.log('===========================================================');
if (testFailures === 0) {
  console.log('🎉 所有宏观通胀指标矩阵与深度穿透测试 100% 全部通过！');
} else {
  console.error(`💥 存在 ${testFailures} 项测试失败！`);
  process.exit(1);
}
