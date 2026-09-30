import { NewsItem, FlashBrief, MarketQuote, Summary5W1H } from './types';
import { getFastIntelSnapshot, verify_fact_faithfulness, fallback_to_grounded_summary } from './rssFetcher';
import { autoCorrectNewsItem, autoCorrectAllNews } from './selfHealingEngine';

export { verify_fact_faithfulness, fallback_to_grounded_summary };

export interface VerificationItemResult {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  track: string;
  titleOk: boolean;
  titleCompletenessOk: boolean; // 题目是否完整 (无截断、无冒号体、主谓宾齐全、字数适中)
  detailClarityOk: boolean;     // 报道详情是否清晰 (事实通报有头有尾、5W1H闭环、结论专业、利益链清晰)
  sourceOk: boolean;
  summary5W1HOk: boolean;
  hasDomainQualifier: boolean;
  status: 'PASS' | 'WARNING' | 'FAIL';
  reasons: string[];
  oneLineTakeaway?: string;
  summaryParagraph?: string;
  summary5W1H?: Summary5W1H;
  transmissionImpact?: string;
}

export interface VerificationAuditReport {
  verifiedAt: string;
  verifiedAtLocal: string;
  totalNewsChecked: number;
  totalFlashChecked: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  accuracyScore: number; // 0 - 100
  passRate: string;      // e.g. "100.0%"
  titleCompletenessRate: string; // 题目完整率 e.g. "100.0%"
  titleCompletenessPassed: number;
  detailClarityRate: string;     // 报道详情清晰率 e.g. "100.0%"
  detailClarityPassed: number;
  overallStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
  quoteChecks: {
    symbol: string;
    price: string;
    valid: boolean;
  }[];
  details: VerificationItemResult[];
}

// 权威合法信源白名单基线（接入严肃中立华文雷达：联合早报、财新网、路透中文、彭博中国、劳氏日报、国家电网等）
const KNOWN_AUTHORITIES = [
  // 国际四大通讯社与顶级主流财经智库
  '彭博', 'bloomberg', '路透', 'reuters', '华尔街日报', 'wsj', '日经', 'nikkei',
  '财新', 'caixin', '联合早报', 'zaobao', '第一财经', 'yicai', '经济学人', 'economist', '金融时报', 'ft',
  '美联社', 'ap', '标普', 's&p', '半岛电视台', 'al jazeera', '塔斯社', 'tass', '新华社', 'xinhua',
  // 专业权威行业与航运智库（劳氏日报为全球最权威海事航运情报中心）
  '劳氏日报', '劳氏', 'lloyd', 'lloyds', '波罗的海', 'baltic', '克拉克森', 'clarksons',
  '普氏', 'platts', '标普全球', 's&p global',
  // 关键基础设施与主权电网机构（如乌克兰国家电网、国家电网等）
  '国家电网', '南方电网', '乌克兰国家电网', 'ukrenergo', '能源局', 'nea',
  // 权威政府部委、监管决策机构与国际组织
  '交通运输部', '财政部', '发改委', '住建部', '民政部', '应急管理部', '人民银行', '央行', 'pboc',
  '美联储', 'fomc', 'fed', '国防部', 'dod', '国资委', '国家部委', '部委', '公报', '政府', '统计局', '商务部', '海关总署', '海事局', '港交所',
  'opec', 'iea', 'eia', 'iaea', 'who', 'imf', 'world bank', '中东防务'
];

