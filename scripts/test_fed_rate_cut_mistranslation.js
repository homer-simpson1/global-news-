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
console.log('🧪 美联储降息周期机翻倒错（Rate Cut 误写为加息）全链路拦截测试');
console.log('===========================================================');

// 1. 用户截图案例原始标题与通报清洗测试
console.log('\n--- 1. 用户截图案例: 交易员预计美联储下周加息概率约为90% ---');
const rawTitle = '交易员预计美联储下周加息概率约为90%，已充分消化美联储年底前两';
const sanitizedTitle = sanitizeFedRatePolicyWording(rawTitle);
console.log('清洗后标题:', sanitizedTitle);
assert(!sanitizedTitle.includes('加息'), '标题中坚决杜绝出现“加息”');
assert(sanitizedTitle.includes('降息25基点概率约为90%') || sanitizedTitle.includes('降息'), '标题成功纠正为“降息25基点概率约为90%”');
assert(sanitizedTitle.includes('年底前两次降息预期') || !sanitizedTitle.endsWith('两'), '成功补全断裂的“年底前两次降息预期”');

const rawFact = '据9月11日 20:33（电讯直发）（美联储 FOMC 声明）电讯，利率互换显示，交易员目前预计美联储下周将基准利率上调25个基点的概率为89%，高于数据公布前的69%。';
const sanitizedFact = sanitizeFedRatePolicyWording(rawFact);
console.log('清洗后事实通报:', sanitizedFact);
assert(!sanitizedFact.includes('上调25个基点'), '通报中坚决杜绝“上调25个基点”');
assert(sanitizedFact.includes('下调25个基点'), '通报成功纠正为“下调25个基点”');

// 2. 丰富机翻倒错模式拦截测试
console.log('\n--- 2. 常见上游机翻倒错模式覆盖测试 ---');
const case1 = sanitizeFedRatePolicyWording('市场已完全计入年底前两次加息的预期');
assert(case1.includes('两次降息的预期'), '“年底前两次加息”纠偏为“两次降息”');

const case2 = sanitizeFedRatePolicyWording('美国消费者价格超预期，加强美联储下周上调利率的理由');
assert(!case2.includes('上调利率'), '“加强美联储下周上调利率”成功纠偏');

const case3 = sanitizeFedRatePolicyWording('利率互换显示，交易员消化的下周加息概率升至约90%');
assert(case3.includes('下周降息25基点概率升至约90%'), '“交易员消化的下周加息概率”纠偏为“下周降息25基点概率”');

// 3. 负向门禁测试：日本央行加息不得误伤
console.log('\n--- 3. 真实加息主体防误伤测试 (日本央行 BOJ) ---');
const bojNews = '日本央行行长植田和男表示若通胀与薪资持续回升将进一步加息，隔夜利率上调25个基点';
const bojResult = sanitizeFedRatePolicyWording(bojNews);
assert(bojResult.includes('加息') && bojResult.includes('上调25个基点'), '日本央行真实加息报道绝不误伤');

// 4. 情绪定级防误判测试 (杜绝将降息概率高达90%判定为利空·承压)
console.log('\n--- 4. 情绪与影响级别防误判测试 ---');
const correctedTitle = autoCorrectTitle(rawTitle);
console.log('autoCorrectTitle 结果:', correctedTitle);
const sentimentRes = autoCorrectSentimentAndImpact(correctedTitle, 'BEARISH', 2);
console.log('纠正后情绪:', sentimentRes.sentiment, '影响级别:', sentimentRes.impactLevel);
assert(sentimentRes.sentiment !== 'BEARISH', '美联储90%降息定价严禁被打上 BEARISH (利空·承压)');
assert(sentimentRes.sentiment === 'NEUTRAL', '美联储降息基准预期定价对齐为 NEUTRAL (中性稳健)');

// 5. 核心结论与利益链传导测试
console.log('\n--- 5. 核心结论与利益链传导专业投研生成测试 ---');
const takeawayRes = autoCorrectTakeaway('', correctedTitle);
console.log('自愈后核心结论:', takeawayRes.takeaway);
assert(takeawayRes.takeaway.includes('【美联储利率路径与降息定价】'), '核心结论包含专业宏观定性标签【美联储利率路径与降息定价】');
assert(!takeawayRes.takeaway.includes('加息'), '核心结论坚决不含“加息”');

const transmissionRes = autoCorrectInterestTransmission(correctedTitle, '');
console.log('自愈后利益链传导:', transmissionRes.transmission);
assert(transmissionRes.transmission.includes('利率互换市场将9月FOMC降息25bps概率推升至约90%'), '利益链传导精准传导9月降息25bps定价');
assert(transmissionRes.transmission.includes('激进降息50bps的宽松溢价被完全剔除'), '利益链分析清晰指出出清50bps激进降息溢价');

// 6. NewsItem 全流程自愈流水线测试
console.log('\n--- 6. NewsItem 模拟流水线全自动纠偏测试 ---');
const rawMockItem = {
  id: 'ALPHA_test_rate_cut_001',
  track: 'us_macro',
  title: '交易员预计美联储下周加息概率约为90%，已充分消化美联储年底前两',
  source: '美联储 FOMC 声明',
  sourceUrl: 'https://www.federalreserve.gov',
  publishedAt: '9月11日 20:33',
  impactLevel: 2,
  sentiment: 'BEARISH',
  oneLineTakeaway: '【利率高位粘性与降息预期校准】：美国强劲就业与服务业通胀支撑政策利率中枢，短久期美债收益率反弹，依赖快速大幅宽松的主动多头策略面临再平衡。',
  transmissionImpact: '① 短端国债收益率上行直接推升浮动利率债务持有方的再融资成本 ➔ ② 机构投资者根据贴现率变化压减高估值资产久期敞口 ➔ ③ 华尔街一级交易商与货币市场基金维持对短久期国库券的防守型配置。',
  summaryParagraph: '据9月11日 20:33（电讯直发）（美联储 FOMC 声明）电讯，利率互换显示，交易员目前预计美联储下周将基准利率上调25个基点的概率为89%，高于数据公布前的69%。市场已完全计入年底前两次加息的预期。',
  nextWatchlist: '【后续观察哨】：锁定在 9月18日 FOMC 议息决议（降息25bps基准路径落地）与美联储最新季度点阵图指引。',
};

const healedItem = autoCorrectNewsItem(rawMockItem);
console.log('\n自愈后完整对象核心字段:');
console.log('Title:', healedItem.title);
console.log('Sentiment:', healedItem.sentiment);
console.log('SummaryParagraph:', healedItem.summaryParagraph);
console.log('Takeaway:', healedItem.oneLineTakeaway);
console.log('Transmission:', healedItem.transmissionImpact);

assert(!healedItem.title.includes('加息'), '全流程自愈后标题无“加息”');
assert(healedItem.title.includes('降息'), '全流程自愈后标题包含“降息”');
assert(!healedItem.summaryParagraph.includes('上调25个基点'), '全流程自愈后正文无“上调25个基点”');
assert(healedItem.summaryParagraph.includes('下调25个基点'), '全流程自愈后正文包含“下调25个基点”');
assert(!healedItem.summaryParagraph.includes('两次加息'), '全流程自愈后正文无“两次加息”');
assert(healedItem.summaryParagraph.includes('两次降息'), '全流程自愈后正文包含“两次降息”');
assert(healedItem.sentiment !== 'BEARISH', '全流程自愈后情绪不再是 BEARISH (利空·承压)');

console.log('===========================================================');
console.log(`🎉 测试全部通过！(${passedCount}/${totalCount})`);
