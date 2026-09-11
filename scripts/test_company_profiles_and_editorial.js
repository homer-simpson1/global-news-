const { getCompanyProfileForNews, CURATED_COMPANY_PROFILES } = require('../lib/companyProfiles');
const { autoCorrectTakeaway, autoCorrectInterestTransmission, autoCorrectNewsItem, autoCorrectSummaryParagraph, isHeadlineEcho } = require('../lib/selfHealingEngine');
const { fallback_to_grounded_summary } = require('../lib/rssFetcher');

console.log('===========================================================');
console.log('🧪 核心主体速览、去标题复读与利益链传导自愈深度全面测试');
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
// 测试 1: 用户上传截图典型案例 (燧原上市)
// ─────────────────────────────────────────────────────────────
console.log('\n--- 1. 用户截图案例: AI芯片公司燧原上市开盘涨188% 市值约1700亿元 ---');
const userHeadline = 'AI芯片公司燧原上市开盘涨188% 市值约1700亿元';
const profile = getCompanyProfileForNews(userHeadline);

assert('成功识别燧原科技主体档案', profile !== null && profile.name === '燧原科技');
assert('主体赛道分类准确为 AI算力芯片', profile && profile.sector.includes('AI算力芯片'));
assert('主体描述包含云燧/邃思与腾讯生态', profile && profile.description.includes('云燧') && profile.description.includes('腾讯'));
console.log('   主体业务概况:', profile?.description);
console.log('   生态定位:', profile?.marketRole);

// ─────────────────────────────────────────────────────────────
// 测试 2: 核心结论彻底根除标题复读 (No Headline-Echo) 强化测试
// ─────────────────────────────────────────────────────────────
console.log('\n--- 2. 核心结论去标题复读深度强化测试 ---');
const verbatimTakeaway = '【AI算力架构演进】：AI芯片公司燧原上市开盘涨188% 市值约1700亿元。';
const prefixEchoTakeaway = '【核心透视】：今日AI芯片公司燧原上市开盘涨188% 市值约1700亿元。';
const suffixEchoTakeaway = '【核心透视】：AI芯片公司燧原上市开盘涨188% 市值约1700亿元，创历史新高。';
const fastNewsEchoTakeaway = '【核心透视】：快讯：AI芯片公司燧原上市开盘涨188% 市值约1700亿元。';

assert('精准识别标题逐字复读', isHeadlineEcho(verbatimTakeaway, userHeadline));
assert('精准识别带前缀(今日)的标题复读', isHeadlineEcho(prefixEchoTakeaway, userHeadline));
assert('精准识别带后缀(创历史新高)的标题复读', isHeadlineEcho(suffixEchoTakeaway, userHeadline));
assert('精准识别带快讯前缀的标题复读', isHeadlineEcho(fastNewsEchoTakeaway, userHeadline));

const healedTakeaway = autoCorrectTakeaway(verbatimTakeaway, userHeadline, undefined, 'apac_tech');
console.log('   自愈后核心结论:', healedTakeaway.takeaway);
assert('自愈后核心结论不再包含标题复读', !isHeadlineEcho(healedTakeaway.takeaway, userHeadline));
assert('自愈后核心结论包含专业定性标签【国产算力资本化重估】', healedTakeaway.takeaway.includes('【国产算力资本化重估】'));
assert('核心结论包含算力底座与先进制程流片等机构投研定性', healedTakeaway.takeaway.includes('算力底座') && healedTakeaway.takeaway.includes('流片'));

// ─────────────────────────────────────────────────────────────
// 测试 3: 半导体各细分赛道资本重估定性（杜绝张冠李戴）
// ─────────────────────────────────────────────────────────────
console.log('\n--- 3. 细分赛道投研定性与利益链精准对齐（杜绝张冠李戴） ---');

// 3.1 长鑫存储 (DRAM) -> 【存储芯片资本重估与扩产】
const cxmtTakeaway = autoCorrectTakeaway(undefined, '存储芯片龙头长鑫启动IPO上市辅导', undefined, 'apac_tech');
assert('长鑫存储定性为存储芯片资本重估', cxmtTakeaway.takeaway.includes('【存储芯片资本重估与扩产】'));
const cxmtTrans = autoCorrectInterestTransmission('存储芯片龙头长鑫启动IPO上市辅导', '信源仅陈述单一动作，未披露上下游合同与转嫁细节，不做无依据推测');
assert('长鑫存储利益链传导针对存储晶圆扩产与存储颗粒验证', cxmtTrans.transmission.includes('存储晶圆厂扩产') && cxmtTrans.transmission.includes('存储颗粒'));