export async function runNewsAccuracyVerification(
  providedNews?: NewsItem[],
  providedFlash?: FlashBrief[],
  providedQuotes?: MarketQuote[]
): Promise<VerificationAuditReport> {
  const startMs = Date.now();

  // 极速内存快照：0 网络 I/O 耗时，彻底根除高频网络重拉引发的超时与卡顿
  let newsList = providedNews;
  let flashList = providedFlash;
  let quotes = providedQuotes;

  if (!newsList || !flashList || !quotes) {
    const snapshot = getFastIntelSnapshot();
    if (!newsList) newsList = snapshot.news;
    if (!flashList) flashList = snapshot.flash;
    if (!quotes) quotes = snapshot.quotes;
  }

  // 全域新闻与速递在核验前统一执行自动纠偏流水线
  const healed = autoCorrectAllNews(newsList, flashList);
  newsList = healed.news;
  flashList = healed.flashBriefs;

  const details: VerificationItemResult[] = [];
  let passedCount = 0;
  let warningCount = 0;
  let failedCount = 0;
  let titleCompletenessPassed = 0;
  let detailClarityPassed = 0;

  for (const item of newsList) {
    const reasons: string[] = [];
    let titleOk = true;
    let titleCompletenessOk = true;
    let detailClarityOk = true;
    let sourceOk = true;
    let summary5W1HOk = true;
    let hasDomainQualifier = true;

    // 1. 题目是否完整核验 (Title Completeness)
    // 门禁红线：长度8~45字、严禁冒号体、严禁感叹号/问号/省略号、严禁连词或悬挂截断、无主语流水账、无吹捧套话
    if (!item.title || item.title.length < 8) {
      titleOk = false;
      titleCompletenessOk = false;
      reasons.push('题目过短或为空，缺乏基本事件要素');
    } else if (item.title.length > 45) {
      titleCompletenessOk = false;
      reasons.push('题目过长，可能将详情正文误作标题');
    }

    if (/[：:]/.test(item.title)) {
      titleOk = false;
      titleCompletenessOk = false;
      reasons.push('题目违规包含冒号体');
    }

    if (/[！!？?]|……|\.{3}/.test(item.title)) {
      titleOk = false;
      titleCompletenessOk = false;
      reasons.push('题目违规包含感叹号、问号或省略号');
    }

    // 门禁：题目末尾严禁存在悬挂使役/及物动词或残缺连词（如“迫使”、“导致”、“使得”、“拟”、“至”等缺少宾语）
    const DANGLING_TAIL_REGEX = /(?:迫使|致使|造成|促使|导致|使得|逼迫|驱使|要求|呼吁|警告|敦促|声称|指出|强调|重申|表明|宣布|预测|预计|计划|拟|考虑|面临|面临须|斥资|拟动用|拟以|突破|至|报|达|创|收于|位于|处于|跌至|涨至|升至|降至|纳入|列入|涵盖|引发|推动|加速|推进|进入|启动|成为|陷入|正在|或将|将|须|在|于|向|从|对|采取|出台|制定|实施|开展|进行|落实|执行|寻求|谋求|要求采取|并|与|等|及|但|而|或者|以及)\s*(\.{2,3})?$/;
    if (DANGLING_TAIL_REGEX.test(item.title)) {
      titleOk = false;
      titleCompletenessOk = false;
      reasons.push('题目末尾存在悬挂使役/及物动词或虚词截断，缺少宾语');
    }

    if (/^(?:分别|持续)?(?:涨|跌|高开|低开|报)\s*\d/.test(item.title)) {
      titleOk = false;
      titleCompletenessOk = false;
      reasons.push('题目缺少核心涉案主体，属于无主语分时流水账');
    }

    if (/领导高度重视|迅速启动预案|众志成城|坚决贯彻|牢牢把握|深入推进|统一思想|遥遥领先|彻底打破垄断|世界首创/.test(item.title)) {
      titleOk = false;
      titleCompletenessOk = false;
      reasons.push('题目包含未经脱水的宣传套话或自媒体夸大词汇');
    }

    // 2. 报道详情是否清晰核验 (Detail Clarity)
    // 核心标准：事实通报有头有尾(≥35字)、5W1H要素闭环(Who/What具体明确)、核心结论提炼专业(去口水化)、因果利益链逻辑严密(标准1-Hop)、语义拒绝张冠李戴
    const p = (item.summaryParagraph || '').trim();
    if (!p || p.length < 35) {
      detailClarityOk = false;
      reasons.push('报道详情事实通报篇幅过短或缺失，信息量不足');
    } else if (/[：:,，、\s]$/.test(p)) {
      detailClarityOk = false;
      reasons.push('报道详情末尾存在残句或悬空标点截断');
    }

    // 门禁：报道详情末尾与句内严禁存在及物动词截断（如“要求采取。”）
    const DANGLING_PERIOD_REGEX = /(?:要求采取|促使|导致|出台|制定|实施|推进|纳入|引发|采取|开展|进行|启动|落实|执行|寻求|谋求)[。！？!?]$/;
    if (DANGLING_PERIOD_REGEX.test(p)) {
      detailClarityOk = false;
      reasons.push('报道详情末尾存在及物动词截断（如“要求采取。”），缺少宾语');
    }
    const DANGLING_INNER_REGEX = /(?:要求采取|促使|导致|出台|制定|实施|推进|纳入|引发)[。！？!?]/;
    if (DANGLING_INNER_REGEX.test(p)) {
      detailClarityOk = false;
      reasons.push('报道详情语句中存在及物动词截断（缺少宾语直接打句号）');
    }

    // 门禁：报道详情严禁生硬复读“电讯，人名：”冒号直接引语
    if (/电讯[，,]\s*[^：:，,——\s\n]{2,12}[：:]/.test(p)) {
      detailClarityOk = false;
      reasons.push('报道详情违规包含冒号直接引语（应转述为自然间接引语）');
    }

    // 门禁：报道详情严禁硬拼八股“直接影响方面，促使...”无主语病句
    if (/直接影响方面[，,]\s*(?:促使|导致|造成|引发|使得|推动|致使)/.test(p)) {
      detailClarityOk = false;
      reasons.push('报道详情违规包含“直接影响方面，促使”无主语病句模板');
    }

    // 门禁：报道详情严禁介词堆叠“起因于旨在/起因于主要系”
    if (/起因于\s*(?:旨在|主要系|主要因|出于|为缓解|为应对|因为|由于)/.test(p)) {
      detailClarityOk = false;
      reasons.push('报道详情违规包含“起因于旨在/主要系”介词堆叠病句');
    }

    if (/信源仅陈述单一动作|未披露上下游合同与转嫁细节|不做无依据推测|涉事当事方正推进处置|使得市场面临现实痛点|造成的困境，并避免越陷越深/.test(p + ' ' + (item.oneLineTakeaway || ''))) {
      detailClarityOk = false;
      reasons.push('报道详情存在机械敷衍免责套话');
    }

    const takeaway = (item.oneLineTakeaway || '').trim();
    if (!takeaway || takeaway.length < 10) {
      detailClarityOk = false;
      reasons.push('报道核心结论缺失或过短');
    } else if (!/^【.+?】[：:]/.test(takeaway)) {
      detailClarityOk = false;
      reasons.push('报道核心结论缺少规范专业领域标签');
    }

    const transmission = (item.transmissionImpact || '').trim();
    if (!transmission || transmission.length < 20) {
      detailClarityOk = false;
      reasons.push('报道因果利益链传导缺失或过于简略');
    } else if (!transmission.includes('➔') && !transmission.includes('->')) {
      detailClarityOk = false;
      reasons.push('报道因果传导缺乏明确的1-Hop递进链路');
    }

    // 1.1 事实一致性审查门禁核验
    const faithfulness = verify_fact_faithfulness(item.summaryParagraph || item.title, {
      title: item.title,
      core_conclusion: item.oneLineTakeaway || '',
      transmission_chain: item.transmissionImpact || '',
    });
    if (!faithfulness.pass) {
      detailClarityOk = false;
      reasons.push(`事实一致性审查未通过: ${faithfulness.reason}`);
    }

    // 1.2 语义防串味与事实张冠李戴严格核验 (Anti-Hallucination Semantic Cross-Check)
    const titleLower = item.title.toLowerCase();
    const takeawayLower = (item.oneLineTakeaway || '').toLowerCase();
    const isLaborEmploymentNews = /就业|转行|失业|劳动力|岗位替代|裁员|用工|雇佣|技能再培训|白领|劳动者|员工/.test(titleLower) || (/麦肯锡/.test(titleLower) && /迫使|转行|就业/.test(titleLower));
    if (isLaborEmploymentNews && /算力架构|智算集群|互联拓扑|长思考思维链|芯片代工|晶圆/.test(takeawayLower)) {
      detailClarityOk = false;
      reasons.push('报道核心结论与标题议题存在张冠李戴（将就业转行议题误套用AI算力架构模板）');
    }

    const isFoodSafetyNews = /餐饮|外卖|食品安全|外卖封签|餐饮店|后厨/.test(titleLower);
    if (isFoodSafetyNews && /医保|集采|药品集采|公立医院|医保局/.test(takeawayLower)) {
      detailClarityOk = false;
      reasons.push('报道核心结论与标题议题存在张冠李戴（将餐饮食品安全议题误套用医保集采模板）');
    }

    const isTariffTradeNews = /中美.*(?:降税|关税|清单|经贸磋商)|关税|对等降税/.test(titleLower);
    if (isTariffTradeNews && /算力架构|智算集群|芯片代工/.test(takeawayLower)) {
      detailClarityOk = false;
      reasons.push('报道核心结论与标题议题存在张冠李戴（将关税经贸议题误套用算力架构模板）');
    }

    const isDefenseWarNews = /空袭|导弹|防务|以军|俄乌|拦截|战区/.test(titleLower) && !/澳洲|央行|加息|降息/.test(titleLower);
    if (isDefenseWarNews && /澳洲联储|货币政策|降息预期|基准利率/.test(takeawayLower)) {
      detailClarityOk = false;
      reasons.push('报道核心结论与标题议题存在张冠李戴（将战局防务议题误套用澳洲央行利率模板）');
    }

    // 3. 一级权威信源与真实可访问 URL 核验
    const sourceLower = (item.source || '').toLowerCase();
    const isKnownAuthority = KNOWN_AUTHORITIES.some(a => sourceLower.includes(a));
    if (!item.source || item.source.length < 2) {
      sourceOk = false;
      reasons.push('缺少信源声明');
    } else if (!isKnownAuthority) {
      reasons.push(`非常规一级信源: ${item.source}`);
    }

    if (!item.sourceUrl || !item.sourceUrl.startsWith('http')) {
      sourceOk = false;
      reasons.push('信源直达链接无效或缺失');
    }

    // 4. 5W1H 六要素深度小结完整性与实质性核验
    const s = item.summary5W1H;
    if (!s) {
      summary5W1HOk = false;
      detailClarityOk = false;
      reasons.push('缺少5W1H结构化要素小结');
    } else {
      if (!s.who || s.who.length < 2) {
        summary5W1HOk = false;
        detailClarityOk = false;
        reasons.push('5W1H主体(Who)不明确');
      }
      if (!s.what || s.what.length < 8) {
        summary5W1HOk = false;
        detailClarityOk = false;
        reasons.push('5W1H事件具体事实(What)过短或缺失');
      }
      if ((!s.why || s.why.length < 4) && (!s.consequence || s.consequence.length < 4)) {
        summary5W1HOk = false;
        detailClarityOk = false;
        reasons.push('5W1H起因背景与决策后果均缺失');
      }
    }

    // 5. 专有名词是否带有专业释义（针对如“曦云C600”、“B200”等特殊芯片或代码）
    if (/c600|c700|b200|gaudi/.test(item.title.toLowerCase()) && !/gpu|芯片|算力/.test(item.title.toLowerCase() + ' ' + (item.summaryParagraph || ''))) {
      hasDomainQualifier = false;
      reasons.push('技术缩写缺少通俗领域解释');
    }

    // 统计专项合格指标
    if (titleCompletenessOk) titleCompletenessPassed++;
    if (detailClarityOk) detailClarityPassed++;

    // 综合评级
    let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (!titleOk || !sourceOk || !summary5W1HOk || !titleCompletenessOk || !detailClarityOk) {
      status = reasons.length > 2 ? 'FAIL' : 'WARNING';
    } else if (reasons.length > 0) {
      status = 'WARNING';
    }

    if (status === 'PASS') passedCount++;
    else if (status === 'WARNING') warningCount++;
    else failedCount++;

    details.push({
      id: item.id,
      title: item.title,
      source: item.source,
      sourceUrl: item.sourceUrl,
      track: item.track,
      titleOk,
      titleCompletenessOk,
      detailClarityOk,
      sourceOk,
      summary5W1HOk,
      hasDomainQualifier,
      status,
      reasons,
      oneLineTakeaway: item.oneLineTakeaway,
      summaryParagraph: item.summaryParagraph,
      summary5W1H: item.summary5W1H,
      transmissionImpact: item.transmissionImpact,
    });
  }

  // 1.3 今日决策速递 (Flash Briefs) 题目完整度与详情清晰度同步严格核验
  for (const flash of flashList) {
    const reasons: string[] = [];
    let titleOk = true;
    let titleCompletenessOk = true;
    let detailClarityOk = true;
    const titleText = (flash.content || '').trim();

    if (!titleText || titleText.length < 8) {
      titleOk = false;
      titleCompletenessOk = false;
      reasons.push('速递题目过短或为空');
    } else if (titleText.length > 50) {
      titleCompletenessOk = false;
      reasons.push('速递题目过长');
    }

    const DANGLING_TAIL_REGEX = /(?:迫使|致使|造成|促使|导致|使得|逼迫|驱使|要求|呼吁|警告|敦促|声称|指出|强调|重申|表明|宣布|预测|预计|计划|拟|考虑|面临|面临须|斥资|拟动用|拟以|突破|至|报|达|创|收于|位于|处于|跌至|涨至|升至|降至|纳入|列入|涵盖|引发|推动|加速|推进|进入|启动|成为|陷入|正在|或将|将|须|在|于|向|从|对|并|与|等|及|但|而|或者|以及)\s*(\.{2,3})?$/;
    if (DANGLING_TAIL_REGEX.test(titleText)) {
      titleOk = false;
      titleCompletenessOk = false;
      reasons.push('速递题目末尾存在悬挂使役/及物动词或虚词截断，缺少宾语');
    }

    const takeaway = (flash.oneLineTakeaway || '').trim();
    if (takeaway && !/^【.+?】[：:]/.test(takeaway)) {
      detailClarityOk = false;
      reasons.push('速递核心结论缺少规范专业领域标签');
    }

    const flashTitleLower = titleText.toLowerCase();
    const flashTakeawayLower = takeaway.toLowerCase();
    if (
      (/就业|转行|失业|劳动力|岗位替代|裁员|用工|雇佣|技能再培训|白领|劳动者|员工/.test(flashTitleLower) ||
        (/麦肯锡/.test(flashTitleLower) && /迫使|转行|就业/.test(flashTitleLower))) &&
      /算力架构|智算集群|互联拓扑|长思考思维链|芯片代工|晶圆/.test(flashTakeawayLower)
    ) {
      detailClarityOk = false;
      reasons.push('速递核心结论与标题议题存在张冠李戴（将就业转行议题误套用AI算力架构模板）');
    }

    if (titleCompletenessOk) titleCompletenessPassed++;
    if (detailClarityOk) detailClarityPassed++;

    let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (!titleOk || !titleCompletenessOk || !detailClarityOk) {
      status = reasons.length > 1 ? 'FAIL' : 'WARNING';
    } else if (reasons.length > 0) {
      status = 'WARNING';
    }

    if (status === 'PASS') passedCount++;
    else if (status === 'WARNING') warningCount++;
    else failedCount++;

    details.push({
      id: flash.id,
      title: `[速递] ${titleText}`,
      source: flash.source,
      sourceUrl: flash.sourceUrl || '',
      track: flash.track,
      titleOk,
      titleCompletenessOk,
      detailClarityOk,
      sourceOk: true,
      summary5W1HOk: true,
      hasDomainQualifier: true,
      status,
      reasons,
      oneLineTakeaway: flash.oneLineTakeaway,
      summaryParagraph: flash.summaryParagraph,
      summary5W1H: flash.summary5W1H,
      transmissionImpact: flash.transmission,
    });
  }

  // 6. 核心行情数据合理性与实时性交叉核验（严格防范纳指100与纳指综合混淆）
  const quoteChecks = quotes.map(q => {
    let valid = true;
    const num = parseFloat(q.price.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) valid = false;
    // 纳斯达克100指数应在 20,000 ~ 45,000 区间，严防与纳指综合(20,000~35,000区间)混淆
    if (q.symbol.includes('纳斯达克100') && (num < 20000 || num > 45000)) valid = false;
    if (q.symbol.includes('纳斯达克综合') && (num < 18000 || num > 40000)) valid = false;
    if (q.symbol.includes('标普500') && (num < 5000 || num > 12000)) valid = false;
    if (q.symbol.includes('道琼斯') && (num < 30000 || num > 75000)) valid = false;
    if (q.symbol.includes('费城半导体') && (num < 7000 || num > 20000)) valid = false;
    if (q.symbol.includes('日经') && (num < 40000 || num > 90000)) valid = false;
    if (q.symbol.includes('恒生') && (num < 15000 || num > 40000)) valid = false;
    if (q.symbol.includes('美债') && (num < 1.5 || num > 8.0)) valid = false;
    if ((q.symbol.includes('油') || q.symbol.includes('原油')) && (num < 25 || num > 220)) valid = false;
    if (q.symbol.includes('黄金') && (num < 2000 || num > 6500)) valid = false;
    if (q.symbol.includes('日元') && (num < 90 || num > 220)) valid = false;
    if (q.symbol.includes('人民币') && (num < 5.0 || num > 9.5)) valid = false;

    return {
      symbol: q.symbol,
      price: q.price,
      valid,
    };
  });

  const total = newsList.length + flashList.length;
  const accuracyScore = total > 0 ? Math.round(((passedCount + warningCount * 0.8) / total) * 100) : 100;
  const passRate = total > 0 ? ((passedCount / total) * 100).toFixed(1) + '%' : '100.0%';
  const titleCompletenessRate = total > 0 ? ((titleCompletenessPassed / total) * 100).toFixed(1) + '%' : '100.0%';
  const detailClarityRate = total > 0 ? ((detailClarityPassed / total) * 100).toFixed(1) + '%' : '100.0%';
  const overallStatus = accuracyScore >= 95 ? 'EXCELLENT' : accuracyScore >= 80 ? 'GOOD' : 'NEEDS_ATTENTION';

  const report: VerificationAuditReport = {
    verifiedAt: new Date().toISOString(),
    verifiedAtLocal: new Date().toLocaleString('zh-CN', { hour12: false }),
    totalNewsChecked: newsList.length,
    totalFlashChecked: flashList.length,
    passedCount,
    warningCount,
    failedCount,
    accuracyScore,
    passRate,
    titleCompletenessRate,
    titleCompletenessPassed,
    detailClarityRate,
    detailClarityPassed,
    overallStatus,
    quoteChecks,
    details,
  };

  const elapsedMs = Date.now() - startMs;
  // 打印巡检日志（兼容 Edge Runtime）
  console.log(`[${report.verifiedAtLocal}] 15分钟自动化核验完成 (耗时: ${elapsedMs}ms) | 得分: ${accuracyScore}/100 | 合格率: ${passRate} | 总条数: ${total} | 状态: ${overallStatus}`);

  return report;
}

let lastVerificationReport: VerificationAuditReport | null = null;
let lastVerificationTime = 0;
const VERIFY_INTERVAL_MS = 15 * 60 * 1000; // 15分钟自动化核验周期

export async function getOrRunNewsVerification(force = false): Promise<VerificationAuditReport> {
  const now = Date.now();
  if (!force && lastVerificationReport && (now - lastVerificationTime < VERIFY_INTERVAL_MS)) {
    return lastVerificationReport;
  }
  lastVerificationReport = await runNewsAccuracyVerification();
  lastVerificationTime = now;
  return lastVerificationReport;
}
