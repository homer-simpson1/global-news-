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

const {
  detectPrimarySource,
  classifyTrack,
  inferTransmission,
  generateCoreTakeaway,
  enrichHeadline,
  build5W1HSummary,
  cleanWireHeadline,
} = require('../lib/rssFetcher.ts');

const {
  getCompanyProfileForNews,
} = require('../lib/companyProfiles.ts');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

console.log('====================================================');
console.log('🧪 运行 8 大根因级架构修复专项回归验证测试套件');
console.log('====================================================\n');

// ------------------------------------------------------------------
// 1. 信源真实归因修复验证 (detectPrimarySource)
// ------------------------------------------------------------------
console.log('--- [Issue 1] 严禁客体评论反客为主（禁止将分析师言论伪造为官方声明） ---');
const fedCommentator = detectPrimarySource(
  '固定收益主管称美联储年内或降息50个基点',
  '华尔街分析师认为...',
  'us_macro',
  '华尔街见闻'
);
assert(!fedCommentator.source.includes('FOMC 官方声明'), `分析师评论不应被贴上美联储FOMC官方声明标签: ${fedCommentator.source}`);
assert(fedCommentator.source === '华尔街见闻', `应继承真实信源: ${fedCommentator.source}`);

const fedOfficial = detectPrimarySource(
  '美联储宣布降息25个基点，将联邦基金利率目标区间下调至4.25%-4.50%',
  '美联储FOMC声明...',
  'us_macro',
  ''
);
assert(fedOfficial.source.includes('FOMC 官方声明'), `真正官方决议应归因于官方声明: ${fedOfficial.source}`);


// ------------------------------------------------------------------
// 2. 境内公募与券商研报跨赛道防窜道 (classifyTrack & inferTransmission)
// ------------------------------------------------------------------
console.log('\n--- [Issue 2] 境内公募与券商研报严禁窜入 us_macro 与一级交易商美债传导 ---');
const domesticFundTrack = classifyTrack({
  title: '华泰证券策略研报：A股红利资产具备长期配置价值',
  content: '公募基金持续增配红利板块...',
});
assert(domesticFundTrack === 'china_macro', `境内券商研报应归类为 china_macro: ${domesticFundTrack}`);

const domesticBondTransmission = inferTransmission(
  'china_macro',
  '国债期货全线收涨，30年期主力合约涨0.32%',
  '国内银行间流动性充裕...'
);
assert(!domesticBondTransmission.includes('美债') && !domesticBondTransmission.includes('一级交易商'), `国内国债绝不能包含美债/一级交易商传导: ${domesticBondTransmission}`);


// ------------------------------------------------------------------
// 3. 大宗商品互斥分流 (inferTransmission & generateCoreTakeaway)
// ------------------------------------------------------------------
console.log('\n--- [Issue 3] 大宗商品严密互斥隔离（集运欧线 vs 锂盐碳酸锂 vs 工业金属 vs 原油） ---');
const shippingTransmission = inferTransmission(
  'commodities_shipping',
  '集运指数（欧线）主力合约大跌8%，地缘复航预期扰动运价',
  '红海航运或将复航...'
);
assert(shippingTransmission.includes('集运') || shippingTransmission.includes('航运') || shippingTransmission.includes('运力'), `集运新闻应传导航运运价: ${shippingTransmission}`);
assert(!shippingTransmission.includes('电芯') && !shippingTransmission.includes('冶炼'), `集运新闻绝不应包含锂电/电芯/冶炼: ${shippingTransmission}`);

const lithiumTakeaway = generateCoreTakeaway(
  '今日电池级碳酸锂现货价格持平，下游采买情绪谨慎',
  '碳酸锂现货报7.5万元/吨...',
  'commodities_shipping'
);
assert(lithiumTakeaway.includes('碳酸锂') || lithiumTakeaway.includes('电池') || lithiumTakeaway.includes('锂'), `锂盐新闻速览应精准锚定锂产业链: ${lithiumTakeaway}`);
assert(!lithiumTakeaway.includes('航运') && !lithiumTakeaway.includes('运价'), `锂盐新闻速览绝不应串入航运运价: ${lithiumTakeaway}`);


// ------------------------------------------------------------------
// 4. 纪检受贿主体动态解耦 (enrichHeadline & build5W1HSummary & inferTransmission)
// ------------------------------------------------------------------
console.log('\n--- [Issue 4] 严禁将任意受贿案件强行篡改为王建军案，动态解析涉案官员 ---');
const songTitle = '四川省人大常委会原副主任宋朝华受贿案一审宣判';
const enrichedSongTitle = enrichHeadline(songTitle, '', 'china_domestic');
assert(!enrichedSongTitle.includes('王建军'), `宋朝华受贿绝不能被篡改为王建军: ${enrichedSongTitle}`);
assert(!enrichedSongTitle.includes('9340万元'), `宋朝华受贿绝不能被捏造9340万元: ${enrichedSongTitle}`);

