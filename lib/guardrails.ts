import { TrackId, PrimarySourceInfo } from './types';

// =========================================================================
// 【硬核实体词互斥与内容一致性门禁引擎 (Deterministic Guardrails Engine)】
// 物理拦截任何“跨国串味杂交”事故，一票否决违规归类与虚假信源
// =========================================================================

// 1. 外国主权与核心实体词（与中国国内板块物理绝对互斥）
export const FOREIGN_ENTITIES = {
  JAPAN: /日本|日元|日银|东证|财务省|财务大臣|加藤胜信|植田和男|岸田|石破茂|东京|日经225|丰田|索尼|软银/,
  AUSTRALIA: /澳洲|澳大利亚|澳联储|澳洲联储|rba|hunter|布洛克|澳元|悉尼/i,
  EUROPE_ECB: /欧洲央行|欧央行|拉加德|ecb|欧元区|欧元/i,
  UK_BOE: /英国央行|英央行|贝利|boe|英格兰银行|英镑/i,
  US_MACRO: /美联储|沃什|凯文·沃什|warsh|鲍威尔|美债|美国国债|耶伦|美国财政部|华尔街|纳斯达克|道琼斯|标普500|非农|初请|失业金|美股三大|fomc|(?:白宫|美国总统).*(?:预算|法案|关税|财政|赤字|行政令|经济顾问|债务上限|贸易|制裁|通胀|芯片)/i,
  WAR_DEFENSE: /五角大楼|防卫省|以军|俄军|乌军|克里姆林宫|北约|泽连斯基|普京|内塔尼亚胡|哈马斯|真主党|黎巴嫩|加沙|也门胡塞|霍尔木兹/i,
};

// 2. 中国国内专属治理与宏观词汇（用于串味污染检测）
export const DOMESTIC_CHINA_EXCLUSIVE = /中国|我国|国内|国债|特别国债|超长期特别国债|内需|逆周期|中央财政|地方债|隐性债务|化债|地方财政|财政部|国家发改委|发改委|中纪委|国家监委|最高法|最高检|公安部|国家医保局|国家应急管理部|证监会|央行降准|央行逆回购/;

// 3. 中国官方机构信源名单（严禁任何外国实体报道使用）
export const CHINESE_OFFICIAL_SOURCE_REGEX = /中国财政部|中国人民银行|国家发展改革委|国家住房和城乡建设部|国家应急管理部|国资监管委员会|中国交通运输部|最高法|最高检|中纪委/;

export interface GuardrailPreCheckResult {
  passed: boolean;
  correctedTrack: TrackId;
  correctedSource: { source: string; sourceUrl: string };
  isInterceptionTriggered: boolean;
  interceptionReason?: string;
}

/**
 * 规则 A：国家实体互斥拦截门禁 (Rule A: Country Entity Mutex Guardrail)
 * 在归类与信源分配时执行代码级强校验：
 * 凡包含日本、美联储、美债、五角大楼等外国主权实体的报道：
 * 1. 一票否决国内赛道 (china_domestic)，物理强制纠偏至 apac_tech / us_macro / war_conflict；
 * 2. 物理禁止打上“中国财政部”、“中国人民银行”等中国官方信源标签，强制继承原爬虫信源或对应国家权威信源。
 */
export function enforceCountryEntityGuardrails(
  title: string,
  content: string,
  currentTrack: TrackId,
  currentSource: { source: string; sourceUrl: string },
  inheritedRawSource?: string
): GuardrailPreCheckResult {
  const text = (title + ' ' + content).toLowerCase();

  let correctedSource = { ...currentSource };
  let isInterceptionTriggered = false;
  let interceptionReason = '';

  // 赛道分类已由 classifyTrack() 唯一权威执行，此处只做信源标签纠偏：
  // 外国实体报道不能挂中国官方信源标签

  if (FOREIGN_ENTITIES.JAPAN.test(text)) {
    if (CHINESE_OFFICIAL_SOURCE_REGEX.test(correctedSource.source) || correctedSource.source.includes('中国')) {
      correctedSource = {
        source: inheritedRawSource && !CHINESE_OFFICIAL_SOURCE_REGEX.test(inheritedRawSource) ? inheritedRawSource : '日经亚洲 Nikkei Asia',
        sourceUrl: 'https://asia.nikkei.com',
      };
      isInterceptionTriggered = true;
      interceptionReason = '物理剥离虚假中国官方信源，拨正为日经亚洲/海外电讯';
    }
  } else if (FOREIGN_ENTITIES.US_MACRO.test(text) && !/涉华|对华|中美博弈/.test(text)) {
    if (CHINESE_OFFICIAL_SOURCE_REGEX.test(correctedSource.source)) {
      correctedSource = {
        source: '华尔街日报 WSJ Markets',
        sourceUrl: 'https://www.wsj.com',
      };
      isInterceptionTriggered = true;
      interceptionReason = '物理剥离虚假中国官方信源，拨正为华尔街日报';
    }
  } else if (FOREIGN_ENTITIES.WAR_DEFENSE.test(text)) {
    if (CHINESE_OFFICIAL_SOURCE_REGEX.test(correctedSource.source)) {
      correctedSource = {
        source: '路透社防务专电 Reuters Defense',
        sourceUrl: 'https://www.reuters.com',
      };
      isInterceptionTriggered = true;
      interceptionReason = '物理剥离虚假中国官方信源，拨正为路透社防务';
    }
  }

  return {
    passed: true,
    correctedTrack: currentTrack, // 不再覆写赛道
    correctedSource,
    isInterceptionTriggered,
    interceptionReason: interceptionReason || undefined,
  };
}

