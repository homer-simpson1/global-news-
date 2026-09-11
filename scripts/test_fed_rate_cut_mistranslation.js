const {
  sanitizeFedRatePolicyWording,
} = require('../lib/macroInflationEngine');

const {
  autoCorrectTitle,
  autoCorrectSummaryParagraph,
  autoCorrect5W1H,
  autoCorrectSentimentAndImpact,
  autoCorrectTakeaway,
  autoCorrectInterestTransmission,
  autoCorrectNewsItem,
} = require('../lib/selfHealingEngine');

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`✅ PASSED: ${message}`);
    passedCount++;
  } else {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  }
}

console.log('===========================================================');
console.log('🧪 美联储利率政策真实定价（2026年加息/紧缩与客观新闻采编）全链路测试');
console.log('===========================================================');

// 1. 真实加息电讯与断句补全测试（严禁将真实的加息篡改为虚假的降息！）
console.log('\n--- 1. 尊重真实加息电讯与截断残句补全 ---');
const rawTitle = '交易员预计美联储下周加息概率约为90%，已充分消化美联储年底前两';
const sanitizedTitle = sanitizeFedRatePolicyWording(rawTitle);
console.log('清洗后标题:', sanitizedTitle);
assert(sanitizedTitle.includes('加息概率约为90%'), '标题如实保留信源报告的“加息概率约为90%”');
assert(sanitizedTitle.includes('年底前两次加息预期'), '成功将截断的残句补全为“年底前两次加息预期”');
assert(!sanitizedTitle.endsWith('两'), '末尾悬挂残字已彻底消除');

// 2. 情绪定级逻辑一致性测试 (加息对风险资产为利空·承压 BEARISH)
console.log('\n--- 2. 加息预期情绪定级一致性测试 ---');
const correctedTitle = autoCorrectTitle(rawTitle);
console.log('autoCorrectTitle 结果:', correctedTitle);
const sentimentRes = autoCorrectSentimentAndImpact(correctedTitle, 'NEUTRAL', 2);
console.log('纠正后情绪:', sentimentRes.sentiment, '影响级别:', sentimentRes.impactLevel);
assert(sentimentRes.sentiment === 'BEARISH', '美联储90%加息紧缩定价对齐为 BEARISH (利空·承压)');
assert(sentimentRes.impactLevel === 1, '重大加息紧缩冲击对齐为顶级权重 (Level 1)');

// 3. 核心结论定性测试 (支持沃什鹰派加息路径)
console.log('\n--- 3. 核心结论定性生成测试 ---');
const takeawayRes = autoCorrectTakeaway('', correctedTitle);
console.log('自愈后核心结论:', takeawayRes.takeaway);
assert(takeawayRes.takeaway.includes('【美联储利率路径与加息定价】'), '核心结论包含专业宏观定性标签【美联储利率路径与加息定价】');
assert(takeawayRes.takeaway.includes('沃什') && takeawayRes.takeaway.includes('加息'), '核心结论清晰点明沃什鹰派立场与加息定价');

// 4. 利益链传导测试
console.log('\n--- 4. 利益链传导专业投研生成测试 ---');
const transmissionRes = autoCorrectInterestTransmission(correctedTitle, '');
console.log('自愈后利益链传导:', transmissionRes.transmission);
assert(transmissionRes.transmission.includes('9月FOMC加息25bps概率至约90%'), '利益链传导精准传导9月加息25bps定价');
assert(transmissionRes.transmission.includes('贴现率重估') || transmissionRes.transmission.includes('政策利率中枢同步上行'), '传导包含美债收益率与风险资产贴现率重估');

// 5. 降息新闻反向测试：真实降息新闻保持降息逻辑与中性情绪
console.log('\n--- 5. 真实降息新闻对照测试 ---');
const cutTitle = '美联储下周降息25基点概率升至85%，货币政策迈向宽松';
const cutSentiment = autoCorrectSentimentAndImpact(cutTitle, 'BEARISH', 2);
assert(cutSentiment.sentiment === 'NEUTRAL', '降息基准预期情绪定级保持 NEUTRAL');
const cutTakeaway = autoCorrectTakeaway('', cutTitle);
assert(cutTakeaway.takeaway.includes('【美联储利率路径与降息定价】'), '降息标题生成降息专属定性');

// 6. NewsItem 全流程自愈流水线测试
console.log('\n--- 6. NewsItem 模拟流水线全自动自愈测试 ---');
const rawMockItem = {
  id: 'ALPHA_test_rate_hike_001',
  track: 'us_macro',
  title: '交易员预计美联储下周加息概率约为90%，已充分消化美联储年底前两',
  source: '美联储 FOMC 声明',
  sourceUrl: 'https://www.federalreserve.gov',
  publishedAt: '9月11日 20:33',
  impactLevel: 2,
  sentiment: 'NEUTRAL',
  oneLineTakeaway: '',
  transmissionImpact: '',
  summaryParagraph: '据9月11日 20:33（电讯直发）（美联储 FOMC 声明）电讯，利率互换显示，交易员目前预计美联储下周加息25个基点的概率为89%，高于数据公布前的69%。已充分消化美联储年底前两',
  nextWatchlist: '【后续观察哨】：锁定在 9月15–16日 FOMC 议息决议与美联储最新季度点阵图指引。',
};

const healedItem = autoCorrectNewsItem(rawMockItem);
console.log('\n自愈后完整对象核心字段:');
console.log('Title:', healedItem.title);
console.log('Sentiment:', healedItem.sentiment);
console.log('SummaryParagraph:', healedItem.summaryParagraph);
console.log('Takeaway:', healedItem.oneLineTakeaway);
console.log('Transmission:', healedItem.transmissionImpact);
console.log('NextWatchlist:', healedItem.nextWatchlist);

assert(healedItem.title.includes('加息'), '全流程自愈后如实保留“加息”真实事实');
assert(healedItem.title.includes('年底前两次加息预期'), '全流程自愈后补全末尾残句');
assert(healedItem.sentiment === 'BEARISH', '加息新闻全流程情绪定级为 BEARISH');
assert(healedItem.oneLineTakeaway.includes('加息定价'), '核心结论对齐加息定价');
assert(healedItem.transmissionImpact.includes('加息25bps'), '利益链传导对齐加息传导');
assert(healedItem.nextWatchlist.includes('9月15–16日 FOMC'), '观察哨对齐2026年9月15-16日议息决议');

console.log('===========================================================');
console.log(`🎉 测试全部通过！(${passedCount}/${totalCount})`);