// 3.2 中芯国际 (Foundry) -> 【晶圆代工产能重构与资本支持】
const smicTakeaway = autoCorrectTakeaway(undefined, '中芯国际科创板首发上市挂牌交易', undefined, 'apac_tech');
assert('中芯国际定性为晶圆代工产能重构', smicTakeaway.takeaway.includes('【晶圆代工产能重构与资本支持】'));
const smicTrans = autoCorrectInterestTransmission('中芯国际科创板首发上市挂牌交易', '信源仅陈述单一动作');
assert('中芯国际利益链针对晶圆代生产线建设与代工产能', smicTrans.transmission.includes('晶圆代生产线建设') && smicTrans.transmission.includes('代工产能保障'));

// 3.3 北方华创 (Equipment) -> 【半导体关键设备国产化加速】
const nauraTakeaway = autoCorrectTakeaway(undefined, '北方华创完成定增融资扩大产能上市', undefined, 'apac_tech');
assert('北方华创定性为半导体关键设备国产化加速', nauraTakeaway.takeaway.includes('【半导体关键设备国产化加速】'));

// ─────────────────────────────────────────────────────────────
// 测试 4: 利益链传导彻底根除机械免责套话 (Eradicate Mechanical Disclaimer)
// ─────────────────────────────────────────────────────────────
console.log('\n--- 4. 利益链传导去机械免责套话测试 ---');
const evasiveDisclaimer = '信源仅陈述单一动作，未披露上下游合同与转嫁细节，不做无依据推测';
const healedTransmission = autoCorrectInterestTransmission(userHeadline, evasiveDisclaimer, healedTakeaway.takeaway);
console.log('   自愈后利益链传导:', healedTransmission.transmission);
assert('彻底清除机械免责套话', !healedTransmission.transmission.includes('信源仅陈述单一动作'));
assert('生成符合 1-Hop 规范的产业传导链条', /①.*➔.*②.*➔.*③/.test(healedTransmission.transmission));
assert('传导链紧扣芯片研发、流片与云厂商采购', healedTransmission.transmission.includes('研发与流片开支') && healedTransmission.transmission.includes('云厂商'));

// ─────────────────────────────────────────────────────────────
// 测试 5: 全量 NewsItem 自愈流水线端到端验证（包含已有段落注智）
// ─────────────────────────────────────────────────────────────
console.log('\n--- 5. NewsItem 全流程自愈流水线测试 ---');
const rawMockItem = {
  id: 'test-suiyuan-ipo',
  track: 'apac_tech',
  title: userHeadline,
  source: '财联社',
  sourceUrl: 'https://www.cls.cn',
  publishedAt: '2026年9月11日 09:35',
  impactLevel: 1,
  oneLineTakeaway: verbatimTakeaway, // 恶意注入标题复读
  transmissionImpact: evasiveDisclaimer, // 恶意注入机械套话
  summaryParagraph: '据09:35（财联社）电讯，AI芯片公司燧原上市开盘涨188% 市值约1700亿元。',
  bulletPoints: [userHeadline + '。'],
};

const processedItem = autoCorrectNewsItem(rawMockItem);
assert('NewsItem 挂载 companyProfile 成功', processedItem.companyProfile?.name === '燧原科技');
assert('NewsItem 核心结论已纠偏', processedItem.oneLineTakeaway.includes('【国产算力资本化重估】'));
assert('NewsItem 利益链已纠偏为 1-Hop 真实逻辑', !processedItem.transmissionImpact.includes('信源仅陈述单一动作'));
assert('NewsItem 事实通报融入企业业务定位', processedItem.summaryParagraph?.includes('燧原科技') && processedItem.summaryParagraph?.includes('云端AI'));
console.log('   生成的连贯客观事实通报:', processedItem.summaryParagraph);