export interface ConsistencyCheckResult {
  isClean: boolean;
  contaminationScore: number;
  reason?: string;
}

/**
 * 规则 B：内容一致性自检与串味污染熔断器 (Rule B: Content Consistency Circuit Breaker)
 * 在后端写入前，对比标题核心实体与小结/核心结论/市场传导的内容一致性：
 * 如果标题包含“日本”，而内容充斥“中国、国债、内需、逆周期”，判定为严重串味污染，
 * 强制熔断拦截打回丢弃，严禁展示到前端！
 */
export function checkCrossContamination(
  title: string,
  takeaway: string,
  transmission: string,
  summary: string
): ConsistencyCheckResult {
  const titleText = title.toLowerCase();
  const bodyText = (takeaway + ' ' + transmission + ' ' + summary).toLowerCase();

  // 1. 检测日本实体与中国内需财政的串味
  if (FOREIGN_ENTITIES.JAPAN.test(titleText)) {
    // 统计中国特有宏观词频次
    const matches = bodyText.match(/中国|国债|超长期特别国债|内需|逆周期|地方债|化债|中央财政|地方政府专项债/g) || [];
    if (matches.length >= 1) {
      return {
        isClean: false,
        contaminationScore: matches.length,
        reason: `严重跨国串味：标题属于日本实体，但小结/结论出现国内词汇【${matches.join(', ')}】，已触发物理熔断拦截！`,
      };
    }
  }

  // 2. 检测美联储/美债实体与中国财政的串味
  if (FOREIGN_ENTITIES.US_MACRO.test(titleText) && !/对华|涉华|中美/.test(titleText)) {
    const matches = bodyText.match(/中国财政部|特别国债|稳实体扩内需|地方债务置换/g) || [];
    if (matches.length >= 1) {
      return {
        isClean: false,
        contaminationScore: matches.length,
        reason: `严重跨国串味：标题属于美国宏观实体，但内容出现中国财政词汇【${matches.join(', ')}】，已触发物理熔断拦截！`,
      };
    }
  }

  // 3. 检测国内要闻赛道被国外央行/政治实体污染
  if (/反腐|中纪委|吉隆口岸|重特大事故|中央财政|地方债/.test(titleText)) {
    const foreignMatches = bodyText.match(/日元加息|植田和男|沃什降息|鲍威尔降息|美联储议息/g) || [];
    if (foreignMatches.length >= 1) {
      return {
        isClean: false,
        contaminationScore: foreignMatches.length,
        reason: `严重跨国串味：标题属于国内专属事件，但内容出现海外实体【${foreignMatches.join(', ')}】，已触发物理熔断拦截！`,
      };
    }
  }

  // 4. 规则 C：【标题与小结实体一致性校验网关】(嗅探 A股大盘 vs 北美变压器缺电机房 等错位张冠李戴)
  const entityConsistency = validateTitleSummaryEntityConsistency(title, takeaway, transmission, summary);
  if (!entityConsistency.isClean) {
    return entityConsistency;
  }

  return {
    isClean: true,
    contaminationScore: 0,
  };
}

// =========================================================================
// 规则 C：【标题与小结实体一致性校验网关】 (Rule C: Title-Summary Entity Gateway)
// 提取【标题关键词】与【核心小结关键词】：
// 如果标题核心词是 A股/创业板/沪指/降息/指数，而小结核心词全是 变压器/核电/GPU/英伟达，二者实体交集为 0；
// 判定为“数据串味/严重幻觉”，直接拦截并触发报警，拒绝向前端发布展示！
// =========================================================================

export const STOCK_MARKET_INDEX_REGEX = /a股|创业板|沪指|上证|深成指|北交所|两市|收评|午评|大盘|北向资金|三大指数|股指期货|沪深300|中证500|科创50|港股|恒指/i;
export const POWER_TRANSFORMER_GPU_REGEX = /变压器|电网卡脖子|核电运营商|独立核电|万卡算力|北美ai机房|通不上电|买显卡|b200/i;

