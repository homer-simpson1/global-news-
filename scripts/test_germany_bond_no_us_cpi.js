/**
 * 专项防回归测试：德国/欧洲主权债及非美海外宏观新闻严禁挂载美国 BLS CPI 报告
 */
const {
  isMacroInflationNews,
  getMacroInflationBreakdown,
  getMacroInflationTakeaway,
  getMacroInflationTransmission,
  buildMacroInflationFactParagraph,
} = require('../lib/macroInflationEngine');
const {
  autoCorrectNewsItem,
  autoCorrectTrack,
  autoCorrectTakeaway,
  autoCorrectSummaryParagraph,
} = require('../lib/selfHealingEngine');

let failures = 0;
function assert(desc, condition, details = '') {
  if (!condition) {
    console.error(`❌ FAILED: ${desc}`, details);
    failures++;
  } else {
    console.log(`✅ PASSED: ${desc}`);
  }
}

console.log('===========================================================');
console.log('🧪 德国主权债收益率与美国 CPI 宏观通胀实体隔离专项测试');
console.log('===========================================================');

const germanTitle = '德国两年期国债收益率跌超4个基点，本周累涨超24个基点';
const germanContentWithFed = '据9月12日 00:46（英国金融时报 FT Markets）电讯，德国两年期国债收益率跌超4个基点，本周累涨超24个基点。受美联储议息预期与欧洲央行降息路径预期分化影响，美债收益率走势与德债收益率呈现不同步。';

// 1. 检验 isMacroInflationNews: 纯债券收益率波动严禁被误判为通胀报告
assert(
  '德国国债收益率波动不是宏观通胀报告',
  isMacroInflationNews(germanTitle) === false
);
assert(
  '即使正文含有美联储/央行政策，债券收益率波动也不是通胀发布',
  isMacroInflationNews(germanTitle + ' ' + germanContentWithFed) === false
);

// 2. 检验 getMacroInflationBreakdown: 实体互斥一票否决
const breakdownUsMacro = getMacroInflationBreakdown(germanTitle, germanContentWithFed, 'us_macro');
assert(
  '即使传入 track=us_macro，德国国债也严禁挂载美国 CPI 指标矩阵',
  breakdownUsMacro === null,
  JSON.stringify(breakdownUsMacro)
);

const breakdownGlobal = getMacroInflationBreakdown(germanTitle, germanContentWithFed, 'global_cognition');
assert(
  '在 global_cognition 赛道下，德国国债也严禁挂载通胀指标矩阵',
  breakdownGlobal === null
);

// 3. 检验 autoCorrectTrack: 德国国债必须纠偏至 global_cognition
const trackCorrection = autoCorrectTrack('us_macro', germanTitle);
assert(
  'autoCorrectTrack 成功将德国国债从 us_macro 转轨至 global_cognition',
  trackCorrection.track === 'global_cognition' && trackCorrection.wasCorrected === true
);

// 4. 检验投研定性与传导链条：严禁出现美国劳工统计局/沃什
const takeaway = getMacroInflationTakeaway(germanTitle, germanContentWithFed);
assert(
  '投研定性符合欧洲与德债定位，且不含沃什或美国CPI',
  !takeaway.includes('沃什') && !takeaway.includes('美国8月核心CPI') && takeaway.includes('德债')
);

const transmission = getMacroInflationTransmission(germanTitle, germanContentWithFed);
assert(
  '利益链传导精准对齐欧债与无风险贴现率，不含FOMC加息',
  !transmission.includes('FOMC加息25bps') && (transmission.includes('德') || transmission.includes('欧'))
);

// 5. 检验被错误污染的历史条目自愈净化
const pollutedItem = {
  id: 'TEST-GERMAN-BOND',
  title: germanTitle,
  track: 'us_macro',
  source: '英国金融时报 FT Markets',
  sourceUrl: 'https://www.ft.com/markets',
  publishedAt: '9月12日 00:46',
  timeWindow: 'TODAY',
  sentiment: 'NEUTRAL',
  impactLevel: 2,
  oneLineTakeaway: '德国两年期国债收益率跌超4个基点，本周累涨超24个基点',
  transmissionImpact: '信源仅陈述单一动作，未披露上下游合同与转嫁细节，不做无依据推测',
  summaryParagraph: '据9月12日 00:46（英国金融时报 FT Markets）电讯，德国两年期国债收益率跌超4个基点，本周累涨超24个基点。',
  macroInflationBreakdown: {
    reportName: '美国劳工统计局 (BLS) 8月 CPI 通胀完整报告',
    period: '2026年8月',
    releaseTime: '9月11日 20:30',
    headlineMetrics: [],
    components: [],
    fedPolicyImpact: {},
    assetImplication: '',
    dataSource: '美国劳工统计局 (BLS) 官方发布',
  },
};

const healedItem = autoCorrectNewsItem(pollutedItem);
assert('自愈后赛道转入 global_cognition', healedItem.track === 'global_cognition');
assert('自愈后被污染的美国 BLS CPI 报告被物理清除', healedItem.macroInflationBreakdown === undefined);
assert('自愈后事实通报保留德国国债真实内容', healedItem.summaryParagraph.includes('德国两年期国债收益率'));
assert('自愈后事实通报严禁包含美国劳工统计局', !healedItem.summaryParagraph.includes('美国劳工统计局'));
assert('自愈后核心结论严禁包含美国劳工统计局或沃什', !healedItem.oneLineTakeaway.includes('沃什') && !healedItem.oneLineTakeaway.includes('美国劳工统计局'));

// 6. 正向保护校验：真实的美国 CPI 依然完美生成并保持核心环比0.3%
const realUSHeadline = '美国8月核心CPI同比 2.4%, 预期 2.4%';
const realUSContent = '美国8月核心CPI环比上涨0.3%，总体CPI环比上涨0.2%。';
assert('真正的美国CPI报道被准确识别', isMacroInflationNews(realUSHeadline) === true);
const realUSBreakdown = getMacroInflationBreakdown(realUSHeadline, realUSContent, 'us_macro');
assert('真正的美国CPI成功生成指标矩阵', realUSBreakdown !== null && realUSBreakdown.reportName.includes('BLS'));
const realCoreMoM = realUSBreakdown?.headlineMetrics.find(m => m.name.includes('核心CPI (环比)'));
assert('真实美国CPI核心环比读数为0.3%', realCoreMoM?.actual === '0.3%');

console.log('\n===========================================================');
if (failures === 0) {
  console.log('🎉 所有德国/欧洲国债与美国通胀隔离测试全部 100% 通过！');
} else {
  console.error(`💥 测试未全部通过，共有 ${failures} 处错误！`);
  process.exit(1);
}