const song5W1H = build5W1HSummary(songTitle, '成都市中级人民法院一审宣判...', '最新权威电讯', '人民法院网');
assert(song5W1H.who.includes('宋朝华'), `5W1H主体应动态识别宋朝华: ${song5W1H.who}`);
assert(!song5W1H.who.includes('王建军'), `5W1H主体绝不能是王建军: ${song5W1H.who}`);


// ------------------------------------------------------------------
// 5. 企业主体 Title-First 纯净化与防券商劫持 (getCompanyProfileForNews)
// ------------------------------------------------------------------
console.log('\n--- [Issue 5] 企业图谱 Title-First 纯净化（防海通/券商劫持、防正文漫游李代桃僵） ---');
const muxiProfile = getCompanyProfileForNews(
  '沐曦集成电路开启A股上市辅导，海通证券任辅导机构',
  '海通证券已向中国证监会上海监管局报送了沐曦集成电路股份有限公司辅导备案...'
);
assert(muxiProfile !== null && muxiProfile.name === '沐曦集成电路', `上市辅导主角应为沐曦集成电路，而非券商: ${muxiProfile?.name}`);

const nonHijackedByBody = getCompanyProfileForNews(
  '北京出台具身智能机器人产业创新发展三年行动方案',
  '方案指出将依托清华大学等科研院所，英特尔、微软早期也曾在具身计算领域布局，海通证券研报认为产业空间巨大。'
);
assert(nonHijackedByBody === null, `正文随意提及英特尔/海通证券绝不能李代桃僵挂载到标题无关的新闻上: ${nonHijackedByBody?.name}`);


// ------------------------------------------------------------------
// 6. 综合早报多事并提分号隔离解构
// ------------------------------------------------------------------
console.log('\n--- [Issue 6] 综合早报/复合新闻分号主次解构与前缀净化 ---');
const rawDigest = 'T早报｜文远知行冲刺美股智驾第一股；台积电CoWoS先进封装扩产；美团外卖进入沙特利雅得';
const cleanedDigest = cleanWireHeadline(rawDigest);
assert(!cleanedDigest.includes('T早报｜'), `应剥离栏目头: ${cleanedDigest}`);
assert(cleanedDigest.includes('文远知行'), `应保留核心要闻: ${cleanedDigest}`);


// ------------------------------------------------------------------
// 7. 联合早报正文早报讯清洗防误杀
// ------------------------------------------------------------------
console.log('\n--- [Issue 7] 早报正文段落清洗防误杀（保留“（早报讯）”新闻事实首段） ---');
const zaobaoContent = `（早报讯）中国商务部星期三公布，依法依规将参与对台军售的多家美国实体列入不可靠实体清单。
联合早报保留版权所有，未经许可不得转载。`;
const isJunkFooter = /保留版权所有|未经许可不得转载|版权所有\s*©|早报网保留|未经书面授权|禁止转载|All rights reserved/i;
const zaobaoCleanLines = zaobaoContent
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 5 && !isJunkFooter.test(l));
assert(zaobaoCleanLines.some(l => l.includes('早报讯') && l.includes('不可靠实体清单')), `新闻正文首句（早报讯）绝不能被误杀清空: ${zaobaoCleanLines.join(' ')}`);


// ------------------------------------------------------------------
// 8. 标题言论冒号保真防伤
// ------------------------------------------------------------------
console.log('\n--- [Issue 8] 标题发声冒号保真（严禁将吴泳铭：AI篡改为磕巴逗号） ---');
const speechTitle = '吴泳铭：AI将重塑所有软件，阿里核心业务全面接入大模型';
const enrichedSpeech = enrichHeadline(speechTitle, '', 'apac_tech');
assert(enrichedSpeech.includes('吴泳铭：AI') || enrichedSpeech.includes('吴泳铭:AI'), `发言人冒号必须完整保留: ${enrichedSpeech}`);
assert(!enrichedSpeech.includes('吴泳铭，AI'), `发言人冒号绝不能被粗暴换成逗号: ${enrichedSpeech}`);

console.log('\n====================================================');
console.log(`🎯 测试结果汇总: 通过 ${passed} 项，失败 ${failed} 项`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