export function validateTitleSummaryEntityConsistency(
  title: string,
  takeaway: string,
  transmission: string,
  summary: string
): ConsistencyCheckResult {
  const titleText = (title || '').toLowerCase();
  const bodyText = ((takeaway || '') + ' ' + (transmission || '') + ' ' + (summary || '')).toLowerCase();

  // 1. 核心校验：如果标题核心词是 A股/创业板/沪指/降息/指数，而小结核心词是 变压器/核电/GPU/英伟达
  if (STOCK_MARKET_INDEX_REGEX.test(titleText) || /降息|加息|非农|cpi|美联储/.test(titleText)) {
    // 检查标题是否具备海外算力/变压器等硬件专业背景
    const titleHasExplicitHardwareContext = /北美|数据中心|核电|变压器|英伟达|gpu|算力集群/.test(titleText);
    if (!titleHasExplicitHardwareContext && POWER_TRANSFORMER_GPU_REGEX.test(bodyText)) {
      return {
        isClean: false,
        contaminationScore: 10,
        reason: '【标题与小结实体严重错位】：标题为A股大盘/沪指指数/宏观利率，但小结/结论出现北美变压器缺电与GPU机房内容，二者实体交集为0，判定为数据串味与严重幻觉，已触发物理熔断拦截！',
      };
    }
  }

  // 2. 特大自然灾害标题 vs 科技/央行小结（防张冠李戴）
  if (/吉隆口岸|泥石流|冰岩崩|山洪|山体滑坡|搜救|遇难|受灾/.test(titleText)) {
    if (/美联储|沃什|凯文·沃什|鲍威尔|美债收益率|日元加息|植田和男|2nm|先进制程|变压器排队|买显卡/.test(bodyText)) {
      return {
        isClean: false,
        contaminationScore: 10,
        reason: '【特大灾害实体严重错位】：标题为地质灾害/抢险，但小结出现海外央行或半导体算力内容，已触发物理熔断拦截！',
      };
    }
  }

  // 3. 战局防务标题 vs 国内财政/医保/反腐小结
  if (/空袭|导弹|以军|俄军|乌军|加沙|黎巴嫩|五角大楼|前线交火/.test(titleText)) {
    if (/超长期特别国债|内需循环|地方化债|国家医保局|地方专项债|王建军/.test(bodyText)) {
      return {
        isClean: false,
        contaminationScore: 10,
        reason: '【战局防务实体严重错位】：标题为前线军事交火，但小结出现国内财政与社会治理词汇，已触发物理熔断拦截！',
      };
    }
  }

  // 4. 澳洲联储 / 欧洲央行 / 英国央行 标题 vs 美联储 / 美债 / FOMC 小结（防跨国央行严重杂交）
  if (FOREIGN_ENTITIES.AUSTRALIA.test(titleText) || FOREIGN_ENTITIES.EUROPE_ECB.test(titleText) || FOREIGN_ENTITIES.UK_BOE.test(titleText)) {
    if (!/美联储|沃什|凯文·沃什|鲍威尔|fomc|美债/.test(titleText) && /美联储利率政策追踪委员会|华盛顿联邦决策中枢|9月\s*fomc\s*议息决议|美债收益率曲线/.test(bodyText)) {
      return {
        isClean: false,
        contaminationScore: 10,
        reason: '【跨国央行严重杂交错位】：标题为澳洲联储/欧洲央行等非美央行，但小结被误植入美联储/FOMC/华盛顿中枢模板，已触发物理熔断拦截！',
      };
    }
  }

  // 5. 突发灾害/伤亡事故标题 vs 商业赚钱/制造回暖/理财备货小结（物理杜绝牛头不对马嘴）
  if (/泥石流|山洪|滑坡|地质灾害|重特大事故|坍塌|火灾|爆炸|伤亡|遇难|失联|致.*死|死伤|抗洪抢险|极端暴雨/.test(titleText)) {
    if (/智造企业|现金流回暖|实物货流回暖|低风险理财|实体生产备货|现货升水|代工厂|晶圆|变压器排队|买显卡/.test(bodyText)) {
      return {
        isClean: false,
        contaminationScore: 10,
        reason: '【灾害事故实体严重错位】：标题为突发自然灾害或人员伤亡抢险，但小结/利益链被误植入智造企业回暖、理财备货或商业赚钱话术，已触发物理熔断拦截！',
      };
    }
  }

  // 6. 地理区域跨省/跨国张冠李戴拦截门禁（如江西遂川等非吉隆口岸灾害被套用“喜马拉雅”）
  if (!/吉隆|西藏|中尼|日喀则|定日/.test(titleText) && /喜马拉雅|樟木口岸|中尼公路/.test(bodyText)) {
    return {
      isClean: false,
      contaminationScore: 10,
      reason: '【地理区域严重错位】：标题非西藏/中尼口岸事件，但内容套用喜马拉雅或樟木口岸地理标签，已触发物理熔断拦截！',
    };
  }

  return {
    isClean: true,
    contaminationScore: 0,
  };
}

