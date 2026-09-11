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

// 动态文本抽取检验: 包含核心CPI环比0.3%与总体环比0.2%的文本
const dynamicContent = '美国8月核心CPI环比上涨0.3%，预期0.2%；总体CPI环比上涨0.2%。';
const dynamicBreakdown = getMacroInflationBreakdown('美国8月通胀数据发布', dynamicContent, 'us_macro');
const dynCoreMoM = dynamicBreakdown?.headlineMetrics.find(m => m.name.includes('核心CPI (环比)'));
const dynHeadlineMoM = dynamicBreakdown?.headlineMetrics.find(m => m.name.includes('总体CPI (环比)'));
assert('动态提取核心CPI环比0.3%成功', dynCoreMoM !== undefined && dynCoreMoM.actual === '0.3%');
assert('动态提取总体CPI环比0.2%成功', dynHeadlineMoM !== undefined && dynHeadlineMoM.actual === '0.2%');

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
// 测试 3: FOMC 降息概率与跨资产定价
// ─────────────────────────────────────────────────────────────
console.log('\n--- 3. 美联储 9月 FOMC 降息概率与资产重定价 ---');
assert('降息 25bps 概率锚定在 85%', breakdown?.fedPolicyImpact.cutProbability25bps === '85%');
assert('降息 50bps 概率收窄至 15%', breakdown?.fedPolicyImpact.cutProbability50bps === '15%');
assert('政策定性明确为首次预防式降息', breakdown?.fedPolicyImpact.policyStance.includes('预防式降息'));
console.log('   降息概率定价: 25bps ->', breakdown?.fedPolicyImpact.cutProbability25bps, '| 50bps ->', breakdown?.fedPolicyImpact.cutProbability50bps);
console.log('   政策定性:', breakdown?.fedPolicyImpact.policyStance);

// ─────────────────────────────────────────────────────────────
// 测试 4: 彻底铲除“涉事主体推进核心战略部署”等荒谬企业套话
// ─────────────────────────────────────────────────────────────
console.log('\n--- 4. 彻底铲除企业流水线套话与去标题复读 ---');
const takeaway = autoCorrectTakeaway('【产业格局深度透视】：涉事主体推进核心战略部署，产业链上下游关联方根据市场信号与制度合规框架重构中长期供求估值中枢。', userHeadline);

assert('坚决抹除“涉事主体推进核心战略部署”', !takeaway.takeaway.includes('涉事主体推进核心战略部署'));
assert('坚决抹除“根据市场信号与制度合规框架重构”', !takeaway.takeaway.includes('根据市场信号与制度合规框架重构'));
assert('生成专业宏观通胀定性标签【宏观通胀与降息路径】', takeaway.takeaway.includes('【宏观通胀与降息路径】'));
assert('包含核心通胀回落至2.4%与25bps降息分析', takeaway.takeaway.includes('2.4%') && takeaway.takeaway.includes('25bps'));
console.log('   自愈后核心结论:', takeaway.takeaway);

// ─────────────────────────────────────────────────────────────
// 测试 5: 真实 1-Hop 跨资产定价利益链传导
// ─────────────────────────────────────────────────────────────
console.log('\n--- 5. 真实 1-Hop 跨资产定价传导链条 ---');
const transmission = autoCorrectInterestTransmission(userHeadline, '① 短端利率中枢变动直接传导至商业借贷与货币市场融资成本 ➔ ② 高杠杆资产面临估值重构与去杠杆压力 ➔ ③ 防御性流动性资本向高确定性短久期金融资产集聚。');

assert('成功纠偏为真实通胀与降息资产定价链条', transmission.wasCorrected);
assert('传导包含利率掉期对9月FOMC降息25bps概率锚定', transmission.transmission.includes('85%') && transmission.transmission.includes('25bps'));
assert('传导包含美债收益率与科技资产贴现率支撑', transmission.transmission.includes('美债') && transmission.transmission.includes('贴现率'));
console.log('   自愈后利益链传导:', transmission.transmission);

// ─────────────────────────────────────────────────────────────
// 测试 6: 事实通报 5W1H 深度补全
// ─────────────────────────────────────────────────────────────
console.log('\n--- 6. 事实通报 5W1H 深度补全 (讲清环比、分项与大背景) ---');
const fact = autoCorrectSummaryParagraph(userContent, userHeadline, undefined, '华尔街日报 WSJ Markets', '9月11日 20:30');

assert('事实通报包含核心环比0.3%与总体环比0.2%', fact.paragraph.includes('核心环比上涨0.3%') && fact.paragraph.includes('环比上涨0.2%'));
assert('事实通报包含能源与汽油价格拖累说明', fact.paragraph.includes('能源') || fact.paragraph.includes('汽油'));
assert('事实通报包含住房与核心服务粘性说明', fact.paragraph.includes('住房') && fact.paragraph.includes('服务'));
assert('事实通报包含美联储9月降息25bps政策结论', fact.paragraph.includes('降息25个基点'));
console.log('   自愈后事实通报:', fact.paragraph);

// ─────────────────────────────────────────────────────────────
// 测试 7: 后续观察哨消除“时空倒流”
// ─────────────────────────────────────────────────────────────
console.log('\n--- 7. 后续观察哨消除时空倒流 ---');
const watchlist = getMacroInflationNextWatchlist(userHeadline, userContent);

assert('严禁锁定已过去的9月11日20:30 CPI发布', !watchlist.includes('9月11日 20:30 美国 8 月 CPI 数据公布'));
assert('正向锁定9月18日 FOMC 首次降息决议与点阵图', watchlist.includes('9月18日 FOMC') && watchlist.includes('点阵图'));
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
assert('NewsItem 核心结论已纠偏为高盛/大摩级定性', healed.oneLineTakeaway.includes('【宏观通胀与降息路径】'));
assert('NewsItem 利益链传导已纠偏为真实跨资产逻辑', healed.transmissionImpact.includes('利率掉期') && healed.transmissionImpact.includes('85%'));
assert('NewsItem 观察哨已消除过去时间倒流', healed.nextWatchlist.includes('9月18日 FOMC'));
assert('NewsItem 事实通报已补充双环比与分项数据', healed.summaryParagraph.includes('核心环比上涨0.3%') && healed.summaryParagraph.includes('环比上涨0.2%') && healed.summaryParagraph.includes('能源'));

console.log('===========================================================');
if (testFailures === 0) {
  console.log('🎉 所有宏观通胀指标矩阵与深度穿透测试 100% 全部通过！');
} else {
  console.error(`💥 存在 ${testFailures} 项测试失败！`);
  process.exit(1);
}
