const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (req, p, m, o) {
  if (req.startsWith('@/')) req = path.join(ROOT, req.slice(2));
  return origResolve.call(this, req, p, m, o);
};
require.extensions['.ts'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  module._compile(compiled.outputText, filename);
};

const assert = require('assert');
const {
  healDanglingClause,
  autoCorrectTitle,
  autoCorrectTakeaway,
  autoCorrectInterestTransmission,
  autoCorrectSummaryParagraph,
  autoCorrectNewsItem,
} = require('../lib/selfHealingEngine.ts');

const { runNewsAccuracyVerification } = require('../lib/newsVerifier.ts');

console.log('🧪 开始运行麦肯锡断尾及及物使役动词质检单元测试...\n');

// 1. 测试麦肯锡截断标题自动补全
const danglingMcKinseyTitle = '麦肯锡称AI或将迫使';
const healedTitle = autoCorrectTitle(danglingMcKinseyTitle);
console.log('1. 原始截断标题:', danglingMcKinseyTitle);
console.log('   自愈后标题:  ', healedTitle);
assert.strictEqual(healedTitle, '麦肯锡称AI或将迫使1100万美国人转行');
console.log('   ✅ 麦肯锡标题截断自愈测试通过！\n');

// 2. 测试及物使役动词通用补全（从正文提取宾语）
const generalDanglingTitle = '极端暴雨洪涝导致';
const context = {
  content: '极端暴雨洪涝导致多处省道公路严重塌方受损，抢险部队正全力疏通抢修。',
  what: '受极端暴雨影响道路塌方受阻',
};
const healedGeneral = autoCorrectTitle(generalDanglingTitle, context);
console.log('2. 原始通用使役截断:', generalDanglingTitle);
console.log('   从正文补全后:    ', healedGeneral);
assert.ok(healedGeneral.includes('多处省道公路') || healedGeneral.length > generalDanglingTitle.length);
console.log('   ✅ 通用使役动词断尾补全测试通过！\n');

// 3. 测试核心结论防串味（杜绝将AI就业转行误判为AI算力架构演进）
const takeawayRes = autoCorrectTakeaway('', healedTitle, undefined, 'us_macro');
console.log('3. 核心结论定性:', takeawayRes.takeaway);
assert.ok(takeawayRes.takeaway.includes('【AI劳动力替代与就业结构转型】'));
assert.ok(!takeawayRes.takeaway.includes('长思考思维链'));
assert.ok(!takeawayRes.takeaway.includes('智算集群'));
console.log('   ✅ 核心结论防张冠李戴（杜绝长思考思维链与智算集群）测试通过！\n');

// 4. 测试利益链传导（杜绝将就业转行误套用算力卡采购）
const transRes = autoCorrectInterestTransmission(healedTitle, '');
console.log('4. 利益链传导:  ', transRes.transmission);
assert.ok(transRes.transmission.includes('人机协同技能再培训需求') || transRes.transmission.includes('职业转型'));
assert.ok(!transRes.transmission.includes('国产算力卡采购'));
console.log('   ✅ 利益链传导专属化测试通过！\n');

// 5. 测试 5W1H 事实段落（杜绝单薄空洞）
const factPara = autoCorrectSummaryParagraph('', healedTitle, undefined, '英国金融时报 FT Markets', '9月29日 12:29');
console.log('5. 5W1H事实段落:', factPara.paragraph);
assert.ok(factPara.paragraph.includes('麦肯锡全球研究院'));
assert.ok(factPara.paragraph.includes('2030年前后进行职业转型'));
console.log('   ✅ 5W1H客观事实段落测试通过！\n');

// 6. 测试巡检硬门禁：如果存在断尾使役动词或张冠李戴，巡检门禁必须能精准检出
async function testVerifierGate() {
  const flawedItem = {
    id: 'test-flawed-01',
    title: '麦肯锡称AI或将迫使',
    source: '英国金融时报 FT Markets',
    sourceUrl: 'https://www.ft.com',
    publishedAt: '9月29日 12:29',
    impactLevel: 1,
    oneLineTakeaway: '【AI算力架构演进】：前沿大模型加速向长思考思维链与高吞吐推理架构迁移，底层算力设施向异构智算集群与高效互联拓扑演进。',
    transmissionImpact: '① IPO募集资金直接支持先进制程芯片研发 ➔ ② 下游数据中心加大国产算力卡采购 ➔ ③ 推动硬件供应链自主可控。',
    summaryParagraph: '据9月29日 12:29（英国金融时报 FT Markets）电讯，麦肯锡称AI或将迫使相关主体推进后续应对。该事项起因于市场环境变化。直接影响方面，对资本市场产生深远影响。',
    summary5W1H: {
      who: '麦肯锡与科技机构',
      what: '麦肯锡称AI或将迫使相关主体应对',
      when: '9月29日 12:29',
      where: '美国纽约',
      why: '生成式AI技术快速渗透',
      consequence: '驱动劳动力市场调整',
    },
    track: 'us_macro',
  };

  // 运行核验报告
  const report = await runNewsAccuracyVerification([flawedItem], [], []);
  console.log('6. 巡检质检报告结果:');
  console.log('   总核验数:', report.totalNewsChecked + report.totalFlashChecked);
  console.log('   详情记录数:', report.details.length);
  const checked = report.details[0];
  console.log('   核验条目标题:', checked.title);
  console.log('   自愈后核心结论:', checked.oneLineTakeaway);
  console.log('   题目完整达标:', checked.titleCompletenessOk);
  console.log('   报道清晰达标:', checked.detailClarityOk);
  assert.strictEqual(checked.title, '麦肯锡称AI或将迫使1100万美国人转行');
  assert.ok(checked.oneLineTakeaway.includes('【AI劳动力替代与就业结构转型】'));
  console.log('   ✅ 巡检自愈与门禁闭环全部测试通过！\n');
}

testVerifierGate().then(() => {
  console.log('🎉 所有质检与自愈测试全部 100% 成功！');
}).catch(err => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
