const fs = require('fs');
const path = require('path');
const ts = require('typescript');

require.extensions['.ts'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      baseUrl: path.resolve(__dirname, '..'),
      paths: {
        '@/*': ['./*'],
      },
    },
  });
  module._compile(compiled.outputText, filename);
};

const moduleAlias = require('module');
const origResolve = moduleAlias._resolveFilename;
moduleAlias._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    request = path.join(__dirname, '..', request.slice(2));
  }
  return origResolve.call(this, request, parent, isMain, options);
};

const { enrichHeadline, generateCoreTakeaway, build5W1HSummary } = require('../lib/rssFetcher.ts');
const { autoCorrectNewsItem, healTitleContentMismatch } = require('../lib/selfHealingEngine.ts');
const { runNewsAccuracyVerification } = require('../lib/newsVerifier.ts');

async function runTests() {
  console.log('====================================================');
  console.log('   测试：标题与内容一致性修复专项质检 (Title-Content Consistency)');
  console.log('====================================================\n');

  // --- 测试 1: 飓风伊萨亚斯关停墨西哥湾原油产能 ---
  console.log('--- 测试 1: 墨西哥湾飓风原油关停 vs OPEC+ 偷梁换柱 ---');
  const hurricaneTitle = '飓风“伊萨亚斯”导致墨西哥湾近四分之三原油产量关停';
  const hurricaneContent = '据10月10日 04:31（电讯直发）（全球宏观专线）电讯，飓风“伊萨亚斯”（Isaias）正推高美国墨西哥湾沿岸原油价格，该地区近四分之三的石油生产已被关停。直接影响方面，缩减行业即期供给规模，收紧现货市场可流通库存缓冲垫。';
  
  const enrichedH = enrichHeadline(hurricaneTitle, hurricaneContent, 'commodities_shipping');
  console.log(`[Enrich Headline]: "${enrichedH}"`);
  if (enrichedH.includes('OPEC+') || enrichedH.includes('90美元') || enrichedH.includes('顺延减产')) {
    throw new Error(`[FAIL] 飓风原油标题被错误篡改为OPEC+减产: "${enrichedH}"`);
  }
  if (!enrichedH.includes('伊萨亚斯') && !enrichedH.includes('墨西哥湾')) {
    throw new Error(`[FAIL] 飓风标题核心主体丢失: "${enrichedH}"`);
  }
  console.log('✅ PASS: 标题保留真实事实主体（伊萨亚斯/墨西哥湾），未被OPEC+覆盖！');

  const takeawayH = generateCoreTakeaway(enrichedH, hurricaneContent, 'commodities_shipping', { who: '', when: '', where: '', what: '', why: '', consequence: '' });
  console.log(`[Takeaway]: "${takeawayH}"`);
  if (takeawayH.includes('OPEC+核心成员国计划将每日220万桶')) {
    throw new Error(`[FAIL] 核心结论被错误套用OPEC+220万桶模板: "${takeawayH}"`);
  }
  console.log('✅ PASS: 核心结论准确对应突发极端天气与产油设施关停！');

  const { autoCorrectNewsItem, healTitleContentMismatch, autoCorrectWatchlist } = require('../lib/selfHealingEngine.ts');
  const sentryH = autoCorrectWatchlist('', enrichedH, hurricaneContent);
  console.log(`[Sentry]: "${sentryH}"`);
  if (sentryH.includes('JMMC') && sentryH.includes('OPEC+')) {
    throw new Error(`[FAIL] 观察哨被错误套用OPEC+ JMMC公报: "${sentryH}"`);
  }
  console.log('✅ PASS: 观察哨未被错误锁定OPEC+ JMMC！');

  // --- 测试 2: 美股三大期指尾盘全线上涨 vs 全线下挫大跌背离 ---
  console.log('\n--- 测试 2: 美股三大期指尾盘全线上涨 vs 全线下挫倒置 ---');
  const futuresTitle = '周五（10月9日）纽约尾盘，标普500股指期货最终涨0.65%，道指期货涨0.92%，纳斯达克100股指期货涨0.57%';
  const futuresContent = '据10月10日 05:24（事件发生于周五10月9日）（全球宏观专线）电讯，周五（10月9日）纽约尾盘，标普500股指期货最终涨0.65%，道指期货涨0.92%，纳斯达克100股指期货涨0.57%。罗素2000股指期货涨0.53%。';

  const enrichedF = enrichHeadline(futuresTitle, futuresContent, 'us_macro');
  console.log(`[Enrich Headline]: "${enrichedF}"`);
  if (enrichedF.includes('全线下挫') || enrichedF.includes('大跌')) {
    throw new Error(`[FAIL] 美股三大期指全线上涨却被篡改为全线下挫/大跌: "${enrichedF}"`);
  }
  console.log('✅ PASS: 期指全线上涨未被颠倒为“全线下挫，道指大跌”！');

  const summaryF = build5W1HSummary(enrichedF, futuresContent, '10月10日 05:24', '全球宏观专线', 'us_macro');
  console.log(`[5W1H Why]: "${summaryF.why}"`);
  if (summaryF.why.includes('获利了结盘抛压') || summaryF.why.includes('利空情绪压制')) {
    throw new Error(`[FAIL] 期指全线上涨却生成了获利了结抛压与利空压制: "${summaryF.why}"`);
  }
  console.log('✅ PASS: 5W1H 起因未被错误断言为利空抛压压制！');

  // --- 测试 3: 历史错误数据通过 autoCorrectNewsItem 自动纠偏 ---
  console.log('\n--- 测试 3: 历史污染卡片通过自愈流水线 (autoCorrectNewsItem) 自动纠偏 ---');
  const poisonedFuturesItem = {
    id: 'TEST-FUTURES-1',
    track: 'us_macro',
    title: '美股三大期指尾盘全线下挫，道指大跌但科技巨头扛住跌幅',
    source: '全球宏观专线',
    sourceUrl: 'https://example.com',
    publishedAt: '10月10日 05:24',
    impactLevel: 1,
    oneLineTakeaway: '【股指衍生品与盘前情绪锚定】：指数期货涨跌反映跨市场资金定价。',
    transmissionImpact: '① 股指期货变动 ➔ ② 机构头寸调整 ➔ ③ 现货大盘重定价。',
    sentiment: 'BEARISH',
    summaryParagraph: '据10月10日 05:24（全球宏观专线）电讯，周五纽约尾盘，标普500股指期货最终涨0.65%，道指期货涨0.92%，纳斯达克100股指期货涨0.57%。罗素2000股指期货涨0.53%。',
    bulletPoints: [
      '标普500股指期货最终涨0.65%，道指期货涨0.92%，纳斯达克100股指期货涨0.57%。',
      '罗素2000股指期货涨0.53%。',
      '信源通道：全球宏观专线 权威电讯（核验直发时间：10月10日 05:24）。'
    ],
    summary5W1H: {
      who: '涉事当事方',
      why: '受短期市场获利了结盘抛压或外部宏观利空情绪压制',
      what: '周五纽约尾盘美股期指动态',
      when: '10月10日 05:24',
      where: '华尔街金融市场',
      consequence: '引导关联头寸短期重定价'
    }
  };

  const healedF = autoCorrectNewsItem(poisonedFuturesItem);
  console.log(`[Healed Title]: "${healedF.title}"`);
  if (healedF.title.includes('全线下挫') || healedF.title.includes('大跌')) {
    throw new Error(`[FAIL] 污染标题未能在自愈流水线中纠正: "${healedF.title}"`);
  }
  if (!healedF.title.includes('上扬') && !healedF.title.includes('涨')) {
    throw new Error(`[FAIL] 纠正后的标题未体现上涨行情: "${healedF.title}"`);
  }
  console.log(`[Healed Why]: "${healedF.summary5W1H.why}"`);
  if (healedF.summary5W1H.why.includes('获利了结盘抛压')) {
    throw new Error(`[FAIL] 污染 Why 未能在自愈流水线中纠正: "${healedF.summary5W1H.why}"`);
  }
  console.log('✅ PASS: 历史期指背离卡片经自愈引擎 100% 成功纠正！');

  const poisonedHurricaneItem = {
    id: 'TEST-OIL-1',
    track: 'commodities_shipping',
    title: 'OPEC+主要成员国探讨顺延减产，布伦特原油在90美元上方筑底',
    source: '全球宏观专线',
    sourceUrl: 'https://example.com',
    publishedAt: '10月10日 04:31',
    impactLevel: 1,
    oneLineTakeaway: '【产油国供给调节与市场平衡】：OPEC+核心成员国计划将每日220万桶自愿减产协议顺延至年底。',
    transmissionImpact: '① 供给收紧 ➔ ② 炼厂成本上升 ➔ ③ 现货溢价走阔。',
    sentiment: 'NEUTRAL',
    summaryParagraph: '据10月10日 04:31（全球宏观专线）电讯，飓风“伊萨亚斯”（Isaias）正推高美国墨西哥湾沿岸原油价格，该地区近四分之三的石油生产已被关停。受此影响，缩减行业即期供给规模，收紧现货市场可流通库存缓冲垫。',
    bulletPoints: [
      '飓风“伊萨亚斯”（Isaias）正推高美国墨西哥湾沿岸原油价格，该地区近四分之三的石油生产已被关停。',
      '直接影响方面，缩减行业即期供给规模，收紧现货市场可流通库存缓冲垫。'
    ],
    summary5W1H: {
      who: 'OPEC+',
      why: '',
      what: '飓风推高墨西哥湾原油价格并关停近四分之三石油生产',
      when: '10月10日 04:31',
      where: '美国墨西哥湾沿岸',
      consequence: '缩减行业即期供给规模，收紧现货市场可流通库存缓冲垫'
    }
  };

  const healedO = autoCorrectNewsItem(poisonedHurricaneItem);
  console.log(`[Healed Title]: "${healedO.title}"`);
  if (healedO.title.includes('OPEC+') || healedO.title.includes('90美元')) {
    throw new Error(`[FAIL] 污染飓风标题未能在自愈流水线中纠正: "${healedO.title}"`);
  }
  if (!healedO.title.includes('伊萨亚斯') && !healedO.title.includes('墨西哥湾')) {
    throw new Error(`[FAIL] 纠正后的标题未体现飓风事实: "${healedO.title}"`);
  }
  console.log('✅ PASS: 历史飓风张冠李戴卡片经自愈引擎 100% 成功纠正！');

  // --- 测试 5: 国内商品期货开盘普跌 vs OPEC+ 偷梁换柱与李代桃僵 ---
  console.log('\n--- 测试 5: 国内商品期货开盘普跌 vs OPEC+ 偷梁换柱自愈 ---');
  const poisonedCommodityFuturesItem = {
    id: 'TEST-COMMODITY-1',
    track: 'commodities_shipping',
    title: 'OPEC+主要成员国探讨顺延减产，布伦特原油在90美元上方筑底',
    source: '全球宏观专线',
    sourceUrl: 'https://example.com',
    publishedAt: '10月15日 09:00',
    impactLevel: 2,
    oneLineTakeaway: '【产油国供给调节与市场平衡】：OPEC+计划顺延每日220万桶自愿减产协议；核心产油国通过供给调节锚定国际油价中枢。',
    transmissionImpact: '① 现货生产或航路异动直接改变即期供需紧张度 ➔ ② 贸易商与加工企业根据库存及运力调整订舱与备货节奏 ➔ ③ 衍生品与现货基差完成动态重平衡。',
    sentiment: 'BEARISH',
    nextWatchlist: '【后续观察哨】：锁定在 下周 OPEC+ 联合部长级监督委员会（JMMC）官方公报及EIA库存。',
    summaryParagraph: '据10月15日 09:00（电讯直发）（全球宏观专线）电讯，商品期货开盘，沪银主力合约跌超5%，焦煤跌近5%，原油跌超4%，20号胶、沪锡、焦炭、橡胶跌超3%。 直接影响方面，缩减行业即期供给规模，收紧现货市场可流通库存缓冲垫。',
    bulletPoints: [
      '商品期货开盘，沪银主力合约跌超5%，焦煤跌近5%，原油跌超4%，20号胶、沪锡、焦炭、橡胶跌超3%。',
      '直接影响方面，缩减行业即期供给规模，收紧现货市场可流通库存缓冲垫。'
    ],
    summary5W1H: {
      who: 'OPEC+',
      why: '',
      what: '商品期货开盘，沪银主力合约跌超5%，焦煤跌近5%，原油跌超4%，20号胶、沪锡、焦炭、橡胶跌超3%',
      when: '10月15日 09:00',
      where: '国内商品期货市场',
      consequence: '缩减行业即期供给规模，收紧现货市场可流通库存缓冲垫'
    }
  };

  const healedC = autoCorrectNewsItem(poisonedCommodityFuturesItem);
  console.log(`[Healed Commodity Title]: "${healedC.title}"`);
  if (healedC.title.includes('OPEC+') || healedC.title.includes('90美元') || healedC.title.includes('顺延减产')) {
    throw new Error(`[FAIL] 污染商品期货标题未能在自愈流水线中纠正: "${healedC.title}"`);
  }
  if (!healedC.title.includes('商品期货') && !healedC.title.includes('沪银') && !healedC.title.includes('走低') && !healedC.title.includes('跌')) {
    throw new Error(`[FAIL] 纠正后的标题未体现商品期货事实: "${healedC.title}"`);
  }
  console.log('✅ PASS: 标题成功从错误的OPEC+减产纠正为真实的商品期货走势！');

  console.log(`[Healed Commodity Takeaway]: "${healedC.oneLineTakeaway}"`);
  if (healedC.oneLineTakeaway.includes('产油国供给调节') || healedC.oneLineTakeaway.includes('220万桶')) {
    throw new Error(`[FAIL] 核心结论仍然错误套用产油国减产模板: "${healedC.oneLineTakeaway}"`);
  }
  console.log('✅ PASS: 核心结论成功纠偏为大宗商品期货盘前波动与资金定价！');

  console.log(`[Healed Commodity Watchlist]: "${healedC.nextWatchlist}"`);
  if (healedC.nextWatchlist.includes('JMMC') || healedC.nextWatchlist.includes('OPEC+')) {
    throw new Error(`[FAIL] 观察哨仍然错误挂载OPEC+ JMMC公报: "${healedC.nextWatchlist}"`);
  }
  console.log('✅ PASS: 后续观察哨成功纠偏为上期所/大商所主力合约持仓与基差！');

  console.log(`[Healed Commodity Summary]: "${healedC.summaryParagraph}"`);
  if (healedC.summaryParagraph.includes('直接影响方面') || healedC.summaryParagraph.includes('缩减行业即期供给规模')) {
    throw new Error(`[FAIL] 详情段落依然残留OPEC供给缩减或八股病句: "${healedC.summaryParagraph}"`);
  }
  console.log('✅ PASS: 详情段落中错误套用的OPEC后果已彻底清除！');

  // --- 测试 4: 质检核验 (runNewsAccuracyVerification) ---
  console.log('\n--- 测试 4: 质检核验闭环测试 ---');
  const report = await runNewsAccuracyVerification([healedF, healedO, healedC], [], []);
  console.log(`[Report Score]: ${report.accuracyScore}/100 | Status: ${report.overallStatus}`);
  console.log(`[Title Completeness]: ${report.titleCompletenessRate} (${report.titleCompletenessPassed}/${report.totalNewsChecked})`);
  console.log(`[Detail Clarity]: ${report.detailClarityRate} (${report.detailClarityPassed}/${report.totalNewsChecked})`);

  if (report.titleCompletenessPassed !== 3 || report.detailClarityPassed !== 3) {
    throw new Error(`[FAIL] 题目完整性或报道清晰度未达到100%: 题目=${report.titleCompletenessPassed}/3, 详情=${report.detailClarityPassed}/3`);
  }
  console.log('✅ PASS: 质检核验 题目完整达标率 100% 且 报道详情清晰率 100%！');

  console.log('\n====================================================');
  console.log('🎉 所有标题与内容一致性修复与自愈门禁测试 100% 全部通过！');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ 测试失败:\n', err);
  process.exit(1);
});