// ─────────────────────────────────────────────────────────────
// 测试 6: 重点半导体与前沿科技主体全覆盖测试
// ─────────────────────────────────────────────────────────────
console.log('\n--- 6. 重点半导体/科技主体覆盖测试 ---');
const keyEntities = [
  { text: '沐曦发布千亿参数大模型训推一体卡', expectedName: '沐曦集成电路' },
  { text: '摩尔线程启动万卡智算集群适配', expectedName: '摩尔线程' },
  { text: '长鑫存储先进制程DDR5颗粒实现量产交付', expectedName: '长鑫存储' },
  { text: '中芯国际上海临港先进制程晶圆厂产能利用率爬坡', expectedName: '中芯国际' },
  { text: '壁仞科技通用GPU获国内头部超算采购', expectedName: '壁仞科技' },
  { text: '寒武纪最新思元加速卡亮相智博会', expectedName: '寒武纪' },
  { text: '澜起科技DDR5接口芯片出货量翻倍', expectedName: '澜起科技' },
  { text: '龙芯中科新一代LoongArch架构微处理器发布', expectedName: '龙芯中科' },
  { text: '台积电2nm先进制程晶圆代工报价上调', expectedName: '台积电' },
  { text: 'ASML向主要晶圆厂交付高数值孔径EUV光刻机', expectedName: 'ASML' },
  { text: 'OpenAI发布GPT-5多模态大模型', expectedName: 'OpenAI' },
  { text: '苹果完成首批M4芯片采购协议签署', expectedName: '苹果' },
  { text: '英特尔量产新一代服务器处理器', expectedName: '英特尔' },
  { text: '高通发布骁龙8至尊版移动平台', expectedName: '高通' },
  { text: '博通推出新一代AI交换机芯片', expectedName: '博通' },
  { text: '地平线正式递交港股IPO上市申请', expectedName: '地平线' },
  { text: '昆仑芯完成新一代AI智算集群交付', expectedName: '昆仑芯' },
];

keyEntities.forEach(({ text, expectedName }) => {
  const p = getCompanyProfileForNews(text);
  assert(`匹配主体: ${expectedName}`, p !== null && p.name === expectedName, `(实际得到: ${p?.name})`);
});

// ─────────────────────────────────────────────────────────────
// 测试 7: 政府机构、行政公文、通用产品等严格负向排除测试
// ─────────────────────────────────────────────────────────────
console.log('\n--- 7. 政府机构/公文/产品排除负向门禁测试 ---');
const shouldBeExcluded = [
  '国家统计局发布8月份国民经济运行情况',
  '新一代人形机器人发布，多项指标超越同类产品',
  '多款国产创新药获批上市',
  '首款纯血鸿蒙应用正式发布',
  '应急管理部派出工作组指导救灾',
  '工信部完成5G基站摸底',
  '海关总署发布前8个月进出口总值',
  '教育部发布关于做好2027届高校毕业生就业工作的通知',
  '北京市公安局发布道路安全提示',
  '交通运输部完成抗洪抢险调度',
  '最高人民法院发布一批指导性案例',
  '财政部完成增发特别国债首次招投标',
  '美联储完成半年度金融稳定评估',
  '吉隆口岸泥石流灾害处置正在进行',
];

shouldBeExcluded.forEach((text) => {
  const p = getCompanyProfileForNews(text);
  assert(`非企业排除门禁: [${text}]`, p === null, `(误识别为: ${p?.name})`);
});

// ─────────────────────────────────────────────────────────────
// 测试 8: 未收录企业的动态背景推断与合成
// ─────────────────────────────────────────────────────────────
console.log('\n--- 8. 未收录企业的动态背景合成测试 ---');
const dynamicText = 'AI芯片公司瀚博半导体完成新一轮数亿元融资';
const dynamicProfile = getCompanyProfileForNews(dynamicText);
assert('动态推断未收录企业主体名', dynamicProfile !== null && (dynamicProfile.name.includes('瀚博') || dynamicProfile.name.includes('半导体')));
assert('动态合成芯片半导体赛道定位', dynamicProfile && dynamicProfile.sector.includes('芯片与半导体'));
console.log('   动态合成结果:', dynamicProfile);

console.log('===========================================================');
if (testFailures === 0) {
  console.log('🎉 所有深度自愈与主体知识图谱测试 100% 全部通过！');
} else {
  console.error(`💥 测试出现 ${testFailures} 处失败！`);
  process.exit(1);
}
