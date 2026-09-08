import { TrackId, PrimarySourceInfo } from './types';

// =========================================================================
// 【硬核实体词互斥与内容一致性门禁引擎 (Deterministic Guardrails Engine)】
// 物理拦截任何“跨国串味杂交”事故，一票否决违规归类与虚假信源
// =========================================================================

// 1. 外国主权与核心实体词（与中国国内板块物理绝对互斥）
export const FOREIGN_ENTITIES = {
  JAPAN: /日本|日元|日银|东证|财务省|财务大臣|加藤胜信|植田和男|岸田|石破茂|东京|日经225|丰田|索尼|软银/,
  US_MACRO: /美联储|鲍威尔|美债|美国国债|白宫|耶伦|美国财政部|华尔街|纳斯达克|道琼斯|标普500|非农|初请|失业金|美股三大|fomc/,
  WAR_DEFENSE: /五角大楼|防卫省|以军|俄军|乌军|克里姆林宫|北约|泽连斯基|普京|内塔尼亚胡|哈马斯|真主党|黎巴嫩|加沙|也门胡塞|霍尔木兹/,
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

  let correctedTrack = currentTrack;
  let correctedSource = { ...currentSource };
  let isInterceptionTriggered = false;
  let interceptionReason = '';

  // 1. 检查是否为日本主权实体
  if (FOREIGN_ENTITIES.JAPAN.test(text)) {
    if (correctedTrack === 'china_domestic') {
      correctedTrack = 'apac_tech';
      isInterceptionTriggered = true;
      interceptionReason = '【实体词拦截】标题/正文含有日本主权实体（如日元/财务省/植田和男），一票否决国内赛道，强行纠偏至亚太宏观与科技';
    }
    // 强制拨正信源：严禁打上中国官方信源标签
    if (CHINESE_OFFICIAL_SOURCE_REGEX.test(correctedSource.source) || correctedSource.source.includes('中国')) {
      correctedSource = {
        source: inheritedRawSource && !CHINESE_OFFICIAL_SOURCE_REGEX.test(inheritedRawSource) ? inheritedRawSource : '日经亚洲 Nikkei Asia',
        sourceUrl: 'https://asia.nikkei.com',
      };
      isInterceptionTriggered = true;
      interceptionReason += ' | 物理剥离虚假中国官方信源，拨正为日经亚洲/海外电讯';
    }
  }

  // 2. 检查是否为美联储/美债/美国宏观实体
  else if (FOREIGN_ENTITIES.US_MACRO.test(text) && !/涉华|对华|中美博弈/.test(text)) {
    if (correctedTrack === 'china_domestic') {
      correctedTrack = 'us_macro';
      isInterceptionTriggered = true;
      interceptionReason = '【实体词拦截】标题/正文含有美联储/美债/鲍威尔实体，一票否决国内赛道，强行纠偏至美股与美元宏观';
    }
    if (CHINESE_OFFICIAL_SOURCE_REGEX.test(correctedSource.source)) {
      correctedSource = {
        source: '华尔街日报 WSJ Markets',
        sourceUrl: 'https://www.wsj.com',
      };
      isInterceptionTriggered = true;
    }
  }

  // 3. 检查是否为海外战局/五角大楼防务实体
  else if (FOREIGN_ENTITIES.WAR_DEFENSE.test(text)) {
    if (correctedTrack === 'china_domestic') {
      correctedTrack = 'war_conflict';
      isInterceptionTriggered = true;
      interceptionReason = '【实体词拦截】标题/正文含有五角大楼/以军/俄乌防务实体，一票否决国内赛道，强行纠偏至战局防务';
    }
    if (CHINESE_OFFICIAL_SOURCE_REGEX.test(correctedSource.source)) {
      correctedSource = {
        source: '路透社防务专电 Reuters Defense',
        sourceUrl: 'https://www.reuters.com',
      };
      isInterceptionTriggered = true;
    }
  }

  return {
    passed: true,
    correctedTrack,
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
    const foreignMatches = bodyText.match(/日元加息|植田和男|鲍威尔降息|美联储议息/g) || [];
    if (foreignMatches.length >= 1) {
      return {
        isClean: false,
        contaminationScore: foreignMatches.length,
        reason: `严重跨国串味：标题属于国内专属事件，但内容出现海外实体【${foreignMatches.join(', ')}】，已触发物理熔断拦截！`,
      };
    }
  }

  return {
    isClean: true,
    contaminationScore: 0,
  };
}
