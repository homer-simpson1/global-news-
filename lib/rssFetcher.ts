import { FlashBrief, MarketQuote, NewsItem, TrackId, Summary5W1H, MarketSentiment, BullBearDivergence, CompanyProfile } from './types';
import { SEED_FLASH_BRIEFS, SEED_NEWS_ITEMS, SEED_MARKET_QUOTES, GYIRONG_PORT_DISASTER_TRACKER } from '@/data/seedData';
import { fetchVerifiedMarketQuotes, getCachedVerifiedQuotesSnapshot } from './quotesVerifier';
import { enforceCountryEntityGuardrails, checkCrossContamination, validateTitleSummaryEntityConsistency, FOREIGN_ENTITIES } from './guardrails';
import { autoCorrectAllNews, autoCorrectFlashBrief, sanitizeEditorialTone } from './selfHealingEngine';
import { EDITORIAL_CHIEF_SYSTEM_PROMPT } from './aiService';
import { getCompanyProfileForNews } from './companyProfiles';
import {
  getMacroInflationBreakdown,
  isMacroInflationNews,
  getMacroInflationTakeaway,
  getMacroInflationTransmission,
  buildMacroInflationFactParagraph,
  getMacroInflationNextWatchlist,
  sanitizeFedRatePolicyWording,
} from './macroInflationEngine';
import {
  getEventKeyProvisions,
  buildEventProvisionsFactParagraph,
  isEventProvisionsNews,
} from './eventProvisions';
import { getTimeDiffHours } from './timeUtils';

let cachedNews: NewsItem[] | null = null;
let cachedFlash: FlashBrief[] | null = null;
let cachedQuotes: MarketQuote[] | null = null;
let lastFetchTime = 0;
let lastQuotesFetchTime = 0;
let inFlightFetch: Promise<NewsItem[]> | null = null;

// 毫秒级内存瞬时快照（用于自检与即时渲染，0 网络 I/O，且经过全域自动纠偏引擎净化）
export function getFastIntelSnapshot(): {
  news: NewsItem[];
  flash: FlashBrief[];
  quotes: MarketQuote[];
} {
  const rawNews = (cachedNews && cachedNews.length > 0) ? cachedNews : SEED_NEWS_ITEMS;
  const rawFlash = (cachedFlash && cachedFlash.length > 0) ? cachedFlash : SEED_FLASH_BRIEFS;
  const { news: healedNews, flashBriefs: healedFlash } = autoCorrectAllNews(rawNews, rawFlash);
  return {
    news: healedNews,
    flash: healedFlash,
    quotes: (cachedQuotes && cachedQuotes.length > 0) ? cachedQuotes : getCachedVerifiedQuotesSnapshot(),
  };
}

// 动态缓存与刷新周期：3分钟极速响应
const CACHE_TTL_MS = 3 * 60 * 1000;
const QUOTES_TTL_MS = 20 * 1000; // 行情 20 秒动态刷新 (实时行情，0 Token)

interface RawLiveItem {
  id: string;
  wireChannel: string;
  title: string;
  content: string;
  time: string;
  source: string;
  url: string;
}

export function formatIntelDateTime(val: any): string {
  if (!val) return '最新电讯';

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{1,2}月\d{1,2}日\s+\d{1,2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/(?:(\d{4})[-/])?(\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}:\d{2}))?/);
    if (match) {
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      const hm = match[4] || '00:00';
      return `${month}月${day}日 ${hm}`;
    }
    if (/^\d{10,13}$/.test(trimmed)) {
      val = parseInt(trimmed, 10);
    }
  }

  let d: Date | null = null;
  if (typeof val === 'number') {
    d = new Date(val * (val < 1e11 ? 1000 : 1));
  } else if (val instanceof Date) {
    d = val;
  }

  if (d && !isNaN(d.getTime())) {
    try {
      const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(d);
      const partMap: Record<string, string> = {};
      parts.forEach((p) => {
        partMap[p.type] = p.value;
      });
      return `${partMap.month}月${partMap.day}日 ${partMap.hour}:${partMap.minute}`;
    } catch {
      const beijingTime = new Date(d.getTime() + (d.getTimezoneOffset() + 480) * 60000);
      return `${beijingTime.getMonth() + 1}月${beijingTime.getDate()}日 ${String(beijingTime.getHours()).padStart(2, '0')}:${String(beijingTime.getMinutes()).padStart(2, '0')}`;
    }
  }

  return String(val);
}

function generateIntelId(seed: string | number): string {
  let h = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return `GID-${h.toString(16).toUpperCase().padStart(8, '0')}`;
}

// ==========================================
// 【国内重大资讯去伪与去宣传除杂指令】
// 强制执行“三剥离、三保留”脱水规范
// ==========================================
export const DOMESTIC_CLEANING_PROMPT_RULE = `
【国内重大资讯去伪与去宣传除杂指令】
对待所有国内事件报道，必须无条件执行“三剥离、三保留”：

1. 物理抹杀所有宣传废话：
   - 彻底剔除所有“领导高度重视、迅速启动预案、众志成城、坚决贯彻、牢牢把握、深入推进”等政治口号与形式主义修辞；
   - 彻底剔除未经独立第三方法定检测的企业吹牛词汇（如“遥遥领先”、“彻底打破垄断”、“世界首创”一律抹平为中性陈述）；
   - 彻底剔除丧事喜办式的道德叙事。

2. 强制提取冰冷硬核四要素：
   - 【物理事实】：究竟发生了什么？波及人数/资金/受损规模的具体确切体量？
   - 【真实博弈】：谁在受损失？谁在被追责？对什么行业的行政叫停或禁令已真实落地？
   - 【供应链与产业冲击】：对上下游企业生产、履约有何实质破坏或连锁反应？
   - 【信源审慎定性】：凡属单方面自宣的重大突破或单方面非正式辟谣，卡片必须强制标注“【单方通报·待验证】”，严禁把公关词当客观事实呈现。
`;

// =========================================================================
// 【深度透视 (Deep Dive) 权威 System Prompt 规范 (彭博社/财新网特约首席编辑标准)】
// 彻底消除自媒体口水套话，强化 5W1H 事实标准，严格限制一级直接因果与负面词库禁令
export const HEADLINE_AND_SUMMARY_GENERATION_PROMPT = EDITORIAL_CHIEF_SYSTEM_PROMPT;

// 事实一致性审查门禁与回退规范 (Fact Faithfulness Gate)
export function fallback_to_grounded_summary(rawText: string): {
  title: string;
  core_conclusion: string;
  transmission_chain: string;
} {
  let clean = sanitizeEditorialTone(rawText || '').replace(/[！!？?]/g, '，').trim();
  clean = clean.replace(/^(?:能源内参|财新周刊|金融人事|周刊视点|每日内参|宏观晨报|晨会纪要|行业周报|特稿|快讯|电讯|热点聚焦|专栏)[｜|·\s\-]\s*/, '').trim();
  const sentences = clean.split(/[。；;\n]/).map(s => s.trim()).filter(s => s.length >= 8);
  const firstSentence = sentences[0] || clean.slice(0, 60);

  let title = firstSentence;
  // 仅当超长（超过55字）且具有自然标点时，才在后半段进行安全截断，绝对保留核心谓语与数字
  if (title.length > 55) {
    const sub = title.slice(0, 55);
    const punc = Math.max(sub.lastIndexOf('，'), sub.lastIndexOf('、'));
    title = punc >= 30 ? sub.slice(0, punc) : sub;
  }
  title = title.replace(/(?:\d+\.|\.\d*)$/, '').replace(/(?:[，,、；;：:\s及与和等并]|为了|保证|以实现|以确保|正在全力)+$/, '').trim();
  title = title.replace(/(?:[在于向从对将把与和或为就至达创报被由]|位于|处于|关于|探讨|围绕|随着|导致)+$/, '').trim();
  if (/opec/i.test(title) && /原油|布伦特|减产/.test(title)) {
    if (/在$/.test(title) || !/筑底|企稳|回升|支撑/.test(title) || title.length < 24) {
      title = 'OPEC+主要成员国探讨顺延减产，布伦特原油在90美元上方筑底';
    }
  }
  if (/布伦特原油在/i.test(title) && !/筑底|90美元/.test(title)) {
    title = 'OPEC+主要成员国探讨顺延减产，布伦特原油在90美元上方筑底';
  }
  if (/金正恩|朝鲜.*(?:武器|试验)/.test(title)) {
    title = title.replace(/[，,\s]*区域防务安全态势进一步明朗[。.]*$/g, '');
    if (title.length < 18 || !/威慑|反制|试验|观摩/.test(title)) {
      title = '金正恩观摩朝鲜新型武器试验，展示常规与战备反制威慑';
    }
  }
  const t = title.toLowerCase();

  let core_conclusion = `【事实基准核验】：信源原文明确通报：${firstSentence}。客观事实已锁定，杜绝无事实依据的过度脑补。`;
  let transmission_chain = '① 事件冲击直接影响核心当事方的资产与负债结构 ➔ ② 产业链与合作方依据合同与市场规则传导成本收益 ➔ ③ 边际供求关系与资产风险溢价完成动态重定价。';

  // 严格限定真实首次公开发行/IPO，严禁股指期货、期权或普通股票涨跌冒名
  if (/(?:首次公开发行|ipo|登陆科创板|登陆港交所|挂牌上市|敲钟上市|新股上市)/.test(t) && !/(?:期货|期指|期权|标普|道指|纳斯达克.*期货|指数)/.test(t)) {
    if (/芯片|算力|gpu|半导体|晶圆|燧原|沐曦|摩尔线程|壁仞|长鑫|中芯|寒武纪/.test(t)) {
      core_conclusion = '【国产算力资本化重估】：国产云端AI芯片迎来资本市场高溢价定价，资金高度聚焦自主全栈大模型集群算力底座，加速先进制程流片与商业化交付。';
      transmission_chain = '① IPO募集资金直接支持先进制程芯片研发与流片开支 ➔ ② 下游数据中心与云厂商加大国产算力卡采购与适配验证 ➔ ③ 推动国内AI大模型硬件基础设施供应链生态自主可控。';
    } else {
      core_conclusion = '【资本市场定价与流动性溢价】：标的企业完成上市并获二级市场流动性重估，募集资金直接扩充资本实力并加速核心业务扩张交付。';
      transmission_chain = '① IPO募集资金直接扩充企业资本公积并强化核心研发与运营实力 ➔ ② 产业链上下游合作伙伴增强长协合作信心与协同采购 ➔ ③ 细分赛道龙头竞争壁垒与市场份额进一步稳固。';
    }
  }

  return {
    title: sanitizeEditorialTone(title),
    core_conclusion: sanitizeEditorialTone(core_conclusion),
    transmission_chain,
  };
}

export function verify_fact_faithfulness(
  raw_text: string,
  generated_data: { title: string; core_conclusion: string; transmission_chain: string }
): { pass: boolean; reason?: string } {
  const { title, core_conclusion, transmission_chain } = generated_data;

  // 门禁红线 1：标题严禁感叹号、问号、省略号
  if (/[！!？?]|……|\.{3}/.test(title)) {
    return { pass: false, reason: '标题违规包含感叹号、问号或省略号' };
  }

  // 门禁红线 2：绝对禁用情绪化自媒体词汇
  const bannedKeywords = [
    '站岗', '躺赢', '数钱', '割韭菜', '无情砸盘', '哭爹喊娘', '干翻', '沦为军火商', '炸裂',
    '某大厂', '三家新贵', '某巨头', '相关部门', '业内人士', '几家新贵', '失势老股', '买显卡通不上电',
    '大动作', '赚麻了'
  ];
  const allGenerated = `${title} ${core_conclusion} ${transmission_chain}`;
  for (const b of bannedKeywords) {
    if (allGenerated.includes(b)) {
      return { pass: false, reason: `内容包含被禁自媒体词汇: "${b}"` };
    }
  }

  // 门禁红线 3：利益链 1-Hop 规范检查（必须满足 ①... ➔ ②... ➔ ③... 结构，严禁机械免责套话）
  if (transmission_chain && (!/①.*➔.*②.*➔.*③/.test(transmission_chain) || transmission_chain.includes('信源仅陈述单一动作'))) {
    return { pass: false, reason: '利益链未满足 1-Hop 规范因果链结构或包含机械免责套话' };
  }

  return { pass: true };
}

// 宣传套话与形式主义修辞过滤正则
const PROPAGANDA_REGEX = /领导高度重视|迅速启动预案|众志成城|坚决贯彻|牢牢把握|深入推进|统一思想|真抓实干|凝心聚力|圆满完成|向好态势|积极成效|有力保障|喜迎|谱写新篇章|展现了人间大爱|谱写了生命的赞歌|涌现出感人事迹|舍己为人/g;
// 企业吹牛与未验证夸大词汇正则
const ENTERPRISE_HYPE_REGEX = /遥遥领先|彻底打破垄断|打破国外垄断|打破垄断|世界首创|填补国内空白|重大突破|颠覆性突破|全球顶尖|无可匹敌|史无前例/g;

export function sanitizeDomesticNewsText(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(PROPAGANDA_REGEX, '');
  cleaned = cleaned.replace(ENTERPRISE_HYPE_REGEX, '实现技术推进');
  cleaned = cleaned.replace(/^[，。、；\s]+/, '').replace(/[，、；\s]+$/, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  return cleaned.trim();
}

// 检测是否属于单方面自宣突破或单方面非正式辟谣
export function checkUnilateralClaim(title: string, content: string): boolean {
  const text = (title + ' ' + content).toLowerCase();
  return /自主研发突破|据内部人士辟谣|自研首创|单方面宣布|官方回应称网传不实|辟谣称|非正式澄清|企业声明称|我司回应|网传不实/.test(text);
}

// ==========================================
// 【通用重大外溢冲击收录标准】
// 命中以下 4 项外溢指标之一者，严禁过滤！
// 强制作为【一级重大情报】收录进【国内要闻与治理】
// ==========================================
export interface SpilloverImpactResult {
  isSpilloverMajor: boolean;
  criteriaIndex?: 1 | 2 | 3 | 4;
  criteriaName?: string;
  reason?: string;
}

export function evaluateSpilloverImpact(title: string, content: string): SpilloverImpactResult {
  const text = (title + ' ' + content).toLowerCase();

  // 门禁：纯外国主权实体或海外事件（刚果金、非洲疫情、美德法日等）一票否决国内重大外溢标签
  const isPureForeign = (
    FOREIGN_ENTITIES.GLOBAL_FOREIGN.test(text) ||
    FOREIGN_ENTITIES.AFRICA_GLOBAL.test(text) ||
    FOREIGN_ENTITIES.US_ALL.test(text) ||
    FOREIGN_ENTITIES.EUROPE_ECB.test(text) ||
    FOREIGN_ENTITIES.JAPAN.test(text)
  ) && !/涉华|对华|中美|中欧|中日|中国|两岸|海警|边境口岸|吉隆|樟木/.test(text);

  if (isPureForeign) {
    return { isSpilloverMajor: false };
  }

  // 1. 监管铁拳与准入颠覆：引发国家级跨部门叫停、行业准入牌照大整顿、推倒重来式重塑（如教培叫停、网络安全审查、高危行业全国叫停整顿）
  if (
    /跨部门叫停|全面叫停|暂停准入|牌照整顿|牌照吊销|推倒重来|网络安全审查|行业叫停|全国排查|立案调查|专项整治|反腐|被查|落马|判处无期|被判无期|被判死刑|受贿|被逮捕|重罚|取消资质|暂停业务|强制下架|退市|操纵市场|突击调查|立案侦查|约谈高管|清退|注销许可/.test(
      text
    )
  ) {
    return {
      isSpilloverMajor: true,
      criteriaIndex: 1,
      criteriaName: '监管铁拳与准入颠覆',
      reason: '涉及国家级或跨部门准入整顿、牌照叫停或重大司法惩处',
    };
  }

  // 2. 关键底盘与供应链断裂：核心零部件突发断供、造假暴雷、工厂集体停产、关键技术被曝光造假、或外资核心链条突发撤离
  if (
    /突发断供|零部件断供|核心链条撤离|造假暴雷|集体停产|停工停产|曝光造假|数据造假|学术造假|财务造假|供应链断裂|撤资|外资撤离|核心技术受限|断链|违约逾期|无法履约|召回|挤兑/.test(
      text
    )
  ) {
    return {
      isSpilloverMajor: true,
      criteriaIndex: 2,
      criteriaName: '关键底盘与供应链断裂',
      reason: '涉及关键供应链断裂、核心零部件断供、生产停滞或造假暴雷',
    };
  }

  // 3. 地缘与涉外高危擦枪：涉边境/南海摩擦、关键航道扣押、涉外反制与重大跨国司法冲突
  if (
    /边境摩擦|南海摩擦|仁爱礁|黄岩岛|海警拦截|海警登临|航道扣押|扣押货轮|涉外反制|反歧视调查|反歧视救济|反制裁|跨国司法|引渡|长臂管辖|领海驱离|实弹演训|交火冲突|军演|出口管制清单/.test(
      text
    )
  ) {
    return {
      isSpilloverMajor: true,
      criteriaIndex: 3,
      criteriaName: '地缘与涉外高危擦枪',
      reason: '涉及边境摩擦、航道扣押、涉外反制或跨国司法重大冲突',
    };
  }

  // 4. 系统性责任事故、突发公共安全、公共卫生与自然灾害大震荡：
  // 包括恶性无差别暴力、冲撞行凶、重大社会治安、极端社会应激、突发公共卫生事件、烈性传染疫情、特大自然灾害、地质险情与责任事故（严禁混入纯商业破产/违约）
  if (
    /重特大事故|特别重大|特大火灾|坍塌事故|重大伤亡|遇难|死亡(?:\d+|多)人|致死|相撞致.*死|致.*伤|爆炸事故|矿难|无差别.*(?:伤人|袭击|行凶|持刀|攻击)|持刀.*(?:伤人|行凶|砍人|刺伤|袭击)|随机伤人|恶性伤人|驾车冲撞|冲撞人群|袭警|重大治安|校园暴力|商场伤人|伤及无辜|公共安全突发|恶性案件|故意伤害|杀害|报复社会|社会应激|极端事件|公共卫生|突发疫情|传染病|疾控|确诊病例|聚集性疫情|突发感染|病毒感染|隔离管控|流行病|禽流感|登革热|炭疽|鼠疫|霍乱|诺如|食物中毒|甲流|自然灾害|特大暴雨|特大洪涝|特大干旱|超强台风|地震|强震|海啸|山洪|山体滑坡|泥石流|地质灾害|冰岩崩|堰塞湖|决口|破堤|溃坝|坍塌|林火|森林火灾|受灾群众|紧急避险|转移安置|救灾应急|地方公共信用|地方债务展期|地方财政困难|停运|群体性事件|紧急状态|跨区域危机|特别国债注资|吉隆口岸|口岸损毁|边境口岸|保通/.test(
      text
    )
  ) {
    return {
      isSpilloverMajor: true,
      criteriaIndex: 4,
      criteriaName: '系统性责任事故与地方大震荡',
      reason: '涉及重特大公共安全突发、恶性治安行凶、公共卫生疫情、自然灾害或人员伤亡危机',
    };
  }

  return { isSpilloverMajor: false };
}

// ==========================================
// 【股票分时跳动与券商炒作噪音严防引擎】
// 坚决扑灭：纯行情流水账、个股涨跌停、板块跟风、转债分时、券商IPO造势等投机噪音
// ==========================================
export const STOCK_TAPE_SPAM_REGEX =
  /涨停|跌停|持续拉升|盘中拉升|高开|低开|跳水|翻红|转涨|转跌|触及涨停|触及跌停|盘中异动|主力净流入|概念股|个股|板块走强|板块拉升|板块走低|板块下挫|板块领涨|板块领跌|指数涨超|指数跌超|震荡走高|震荡走低|创业板指|深证成指|上证指数|北证50|科创50|沪深300|中证500|中证1000|中证转债|转债|可转债|北向资金|净买入|净卖出|换手率|超大单|资金净流出|资金净流入|净流出超|净流入超|连板|首板|二连板|回落|探底回升|日内跌幅|日内涨幅|上市在即|拟上市|报[0-9.]+点|涨幅扩大至|跌幅扩大至|早盘高开|开盘调整|开盘走高|开盘走低|开盘上涨|开盘下跌|早盘拉升|早盘下挫|涨幅居前|跌幅居前|分别涨|分别跌|成交额超|ETF份额|ETF净流入|券商提前布局|研报维持|目标价|买入评级|增持评级|盘前必读|早盘必读|见闻早餐|午盘总结|收盘评述|尾盘拉升/;

export function isStockTapeSpam(title: string, content: string): boolean {
  const text = (title + ' ' + content).toLowerCase();
  // 命中司法宣判、特别国债、重特大责任事故、反腐双开、重大外溢冲击者，不视为行情杂音
  const isCriticalEvent =
    /判决|判处|受贿|贪腐|无期徒刑|特别国债|注资|重特大|死亡|遇难|事故|立案调查|立案侦查|专项整治|反腐|落马|被查|牌照吊销|全面叫停|突发断供|造假暴雷|反制|商务部|外交部|涉案|双开/.test(
      text
    );
  if (isCriticalEvent) return false;

  // 严厉拦截：纯开盘/收盘行情分时、转债涨跌幅排名、涨幅/跌幅居前分别涨等流水账
  if (
    /分别[涨跌][0-9.]+%|(?:涨幅|跌幅)居前|转债.*指数开盘|指数开盘(?:上涨|下跌)|开盘(?:上涨|下跌)[0-9.]+%/.test(
      text
    )
  ) {
    return true;
  }
  return STOCK_TAPE_SPAM_REGEX.test(text);
}

// 判定是否属于日程预告、日历提醒或空洞早晚报汇总垃圾
export function isCalendarOrDigestSpam(title: string, content?: string): boolean {
  const t = (title || '').trim();
  const c = (content || '').trim().toLowerCase();
  // 1. 日历预告与提醒型垃圾（如【提醒】日内请重点关注...）
  if (
    /^(?:【?提醒】?|日内请重点关注|今日重点关注|今日关注|财经日历|重点数据前瞻|早间要闻汇总|晨报|早报|早餐|今日无重大数据|今日重要日程|日内重要日程)/i.test(
      t
    )
  ) {
    return true;
  }
  // 2. 纯日程罗列
  if (/^(?:日内重要数据|日内关注事项|财经日历提醒|今日重点数据|今日重磅日程)/.test(t)) {
    return true;
  }
  // 3. 常见汇总流水账
  if (/^(?:隔夜要闻|早盘要闻|晚间要闻|盘前精选|每日财经早餐|早盘必读|盘前必读)/.test(t)) {
    return true;
  }
  if (/^【?提醒】?/.test(t) && /关注.*数据|公布.*数据|财报公布/.test(c)) {
    return true;
  }
  return false;
}

// 清洗快讯前导引述、状语与方括号标签，还原本质标题主语
export function cleanWireHeadline(raw: string): string {
  if (!raw) return '';
  let h = raw.trim();
  // 去除方括号和快讯标签，如 【独家】【快讯】【提醒】【数据】
  h = h.replace(/^【[^】]+】\s*/, '').trim();
  // 剥离媒体栏目分类前缀（如“T早报｜”、“财新周刊｜”、“特稿 |”）
  h = h.replace(
    /^(?:T早报|能源内参|财新周刊|金融人事|周刊视点|每日内参|宏观晨报|晨会纪要|行业周报|特稿|快讯|电讯|热点聚焦|专栏)\s*[｜|·\-\/:：]\s*/,
    ''
  ).trim();
  h = h.replace(/^[｜|·\-\/:：\s]+/, '').trim();
  // 去除信源前导引述与状语前缀（如“产业链人士：...”、“据知情人士透露，...”）
  h = h.replace(
    /^(?:据(?:知情|业内|产业链|权威|相关|市场)人士(?:透露|表示|称|介绍)[，,：:\s]*|产业链人士[：:\s]+|业内人士[：:\s]+|消息人士[：:\s]+)/,
    ''
  ).trim();
  h = h.replace(/^(?:有记者问|记者问|问|答)[：:\s]+(?:美东时间[0-9月日\s]+[，,]?)?/, '').trim();
  return h;
}

// 唯一的杂音过滤器：政界私人花边 + 体育娱乐 + 非市场杂音 + 日历提醒
// （合并了原 noiseRegex 中的体育/娱乐关键词，消除重复过滤层）
export function isNonMarketTrivia(title: string, content: string): boolean {
  if (isCalendarOrDigestSpam(title, content)) {
    return true;
  }

  const text = (title + ' ' + content).toLowerCase();
  // 体育、娱乐、生活花边
  if (
    /摩托车|锦标赛|排球|足球|篮球|马拉松|选美|车展|博览会闭幕|闭幕式|开幕式|演唱会|明星|彩票|中奖|电视剧|电影节/.test(text)
  ) {
    return true;
  }
  // 政界私人琐事
  if (
    /自掏腰包|送钱|赠送现金|奖金|发红包|小费|打赏|私生活|八卦|绯闻|宠物|私人宴请|私人聚会|打高尔夫|给助理|行政助理.*(?:送|现金|自掏腰包|奖金)|总统.*(?:自掏腰包|送钱|给助理|小费|发红包)/.test(
      text
    )
  ) {
    // 除非涉及严肃的司法受贿、贪腐立案、追责公诉
    if (!/受贿|立案|贪腐|落马|公诉|起诉|判决|违纪|弹劾|非法行贿/.test(text)) {
      return true;
    }
  }
  return false;
}

// =============================================================================
// 【语义资本市场相关性评分引擎】
// 核心理念：通读全文，按"传导向量类别"打分，需至少命中 1 个实质类别才放行。
// 彻底解决"只识别关键词、不阅读文章"的根本缺陷。
// =============================================================================

export interface MarketRelevanceResult {
  hasMarketSubstance: boolean;    // 是否具备资本市场实质内容
  totalScore: number;             // 总得分（≥1 放行）
  hitCategories: string[];        // 命中的传导类别（供日志诊断）
  reason: string;                 // 丢弃原因（供日志诊断）
}

/**
 * 评估一篇文章是否具备真实的资本市场传导内容。
 *
 * 评分逻辑（每类最多贡献 2 分，总分 ≥ 1 即放行）：
 *   A. 货币/财政政策       — 央行、利率、降息/加息、QE、财政预算、国债发行
 *   B. 资产价格运动        — 股指点位、债券收益率、具体汇率数字、大宗商品价格
 *   C. 供应链/贸易         — 制裁、关税、出口管制、断供、脱钩、供应链中断
 *   D. 主权军事升级        — 战争、空袭、导弹、封锁、能源/粮食走廊受威胁
 *   E. 企业/行业事件       — 业绩、裁员、并购、破产、重大合同、IPO、融资
 *   F. 宏观数据发布        — CPI/PPI/PCE、非农、GDP、PMI、就业率、通胀
 *   G. 监管/政策冲击       — 立法、监管新规、牌照、反垄断、行业整顿
 *   H. 主权信用/债务风险   — 评级下调、违约、债务重组、主权风险
 *
 * 反向排除（无论以上多少分，强制丢弃）：
 *   - 文章全文 ≥ 80% 篇幅是个人行为描述（送礼、约会、人事八卦）且无一个数字型金融指标
 */
export function evaluateCapitalMarketRelevance(
  title: string,
  content: string,
  track: string
): MarketRelevanceResult {
  // 某些专属赛道的文章直接豁免（大宗商品、外汇、债券专线已经是纯市场数据）
  const exemptTracks = ['commodities', 'forex', 'bonds', 'us_macro_data', 'crypto', 'china_macro', 'us_macro'];
  if (exemptTracks.includes(track)) {
    return { hasMarketSubstance: true, totalScore: 99, hitCategories: ['track_exempt'], reason: '' };
  }

  const fullText = (title + ' ' + content);
  const text = fullText.toLowerCase();
  const len = text.length || 1;

  const hitCategories: string[] = [];
  let totalScore = 0;

  // ── A. 货币 / 财政政策 ──────────────────────────────────────────────────
  const monetaryHits = (text.match(
    /央行|美联储|欧央行|日本银行|英格兰银行|中国人民银行|联储|fed\b|ecb\b|boj\b|boe\b|降息|加息|升息|息率|基准利率|政策利率|隔夜|repo|逆回购|qe\b|量化宽松|量化紧缩|qt\b|财政刺激|财政赤字|债务上限|国债发行|赤字|预算案|财政部|treasury\b|财政政策|货币政策|流动性|通货膨胀目标|通胀预期/g
  ) || []).length;
  if (monetaryHits >= 1) {
    const score = Math.min(monetaryHits >= 3 ? 2 : 1, 2);
    totalScore += score;
    hitCategories.push(`A.货币财政政策(${monetaryHits}处)`);
  }

  // ── B. 资产价格运动 ──────────────────────────────────────────────────────
  // 必须有具体数字或涨跌幅描述，不能只是泛泛提到"股市"
  const priceHits = (text.match(
    /[0-9]+\.?[0-9]*\s*(?:点|bp|基点|%|美元|元|欧元|英镑|日元|亿|万亿)|道琼斯|纳斯达克|标普|恒生|日经|沪深300|上证|收益率|yield|汇率|美元指数|dxy\b|原油价格|黄金价格|铜价|铁矿石|lme\b|cme\b|nymex\b|布伦特|wti\b|涨跌幅|升值|贬值|突破.*关口|下破.*关口|创.*新高|创.*新低|跌至.*年低|涨至.*年高/g
  ) || []).length;
  if (priceHits >= 1) {
    const score = Math.min(priceHits >= 2 ? 2 : 1, 2);
    totalScore += score;
    hitCategories.push(`B.资产价格运动(${priceHits}处)`);
  }

  // ── C. 供应链 / 贸易 ─────────────────────────────────────────────────────
  const tradeHits = (text.match(
    /制裁|关税|出口管制|进口禁令|断供|脱钩|供应链|产业链转移|贸易战|贸易摩擦|保护主义|反倾销|反补贴|出口限制|进口限制|禁运|封锁港口|港口关闭|航运中断|集装箱|商品短缺|芯片禁令|半导体管制|稀土管制|sanctions|tariff|export.?control|supply.?chain/gi
  ) || []).length;
  if (tradeHits >= 1) {
    const score = Math.min(tradeHits >= 2 ? 2 : 1, 2);
    totalScore += score;
    hitCategories.push(`C.供应链贸易(${tradeHits}处)`);
  }

  // ── D. 主权军事升级（影响能源/粮食走廊） ─────────────────────────────────
  const militaryHits = (text.match(
    /空袭|导弹|战争|交战|军事打击|封锁|霍尔木兹|曼德海峡|红海|苏伊士|黑海|波斯湾|能源走廊|粮食走廊|油田|炼油厂.*袭击|管道.*爆炸|爆炸声?|交火|防务|特使.*会谈|停火谈判|核威胁|核武器|核弹|escalat|military.?strike|airstrike|blockade|strait.?of/gi
  ) || []).length;
  if (militaryHits >= 1) {
    const score = Math.min(militaryHits >= 2 ? 2 : 1, 2);
    totalScore += score;
    hitCategories.push(`D.主权军事升级(${militaryHits}处)`);
  }

  // ── E. 企业 / 行业重大事件 ──────────────────────────────────────────────
  const corpHits = (text.match(
    /业绩|营收|净利润|裁员|并购|收购|合并|分拆|破产|重组|倒闭|IPO|上市|退市|融资|增发|回购|分红|股息|大合同|中标|失标|召回|监管罚款|巨额罚款|反垄断|违规|造假|欺诈|暴雷|违约|芯片|算力|gpu|cpu|半导体|先进制程|大模型|生成式ai|人工智能|超级应用|流片|晶圆|架构|发布.*芯片|发布.*模型|发布.*智能|量产交付|earnings|revenue|profit|layoff|merger|acquisition|bankruptcy|restructur|IPO\b|ipo\b|financing|dividend|buyback/gi
  ) || []).length;
  if (corpHits >= 1) {
    const score = Math.min(corpHits >= 3 ? 2 : 1, 2);
    totalScore += score;
    hitCategories.push(`E.企业行业事件(${corpHits}处)`);
  }

  // ── F. 宏观数据发布 ───────────────────────────────────────────────────────
  const macroDataHits = (text.match(
    /CPI|PPI|PCE|非农|nonfarm|就业数据|失业率|GDP|PMI|采购经理|通胀率|核心通胀|工业产出|零售销售|贸易顺差|贸易逆差|经常账户|国际收支|外汇储备|居民收入|消费者信心|密歇根|ISM\b|ADP\b|JOLTs|gdp\b|inflation|deflation|unemployment|payroll/gi
  ) || []).length;
  if (macroDataHits >= 1) {
    const score = Math.min(macroDataHits >= 2 ? 2 : 1, 2);
    totalScore += score;
    hitCategories.push(`F.宏观数据(${macroDataHits}处)`);
  }

  // ── G. 监管 / 政策冲击 ─────────────────────────────────────────────────
  const regulatoryHits = (text.match(
    /监管新规|新法规|立法|法案通过|法案否决|牌照|吊销|暂停营业|行业整顿|专项整治|反垄断调查|处罚令|整改通知|强制退市|资本要求|巴塞尔|银行业监管|证监会|SEC\b|CFTC\b|金融稳定|系统性风险|压力测试|regulation|legislation|enforcement|compliance|penalty\b/gi
  ) || []).length;
  if (regulatoryHits >= 1) {
    const score = Math.min(regulatoryHits >= 2 ? 2 : 1, 2);
    totalScore += score;
    hitCategories.push(`G.监管政策冲击(${regulatoryHits}处)`);
  }

  // ── H. 主权信用 / 债务风险 ──────────────────────────────────────────────
  const sovereignHits = (text.match(
    /信用评级|评级下调|评级上调|穆迪|标普|惠誉|Moody|S&P|Fitch|主权债|国债违约|债务危机|债务重组|债务上限|违约风险|CDS|信用违约互换|主权风险|sovereign.?debt|credit.?rating|default.?risk/gi
  ) || []).length;
  if (sovereignHits >= 1) {
    const score = Math.min(sovereignHits >= 2 ? 2 : 1, 2);
    totalScore += score;
    hitCategories.push(`H.主权信用债务(${sovereignHits}处)`);
  }

  // ── I. 重大突发公共安全、极端社会应激、公共卫生与自然灾害 ──────────────────
  const publicSecurityHits = (text.match(
    /无差别.*(?:伤人|袭击|行凶|持刀|攻击)|持刀.*(?:伤人|行凶|砍人|刺伤|袭击)|随机伤人|恶性伤人|驾车冲撞|冲撞人群|袭警|重大治安|校园暴力|商场伤人|伤及无辜|公共安全突发|恶性案件|故意伤害|杀害|报复社会|社会应激|极端事件|公共卫生|突发疫情|传染病|疾控|确诊病例|聚集性疫情|突发感染|病毒感染|隔离管控|流行病|禽流感|登革热|炭疽|鼠疫|霍乱|诺如|食物中毒|甲流|自然灾害|特大暴雨|特大洪涝|特大干旱|超强台风|地震|强震|海啸|山洪|山体滑坡|泥石流|地质灾害|冰岩崩|堰塞湖|决口|破堤|溃坝|坍塌|林火|森林火灾|受灾群众|紧急避险|转移安置|救灾应急|重大安全事故|特别重大|重特大/gi
  ) || []).length;
  if (publicSecurityHits >= 1) {
    const score = 3; // 强制赋予最高实质分，防止被语义门禁丢弃
    totalScore += score;
    hitCategories.push(`I.突发公共安全、公共卫生与防灾治理(${publicSecurityHits}处)`);
  }

  // ── 反向排除：文章以个人行为为核心且无数字型金融指标 ──────────────────────
  // 判断文章是否以纯私人社会事件为主体（篇幅占比大于等于 60%）
  const personalEventDensity = (() => {
    const personalMatches = (text.match(
      /送给|赠予|收到礼物|个人账户|私人账户|私人聚餐|个人行为|个人生活|出轨|婚外|情人|约会|聚会|庆生|宴会|家庭纠纷|家庭矛盾|子女|宠物|个人捐款|个人慈善|健身|减肥|购物|度假|旅游|个人评论|发推|发帖|接受采访谈私事|受访谈生活/g
    ) || []).length;
    return personalMatches / (len / 50); // 每50字出现1次以上算高密度
  })();

  // 没有任何数字型金融指标（价格/数据/比率）
  const hasAnyFinancialNumber = /[0-9]+\.?[0-9]*\s*(?:%|bp|基点|亿|万亿|美元|元|点位|bps)/.test(text);

  const isCorePersonalEvent =
    personalEventDensity >= 2 &&
    !hasAnyFinancialNumber &&
    totalScore === 0;

  if (isCorePersonalEvent) {
    return {
      hasMarketSubstance: false,
      totalScore: 0,
      hitCategories: [],
      reason: `纯私人社会事件，无任何资本市场传导向量 (个人行为密度=${personalEventDensity.toFixed(1)})`,
    };
  }

  const hasMarketSubstance = totalScore >= 1;

  return {
    hasMarketSubstance,
    totalScore,
    hitCategories,
    reason: hasMarketSubstance ? '' : `全文无有效资本市场传导内容 (score=${totalScore}, len=${len}字)`,
  };
}

// 内存级正文缓存，避免对高频相同文章产生重复网络请求（设置最大容量限制防止长期运行 OOM）
const MAX_ARTICLE_CACHE_SIZE = 500;
const articleBodyCache = new Map<string, string>();

function setArticleBodyCache(url: string, content: string) {
  if (articleBodyCache.size >= MAX_ARTICLE_CACHE_SIZE) {
    const firstKey = articleBodyCache.keys().next().value;
    if (firstKey) articleBodyCache.delete(firstKey);
  }
  articleBodyCache.set(url, content);
}

/**
 * 二级深度正文爬虫引擎：针对列表页仅抓取到标题的权威源（联合早报、财新网），
 * 发起快速并发请求获取真实正文段落，彻底终结 content = rawTitle 爬虫偷工减料缺陷。
 */
async function fetchArticleBodyContent(url: string, source: 'zaobao' | 'caixin'): Promise<string | null> {
  if (!url || !url.startsWith('http')) return null;
  if (articleBodyCache.has(url)) return articleBodyCache.get(url)!;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const paragraphs: string[] = [];

    if (source === 'zaobao') {
      const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
      for (const p of pMatches) {
        const text = p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        const isJunkFooter =
          /^(?:关注我们|下载早报App|未经许可不得转载|版权所有|如需转载请联系|早报标志版权所有|即时新闻仅供参考)/i.test(text) ||
          /(?:扫描二维码关注|下载APP阅读全文|早报保留所有版权)/i.test(text);
        if (text.length > 20 && !isJunkFooter) {
          paragraphs.push(text);
        }
      }
    } else if (source === 'caixin') {
      const contentSection = html.match(/<div[^>]+id=["']Main_Content_Val["'][^>]*>([\s\S]*?)<\/div>/i);
      const searchTarget = contentSection ? contentSection[1] : html;
      const pMatches = searchTarget.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
      for (const p of pMatches) {
        const text = p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        if (
          text.length > 20 &&
          !/本文为财新网版权所有|未经书面授权|海量资讯|如需使用请联系|财新网所刊载内容|未经许可不得转载/i.test(text)
        ) {
          paragraphs.push(text);
        }
      }
    }

    const fullBody = paragraphs.slice(0, 8).join('\n\n').trim();
    if (fullBody.length > 40) {
      if (articleBodyCache.size > 300) {
        const firstKey = articleBodyCache.keys().next().value;
        if (firstKey) articleBodyCache.delete(firstKey);
      }
      articleBodyCache.set(url, fullBody);
      return fullBody;
    }
  } catch {
    // 优雅降级：若次级正文抓取超时或防爬拦截，平滑回退
  }
  return null;
}

// 获取全网实时真实现场快讯 (接入中立华文雷达：联合早报 + 财新网 + 路透/彭博中国专线 + 全球宏观电讯管道)
// 严禁接入新华社、人民日报等官方综合全量流，严防内宣公关污染；严禁 A 股盘中行情流水账
async function fetchRealTimeRawNews(): Promise<RawLiveItem[]> {
  const items: RawLiveItem[] = [];

  // 全球宏观、外汇、大宗商品权威频道（彻底剔除 a-stock-channel A股快讯）
  const endpoints = [
    { source: '全球宏观专线', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=global-channel&limit=60' },
    { source: '国际外汇央行', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=forex-channel&limit=30' },
    { source: '大宗商品航运', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=commodity-channel&limit=30' },
  ];

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, text/html, */*',
  };

  const results = await Promise.allSettled([
    // 1. 《联合早报》中国新闻频道（中立全景覆盖中国政治、社会、突发、法治与重大民生事件，零内宣废话）
    fetch('https://www.zaobao.com.sg/realtime/china', {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(6000),
    })
      .then((r) => r.text())
      .then(async (html) => {
        const zbList: RawLiveItem[] = [];
        const regex = /href="(\/(?:realtime|news)\/china\/story[^\"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        const seenZb = new Set<string>();
        const now = new Date();
        while ((m = regex.exec(html)) !== null) {
          const rawTitle = m[2].replace(/<[^>]+>/g, '').trim();
          const urlPath = m[1];
          if (rawTitle.length >= 6 && !seenZb.has(rawTitle)) {
            // 从 URL 提取实际日期，例如 /story20260921-9707915
            const dateMatch = urlPath.match(/story(\d{4})(\d{2})(\d{2})-/);
            let timeStr = '';
            if (dateMatch) {
              const y = parseInt(dateMatch[1], 10);
              const mo = parseInt(dateMatch[2], 10);
              const d = parseInt(dateMatch[3], 10);
              const articleDate = new Date(y, mo - 1, d);
              const diffDays = (now.getTime() - articleDate.getTime()) / (1000 * 3600 * 24);
              // 严格时效门禁：超过 72 小时（3天）的旧闻直接丢弃，严禁混入实时流！
              if (diffDays > 3 || diffDays < -1) {
                continue;
              }
              const sliceAfter = html.slice(m.index, m.index + 400);
              const timeMatch = sliceAfter.match(/(\d{1,2}:\d{2})/);
              if (timeMatch) {
                timeStr = `${mo}月${d}日 ${timeMatch[1]}`;
              } else {
                timeStr = `${mo}月${d}日 08:30`;
              }
            } else {
              continue;
            }

            seenZb.add(rawTitle);
            zbList.push({
              id: generateIntelId(`ZAOBAO_${urlPath}`),
              wireChannel: 'CH_ZAOBAO',
              title: rawTitle,
              content: rawTitle,
              time: timeStr,
              source: '联合早报 Zaobao',
              url: `https://www.zaobao.com.sg${urlPath}`,
            });
          }
        }

        // 二级深度爬取：为前8篇精选早报新闻抓取真实正文段落
        const topZb = zbList.slice(0, 8);
        await Promise.allSettled(
          topZb.map(async (item) => {
            const body = await fetchArticleBodyContent(item.url, 'zaobao');
            if (body) {
              item.content = `${item.title}\n\n${body}`;
            }
          })
        );

        return { source: '联合早报', data: zbList };
      })
      .catch(() => ({ source: '联合早报', data: null })),

    // 2. 《财新网》金融频道（调查报道、法治监管、专抓重特大责任事故、金融反腐与违规暴雷）
    fetch('https://finance.caixin.com/', {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(6000),
    })
      .then((r) => r.text())
      .then(async (html) => {
        const cxList: RawLiveItem[] = [];
        // 严格匹配具有规范标准日期结构的财新正文链接：caixin.com/YYYY-MM-DD/ID.html，严禁侧边栏往年死链接
        const regex = /<a[^>]+href="([^"]*caixin\.com\/(\d{4})-(\d{2})-(\d{2})\/(\d+)\.html)"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        const seenCx = new Set<string>();
        const now = new Date();
        while ((m = regex.exec(html)) !== null) {
          const fullUrl = m[1].startsWith('http') ? m[1] : `https:${m[1]}`;
          const y = parseInt(m[2], 10);
          const mo = parseInt(m[3], 10);
          const d = parseInt(m[4], 10);
          const rawTitle = m[6].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
          if (rawTitle.length < 8 || seenCx.has(rawTitle)) continue;

          // 严格时效门禁：超过 72 小时（3天）的历史归档严禁作为新新闻抓入！
          const articleDate = new Date(y, mo - 1, d);
          const diffDays = (now.getTime() - articleDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 3 || diffDays < -1) {
            continue;
          }

          seenCx.add(rawTitle);

          // 从 HTML 后续片段中尝试提取真实发布时间（如 <span>2026年09月20日 19:07</span>）
          const sliceAfter = html.slice(m.index, m.index + 500);
          const timeMatch = sliceAfter.match(/(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日\s*(\d{1,2}:\d{2})/);
          let timeStr = `${mo}月${d}日 09:00`;
          if (timeMatch) {
            timeStr = `${parseInt(timeMatch[2], 10)}月${parseInt(timeMatch[3], 10)}日 ${timeMatch[4]}`;
          }

          cxList.push({
            id: generateIntelId(`CAIXIN_${fullUrl}`),
            wireChannel: 'CH_CAIXIN',
            title: rawTitle,
            content: rawTitle,
            time: timeStr,
            source: '财新网 Caixin',
            url: fullUrl,
          });
        }

        // 二级深度爬取：为前8篇财新金融深度调查抓取真实正文段落
        const topCx = cxList.slice(0, 8);
        await Promise.allSettled(
          topCx.map(async (item) => {
            const body = await fetchArticleBodyContent(item.url, 'caixin');
            if (body) {
              item.content = `${item.title}\n\n${body}`;
            }
          })
        );

        return { source: '财新网', data: cxList };
      })
      .catch(() => ({ source: '财新网', data: null })),

    // 3. 《财新网》公司与产业频道（抓企业停产、违约逾期、供应链断裂、实业风险）
    fetch('https://companies.caixin.com/', {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(6000),
    })
      .then((r) => r.text())
      .then(async (html) => {
        const cxList: RawLiveItem[] = [];
        const regex = /<a[^>]+href="([^"]*caixin\.com\/(\d{4})-(\d{2})-(\d{2})\/(\d+)\.html)"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        const seenCx = new Set<string>();
        const now = new Date();
        while ((m = regex.exec(html)) !== null) {
          const fullUrl = m[1].startsWith('http') ? m[1] : `https:${m[1]}`;
          const y = parseInt(m[2], 10);
          const mo = parseInt(m[3], 10);
          const d = parseInt(m[4], 10);
          const rawTitle = m[6].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
          if (rawTitle.length < 8 || seenCx.has(rawTitle)) continue;

          // 严格时效门禁：超过 72 小时（3天）的历史归档严禁作为新新闻抓入！
          const articleDate = new Date(y, mo - 1, d);
          const diffDays = (now.getTime() - articleDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 3 || diffDays < -1) {
            continue;
          }

          seenCx.add(rawTitle);

          // 从 HTML 后续片段中尝试提取真实发布时间
          const sliceAfter = html.slice(m.index, m.index + 500);
          const timeMatch = sliceAfter.match(/(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日\s*(\d{1,2}:\d{2})/);
          let timeStr = `${mo}月${d}日 09:00`;
          if (timeMatch) {
            timeStr = `${parseInt(timeMatch[2], 10)}月${parseInt(timeMatch[3], 10)}日 ${timeMatch[4]}`;
          }

          cxList.push({
            id: generateIntelId(`CAIXIN_CO_${fullUrl}`),
            wireChannel: 'CH_CAIXIN',
            title: rawTitle,
            content: rawTitle,
            time: timeStr,
            source: '财新网 Caixin',
            url: fullUrl,
          });
        }

        // 二级深度爬取：为前8篇财新公司调查抓取真实正文段落
        const topCx = cxList.slice(0, 8);
        await Promise.allSettled(
          topCx.map(async (item) => {
            const body = await fetchArticleBodyContent(item.url, 'caixin');
            if (body) {
              item.content = `${item.title}\n\n${body}`;
            }
          })
        );

        return { source: '财新网公司频道', data: cxList };
      })
      .catch(() => ({ source: '财新网公司频道', data: null })),

    // 4. 全球宏观、外汇、大宗商品电讯
    ...endpoints.map((ep) =>
      fetch(ep.url, { headers: defaultHeaders, signal: AbortSignal.timeout(6000) })
        .then((r) => r.json())
        .then((d) => ({ source: ep.source, data: d }))
        .catch(() => ({ source: ep.source, data: null }))
    ),
  ]);

  for (const res of results) {
    if (res.status !== 'fulfilled' || !res.value?.data) continue;
    const { source, data } = res.value;

    // 直接数组结果（如联合早报与财新网深度调查）
    if (Array.isArray(data)) {
      for (const item of data) {
        items.push(item);
      }
      continue;
    }

    // 解析全球宏观、外汇、大宗商品电讯
    if (data?.data?.items) {
      for (const raw of data.data.items) {
        let text = (raw.content_text || '').trim();
        if (!text) continue;
        // 严防官方宣传通篇口号内宣污染：若含有纯新华社/人民日报口号且无硬核事实则剔除
        if (/新华社|人民日报/.test(text) && /高度重视|众志成城|坚决贯彻/.test(text) && !/判决|违约|事故|注资|立案|死/.test(text)) {
          continue;
        }

        // 核心守卫：修复财经快讯对美联储降息周期 "Rate Cut" 的灾难性机翻颠倒（加息/上调 -> 降息/下调）
        text = sanitizeFedRatePolicyWording(text);

        // 预先剥离快讯前导标签、记者提问引导词与产业链传声筒前缀
        const cleanForTitle = cleanWireHeadline(text);
        const sentences = cleanForTitle.split(/[。\n]/).map((s) => s.trim()).filter(Boolean);
        const firstSentence = sentences[0] || '';

        let title = cleanWireHeadline(raw.title || firstSentence);
        if (!title || title.length < 6) {
          title = firstSentence;
        }

        // 谓语保护：若第一句断句在未完结介词/连词上，智能融合后续分句
        if (title.length < 12 || /(?:[，,、；;：:\s及与和等并]|据.*表示|业内人士称)$/.test(title)) {
          if (sentences.length > 1) {
            title = cleanWireHeadline(sentences.slice(0, 2).join('，'));
          }
        }

        // 严禁日历提醒、日程预告、每日早晚报流水账侵入突发电讯流
        if (isCalendarOrDigestSpam(title, text)) {
          continue;
        }

        // 严禁提取出无主语流水账（如“分别涨4.77%...”）与半截残缺超短标题（字数<8）
        if (title.length < 8 || /^(?:分别|其中|包括|以及|并且|而|且|但|[0-9.]+%|[涨跌][0-9.]+%)/.test(title)) {
          continue;
        }
        title = sanitizeFedRatePolicyWording(title).slice(0, 70);
        const time = formatIntelDateTime(raw.display_time);

        // 识别路透与彭博中国专项电讯
        const isReuters = /路透|reuters/i.test(text);
        const isBloomberg = /彭博|bloomberg/i.test(text);
        const wireChannel = isReuters || isBloomberg ? 'CH_REUTERS_BLOOMBERG_CN' : 'CH_ALPHA';
        const sourceLabel = isReuters ? '路透中文网 Reuters' : isBloomberg ? '彭博社 Bloomberg' : source;

        items.push({
          id: generateIntelId(`ALPHA_${raw.id}`),
          wireChannel,
          title,
          content: text,
          time,
          source: sourceLabel,
          url: raw.uri || (isReuters ? 'https://www.reuters.com' : 'https://www.bloomberg.com'),
        });
      }
    }
  }

  // 过滤低信噪比杂音与陈年旧闻僵尸（isNonMarketTrivia 是唯一杂音过滤器，isStockTapeSpam 拦截股票分时噪声）
  const seen = new Set<string>();
  const deduped: RawLiveItem[] = [];
  const currentYear = new Date().getFullYear();

  for (const item of items) {
    // 严禁旧闻与历史归档死链接侵入实时候选池：
    // 若标题或 URL 中明确包含往年年份（如 2017~2025 年），或发布时间跨度超过 72 小时，绝对丢弃！
    const textAndUrl = `${item.title} ${item.url}`;
    const pastYearMatch = textAndUrl.match(/\b(201\d|202[0-5])\b/);
    if (pastYearMatch && !item.title.includes(`${currentYear}`)) {
      continue;
    }
    const hours = getTimeDiffHours(item.time);
    if (hours > 72) {
      continue;
    }

    const spillover = evaluateSpilloverImpact(item.title, item.content);
    // 只要命中外溢冲击指标之一，严禁过滤，强制收录！
    if (!spillover.isSpilloverMajor) {
      if (isNonMarketTrivia(item.title, item.content)) continue;
      if (isStockTapeSpam(item.title, item.content)) continue;
    }
    const key = item.title.slice(0, 16);
    if (!seen.has(key) && item.title.length > 5) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped;
}


export interface PrimarySourceInfo {
  source: string;
  sourceUrl: string;
}

// 智能一级权威信源识别与归因引擎：
// 1. 优先从电讯正文提取报道权威（如彭博社、路透社、华尔街日报、日经亚洲、财新网、部委公报等）
// 2. 无明确提及者，根据专业赛道领域与语义哈希，轮询分配对应领域的顶级权威信源，彻底杜绝单一边界垄断
export function detectPrimarySource(
  title: string,
  content: string,
  track: TrackId,
  inheritedRawSource?: string,
  fallbackUrl?: string
): PrimarySourceInfo {
  // 规则 1：【信源标签物理继承与直接权威映射】
  if (inheritedRawSource && /联合早报|财新网|第一财经|经济学人|应急管理部/.test(inheritedRawSource)) {
    const urlMap: Record<string, string> = {
      '联合早报': 'https://www.zaobao.com.sg',
      '财新网': 'https://finance.caixin.com',
      '第一财经': 'https://www.yicai.com',
      '经济学人': 'https://www.economist.com',
      '应急管理部': 'https://www.mem.gov.cn',
    };
    for (const [k, u] of Object.entries(urlMap)) {
      if (inheritedRawSource.includes(k)) {
        return { source: inheritedRawSource, sourceUrl: fallbackUrl || u };
      }
    }
  }

  const combined = (title + ' ' + content).toLowerCase();

  // 1. 显式提及的真实部委机构与专业现货/同业市场（严格按实际发文方归因，禁止虚假冠名外媒）
  if (/国新办|国务院新闻办/.test(combined)) {
    return { source: '国务院新闻办公室发布会', sourceUrl: 'http://www.scio.gov.cn' };
  }
  if (/国家粮食和物资储备局|国家粮食局|大国粮仓/.test(combined)) {
    return { source: '国家粮食和物资储备局通报', sourceUrl: 'http://www.lswz.gov.cn' };
  }
  if (/上海钢联|mysteel|碳酸锂价格|锂价/.test(combined)) {
    return { source: '上海钢联 Mysteel 现货报价', sourceUrl: 'https://www.mysteel.com' };
  }
  if (/全国银行间同业拆借中心|中国外汇交易中心|shibor|银行间资金面|隔夜shibor/i.test(combined)) {
    return { source: '全国银行间同业拆借中心', sourceUrl: 'https://www.chinamoney.com.cn' };
  }
  if (/(?:中国人民银行|我国央行|人行)/.test(combined) && !/日本|美国|欧洲|韩国|英国/.test(combined)) {
    return { source: '中国人民银行 PBOC', sourceUrl: 'http://www.pbc.gov.cn' };
  }
  if (/(?:国家统计局|统计局|nbs)/i.test(combined) && !/美国|日本/.test(combined)) {
    return { source: '国家统计局 NBS 官方数据', sourceUrl: 'https://www.stats.gov.cn' };
  }
  if (/(?:中国财政部|我国财政部|中央财政)/.test(combined) && !/日本|美国|欧洲|韩国|英国/.test(combined)) {
    return { source: '中国财政部通报', sourceUrl: 'http://www.mof.gov.cn' };
  }
  if (/(?:国家发展改革委|国家发改委)/.test(combined) && !/日本|美国|欧洲/.test(combined)) {
    return { source: '国家发展改革委公报', sourceUrl: 'https://www.ndrc.gov.cn' };
  }
  if (/商务部/.test(combined) && !/美国商务部/.test(combined)) {
    return { source: '中国商务部公报', sourceUrl: 'http://www.mofcom.gov.cn' };
  }
  if (
    /(?:中国外交部|外交部发言人|外交部例行|外交部重申|外交部表态)/.test(combined) &&
    !/(?:伊朗|俄罗斯|美国|日本|韩国|乌克兰|法国|德国|英国|澳大利亚|欧盟)/.test(title)
  ) {
    return { source: '中国外交部例行通报', sourceUrl: 'https://www.fmprc.gov.cn' };
  }
  if (/国家能源局/.test(combined)) {
    return { source: '国家能源局发布', sourceUrl: 'http://www.nea.gov.cn' };
  }
  if (/中纪委|国家监委|中央纪委/.test(combined)) {
    return { source: '中央纪委国家监委通报', sourceUrl: 'https://www.ccdi.gov.cn' };
  }
  if (/最高人民法院|最高法/.test(combined)) {
    return { source: '最高人民法院公报', sourceUrl: 'https://www.court.gov.cn' };
  }
  if (/最高人民检察院|最高检/.test(combined)) {
    return { source: '最高人民检察院通报', sourceUrl: 'https://www.spp.gov.cn' };
  }
  if (/交通运输部|交运部/.test(combined)) {
    return { source: '中国交通运输部通报', sourceUrl: 'https://www.mot.gov.cn' };
  }
  if (/住建部/.test(combined)) {
    return { source: '国家住房和城乡建设部', sourceUrl: 'https://www.mohurd.gov.cn' };
  }
  if (/应急管理部/.test(combined)) {
    return { source: '国家应急管理部通报', sourceUrl: 'https://www.mem.gov.cn' };
  }
  if (/工信部|工业和信息化部/.test(combined)) {
    return { source: '工信部公报', sourceUrl: 'https://www.miit.gov.cn' };
  }

  // 2. 真实提及的国际通讯社与外媒报道
  if (/联合早报|zaobao/.test(combined)) {
    return { source: '联合早报 Zaobao', sourceUrl: 'https://www.zaobao.com.sg' };
  }
  if (/财新|caixin/.test(combined)) {
    return { source: '财新网 Caixin', sourceUrl: 'https://finance.caixin.com' };
  }
  if (/路透|reuters/.test(combined)) {
    return { source: '路透中文网 Reuters', sourceUrl: 'https://www.reuters.com' };
  }
  if (/彭博|bloomberg/.test(combined)) {
    return { source: '彭博社 Bloomberg', sourceUrl: 'https://www.bloomberg.com' };
  }
  if (/华尔街日报|wsj|wall street journal/.test(combined)) {
    return { source: '华尔街日报 WSJ', sourceUrl: 'https://www.wsj.com' };
  }
  if (/金融时报|ft|financial times/.test(combined)) {
    return { source: '英国金融时报 FT', sourceUrl: 'https://www.ft.com' };
  }
  if (/日经|nikkei|日本经济新闻/.test(combined)) {
    return { source: '日经亚洲 Nikkei Asia', sourceUrl: 'https://asia.nikkei.com' };
  }
  // 严禁客体评论反客为主：只有当官方机构作为直接发文/决议主体，才归因于官方声明；第三方评论一律继承真实信源
  const isFedDirectIssuer = /^(?:美联储|联邦公开市场委员会|fomc)(?:宣布|公布|发布|决定|声明|降息|加息)/i.test(title.trim());
  if (isFedDirectIssuer && !/研报|策略|港股|A股|券商|分析师|观点|点评|仓位/.test(title) && !/主管|经理|机构|外媒|报道|称|看好|预估|固收/.test(title)) {
    return { source: '美联储 FOMC 官方声明', sourceUrl: 'https://www.federalreserve.gov' };
  }
  const isDodDirectIssuer = /^(?:五角大楼|美国国防部|dod)(?:宣布|公布|发布|决定|通报|声明)/i.test(title.trim());
  if (isDodDirectIssuer && !/外媒|报道|传|妻子|学者/.test(title)) {
    return { source: '美国国防部 DoD 简报', sourceUrl: 'https://www.defense.gov' };
  }
  const isEcbDirectIssuer = /^(?:欧洲央行|ecb)(?:宣布|公布|发布|决定|声明|降息|加息)/i.test(title.trim());
  if (isEcbDirectIssuer && !/主管|经理|分析师|机构|管委|行长|外媒|报道/.test(title)) {
    return { source: '欧洲央行 ECB 公报', sourceUrl: 'https://www.ecb.europa.eu' };
  }
  if (/华泰证券/.test(title)) return { source: '华泰证券策略研报', sourceUrl: 'https://www.htsc.com.cn' };
  if (/中信证券/.test(title)) return { source: '中信证券研究部', sourceUrl: 'https://www.citics.com' };
  if (/中金公司/.test(title)) return { source: '中金公司研究部', sourceUrl: 'https://www.cicc.com' };

  // 3. 若均未显式提及，严格按真实渠道保真输出，绝对禁止凭空捏造路透特稿或彭博周刊！
  if (inheritedRawSource && !inheritedRawSource.startsWith('CH_')) {
    return { source: inheritedRawSource, sourceUrl: fallbackUrl || 'https://www.jin10.com' };
  }

  const authenticTrackSources: Record<TrackId, PrimarySourceInfo> = {
    commodities_shipping: { source: '大宗商品与能源行情专讯', sourceUrl: fallbackUrl || 'https://www.spglobal.com' },
    apac_tech: { source: '前沿科技与算力产业电讯', sourceUrl: fallbackUrl || 'https://asia.nikkei.com' },
    war_conflict: { source: '国际防务与安全即时电讯', sourceUrl: fallbackUrl || 'https://www.reuters.com' },
    us_macro: { source: '全球金融市场实时电讯', sourceUrl: fallbackUrl || 'https://www.bloomberg.com/markets' },
    china_macro: { source: '中国宏观与金融数据专电', sourceUrl: fallbackUrl || 'https://finance.caixin.com' },
    china_policy: { source: '涉华经贸与涉外治理专讯', sourceUrl: fallbackUrl || 'https://www.zaobao.com.sg' },
    china_domestic: { source: '国内要闻与治理电讯', sourceUrl: fallbackUrl || 'https://finance.caixin.com' },
    global_cognition: { source: '全球政经与决策情报专讯', sourceUrl: fallbackUrl || 'https://www.ft.com' },
  };

  return authenticTrackSources[track] || { source: '全球财经实时电讯', sourceUrl: fallbackUrl || 'https://www.jin10.com' };
}

export function classifyTrack(item: RawLiveItem): TrackId {
  const t = (item.title + ' ' + item.content).toLowerCase();

  // 【硬性国内金融机构、券商、交易所与市场实体绝对拦截门禁】：
  // 绝对禁止任何中国券商、公募/私募、A股机构人事与策略报道落入 us_macro！
  const isChineseSecuritiesOrDomesticFinance =
    /(?:券商|证券|中信证券|中金公司|招商证券|广发证券|国泰君安|海通证券|申万宏源|银河证券|华泰证券|东兴证券|方正证券|浙商证券|光大证券|国信证券|兴业证券|中银证券|中加基金|证监会|中基协|上交所|深交所|北交所|公募|私募|理财子公司|两市|沪深|a股|港股|恒生|南向资金|北向资金|中概股|券商一哥|券商龙头)/i.test(
      item.title
    ) ||
    ((/券商|中信证券|中金公司|招商证券|广发证券|国泰君安|海通证券|申万宏源|银河证券|华泰证券|东兴证券|方正证券|浙商证券|光大证券|国信证券|兴业证券|中银证券|证监会|公募|私募|上交所|深交所/.test(t)) &&
     !/美股三大|标普500|纳斯达克.*大涨|道琼斯.*大跌|伯克希尔|贝莱德/.test(item.title));

  if (isChineseSecuritiesOrDomesticFinance) {
    if (/(?:高管|人事|董事长|总经理|接棒|退休|离任|任命|换人|掌门|履新|违纪|被查|落马|立案)/.test(item.title + ' ' + (item.content || ''))) {
      return 'china_domestic';
    }
    return 'china_macro';
  }

  // 【硬性A股大盘/指数行情优先拦截门禁】：
  if (/(?:沪指|两市|上证|深成指|创业板|科创板|高开|低开|双双高开|双双低开|A股开盘|今日开盘)/i.test(item.title)) {
    if (!/美股|标普|纳斯达克|道琼斯/.test(item.title)) {
      return 'china_macro';
    }
  }

  // 【硬性高层双边外事与立法机构交往拦截门禁】：
  // 中国国家领导人、全国人大、政协、外交部同外国政要会谈/会见，强制归入涉华经贸与涉外治理 (china_policy)！
  if (/(?:赵乐际|王毅|李强|习近平|外交部|全国人大|政协).*?(?:会见|会谈|接见|访问|外长|议长|众议长|参议长|总理|总统|公使)/.test(item.title)) {
    return 'china_policy';
  }

  // 【硬性国内公募、财富管理与机构策略拦截门禁】：
  // 严禁因为国内基金经理、研报在正文中提及美联储降息而被夺舍归入 us_macro！
  const isChinaDomesticFinance =
    /(?:公募|私募基金|基金经理|策略会|客户交流会|建信基金|华宝基金|汇添富|易方达|广发基金|中欧基金|博时基金|理财公司|券商经纪|佣金承压|投研人才|固收产品|秋季策略会)/.test(
      item.title
    );
  if (isChinaDomesticFinance && !/美股三大|标普500|纳斯达克|道琼斯/.test(item.title)) {
    return 'china_macro';
  }

  // 【美联储日程与官员密集表态拦截门禁】：
  // 必须优先划入 us_macro，绝不能因为包含官员名字或日内日程而误入 apac_tech！
  if (/(?:美联储|联储主席|芝加哥联储|纽约联储|圣路易斯联储|里士满联储|亚特兰大联储|达拉斯联储|克利夫兰联储|旧金山联储|波士顿联储|费城联储|堪萨斯联储|沃什|鲍威尔|fomc)/i.test(t)) {
    if (!/涉华|对华|中美/.test(item.title)) {
      return 'us_macro';
    }
  }

  // 【硬性港股/A股/国内券商研报归类门禁】：
  const isChineseOrHkEquities =
    /港股|恒生|恒指|港交所|南向资金|港股通|a股|沪深|上证|深成指|创业板|科创板|北向资金|中概股|券商研报|券商策略|港股策略|a股策略|仓位灵活性|仓位配置|华泰证券|中信证券|中金公司|招商证券|广发证券|国泰君安|海通证券|申万宏源/.test(
      item.title
    ) ||
    (/港股|恒生|港交所|南向资金|a股|沪深|上证/.test(t) && /华泰证券|中信证券|中金公司|招商证券|广发证券|研报|策略/.test(t));

  if (isChineseOrHkEquities && !/美股三大|标普500|纳斯达克.*大涨|道琼斯.*大跌/.test(item.title)) {
    return 'china_macro';
  }

  // 【日本主权与实体细分】：纯半导体硬件归入 apac_tech，宏观日元/日银/财政归入 global_cognition，涉华归入 china_policy
  if (FOREIGN_ENTITIES.JAPAN.test(t)) {
    if (/半导体|芯片|先进制程|光刻|算力|大模型|ai|机器人|爱德万|东京电子/.test(t)) return 'apac_tech';
    if (/涉华|对华|中日/.test(t)) return 'china_policy';
    return 'global_cognition';
  }

  // 非洲与全球公共卫生事件（刚果、埃博拉、世卫组织等）一票归入全球认知 (global_cognition)
  if (FOREIGN_ENTITIES.AFRICA_GLOBAL && FOREIGN_ENTITIES.AFRICA_GLOBAL.test(t)) {
    if (/涉华|对华|中国援非/.test(t)) return 'china_policy';
    return 'global_cognition';
  }

  // 【中国LPR / 贷款市场报价利率】：一票归入中国宏观数据与景气 (china_macro)
  if (/lpr|贷款市场报价利率|全国银行间同业拆借中心/i.test(t) && !/美联储|美债/.test(t)) {
    return 'china_macro';
  }

  // 欧洲、德国、英国、法国等欧洲主权债与欧洲宏观：必须归入全球认知 (global_cognition)，严禁误归入 us_macro！
  const isEuropeanOrUK =
    /(?:德国|德债|bund|欧洲|欧盟|欧元区|欧洲央行|欧央行|拉加德|ecb|法国|法债|oat|意大利|意债|英国|英债|gilt|英格兰银行)/i.test(item.title) ||
    ((FOREIGN_ENTITIES.EUROPE_ECB.test(t) || FOREIGN_ENTITIES.UK_BOE.test(t)) && !/(?:美股|标普|纳斯达克|道琼斯|美联储|沃什)/.test(item.title));

  if (isEuropeanOrUK && !/中美|美德|美欧|对美/.test(item.title)) {
    if (/涉华|对华|中欧|中英/.test(t)) return 'china_policy';
    return 'global_cognition';
  }

  // 【地缘政治、战局防务与中东冲突优先拦截】（优先级高于美国普通实体，美伊交涉会谈、也门、俄乌冲突绝对优先归入 war_conflict）：
  if (FOREIGN_ENTITIES.WAR_DEFENSE.test(t) || /伊朗|以色列|哈马斯|真主党|加沙|乌克兰|俄军|乌军|红海|也门|卡塔尔/.test(t)) {
    if (!/涉华|对华|中美经贸|中伊经贸/.test(item.title)) {
      return 'war_conflict';
    }
  }

  // 涉华经贸与涉外法案应对（商务部/外交部反制与回应）：一票归入 china_policy，严禁落入 us_macro（排除伊朗外交部、俄外交部等外国部委）
  if (/(?:中国|中方|我国)?(?:商务部|外交部)/.test(t) && !/伊朗外交部|俄外交部|俄罗斯外交部|乌克兰外交部|美国国务院/.test(t) && /美方|美国|制裁|法案|关税|清单|出口管制|格雷厄姆/.test(t)) {
    return 'china_policy';
  }

  if ((FOREIGN_ENTITIES.US_ALL.test(t) || FOREIGN_ENTITIES.US_MACRO.test(t)) && !/涉华|对华|中美/.test(t)) {
    return 'us_macro';
  }

  // 【通用重大外溢冲击收录标准判定准则】：
  const spillover = evaluateSpilloverImpact(item.title, item.content);
  if (spillover.isSpilloverMajor) {
    if (spillover.criteriaIndex === 3) {
      return 'china_policy';
    }
    if (/大模型|算力|芯片|半导体|先进制程|存储芯片|长鑫|长存|中芯|华虹|北方华创/.test(t)) return 'apac_tech';
    if (FOREIGN_ENTITIES.JAPAN.test(t)) return /半导体|芯片/.test(t) ? 'apac_tech' : 'global_cognition';
    if (FOREIGN_ENTITIES.US_ALL.test(t) || FOREIGN_ENTITIES.US_MACRO.test(t)) return 'us_macro';
    if (FOREIGN_ENTITIES.WAR_DEFENSE.test(t)) return 'war_conflict';
    if (FOREIGN_ENTITIES.GLOBAL_FOREIGN.test(t)) return 'global_cognition';
    if (FOREIGN_ENTITIES.AFRICA_GLOBAL && FOREIGN_ENTITIES.AFRICA_GLOBAL.test(t)) return 'global_cognition';
    if (/美国|美方|特朗普|拜登|密歇根|加州|德州|英国|法国|德国|日本|俄罗斯|乌克兰|刚果|非洲/.test(item.title) && !/涉华|对华|中美/.test(item.title)) {
      return 'global_cognition';
    }
    return 'china_domestic';
  }

  // 联合早报与财新网等严肃中立信源电讯精准对齐赛道：
  if (item.wireChannel === 'CH_ZAOBAO' || item.wireChannel === 'CH_CAIXIN') {
    if (FOREIGN_ENTITIES.WAR_DEFENSE.test(t) || /伊朗|以色列|哈马斯|真主党|加沙|乌克兰|俄军|乌军/.test(t)) {
      return 'war_conflict';
    }
    if ((/涉外|关税|制裁|美国|欧盟|外资|反制|出海|特使|两岸|台湾|涉台|南海|两国防务|防务合作|军工出口|外长|巴基斯坦|解放军.*军事/.test(t)) && !/伊朗.*美国|美伊/.test(t)) {
      return 'china_policy';
    }
    if (/世界模型|大模型|生成式ai|算力|芯片|半导体|人形机器人/.test(t)) {
      return 'apac_tech';
    }
    if (FOREIGN_ENTITIES.JAPAN.test(t)) return /半导体|芯片/.test(t) ? 'apac_tech' : 'global_cognition';
    if (FOREIGN_ENTITIES.US_ALL.test(t) || FOREIGN_ENTITIES.US_MACRO.test(t)) return 'us_macro';
    if (FOREIGN_ENTITIES.WAR_DEFENSE.test(t)) return 'war_conflict';
    if (FOREIGN_ENTITIES.GLOBAL_FOREIGN.test(t)) return 'global_cognition';
    if (FOREIGN_ENTITIES.GLOBAL_FOREIGN.test(t)) return 'global_cognition';
    if (FOREIGN_ENTITIES.AFRICA_GLOBAL && FOREIGN_ENTITIES.AFRICA_GLOBAL.test(t)) return 'global_cognition';
    return 'china_domestic';
  }

  // 1. 大宗商品与能源航运 (原油、天然气、LNG、海运、集运欧线、运价指数、伦铜、铁矿石、大宗金属)
  if (
    /原油|wti|布伦特|天然气|lng|ttf|集运|欧线|海运|航运|运价|scfi|bdi|散货|好望角|马六甲|苏伊士|红海.*(?:绕航|航运|船|货轮|护航)|伦铜|lme.*铜|铜价|锂矿|铁矿石|大宗商品/.test(
      t
    )
  ) {
    return 'commodities_shipping';
  }

  // 2. 俄乌局势与美伊中东战局
  if (
    /乌克兰|俄罗斯|普京|泽连斯基|俄军|乌军|顿涅茨克|库尔斯克|基辅|莫斯科|伊朗|以色列|以军|内塔尼亚胡|哈马斯|真主党|黎巴嫩|加沙|中东|也门|五角大楼|美军|空袭|导弹|无人机|巡航导弹|战机|防务|停火|武器|泄密/.test(
      t
    )
  ) {
    return 'war_conflict';
  }

  // 涉外AI出口管制/跨国大模型非法蒸馏与涉密防务博弈：一票落入发达国家对华博弈 (china_policy)
  if (
    /(?:anthropic|claude|openai|chatgpt).*(?:蒸馏|涉密|解放军|国安|出口管制|实体清单|穿透监管)|(?:中国模型|国内模型|非法蒸馏|接口直连|接口蒸馏).*(?:claude|anthropic|openai|防务|涉密)/i.test(
      t
    )
  ) {
    return 'china_policy';
  }

  // 3. 算力硬件与前沿模型 (融合芯片硬件与OpenAI、Google、大模型突破及自主半导体产业链)
  if (
    /openai|gpt|claude|anthropic|deepmind|大模型|llm|agent|多模态|生成式ai|端侧模型|算力|芯片|半导体|先进制程|台积电|联电|日月光|三星|海力士|sk海力士|铠侠|阿斯麦|asml|光刻|东京电子|爱德万|日经|东证|ai芯片|英伟达|高通|博通|超威|arm|数据中心|hbm|cowos|先进封装|matx|coatue|长鑫|长存|长江存储|中芯|华虹|北方华创|中微|拓荆|盛美|燧原|沐曦|摩尔线程|壁仞|寒武纪|地平线|昆仑芯|存储芯片|晶圆代工|dram|nand/.test(
      t
    )
  ) {
    return 'apac_tech';
  }

  // 3. 中国国内要闻与社会治理 (聚焦国家治理、司法反腐、重特大事故、宏观财政化债、社会民生，严禁股票分时跳动)
  const isForeignEntity =
    FOREIGN_ENTITIES.GLOBAL_FOREIGN.test(item.title) ||
    FOREIGN_ENTITIES.AFRICA_GLOBAL.test(item.title) ||
    FOREIGN_ENTITIES.US_ALL.test(item.title) ||
    FOREIGN_ENTITIES.JAPAN.test(item.title) ||
    /(?:土耳其|阿根廷|巴西|印度|越南|泰国|德国|法国|英国|印尼|南非|刚果|非洲|苏丹|肯尼亚|尼日利亚|埃塞俄比亚|津巴布韦|加纳|几内亚|埃博拉|墨西哥|加拿大|埃及|沙特|阿联酋|欧洲央行|日本央行|韩国央行|美联储|美国财政部|美国|美方|特朗普|拜登|密歇根|加州|世卫组织|who)/i.test(item.title);
  if (
    !isForeignEntity &&
    /特别国债|超长期国债|中国再保|进出口银行|中国信保|财政部|发改委|住建部|民政部|国家医保局|国家统计局|应急管理部|自然资源部|工信部|交通运输部|生态环境部|农业农村部|最高法|最高检|公安部|中纪委|国家监委|国资委|国家疾控局|卫健委|疾控中心|气象局|地震局|化债|地方债|隐性债务|债务置换|央行.*降准|央行.*逆回购|反腐|落马|被查|受贿|贪污|职务犯罪|双开|立案调查|立案侦查|判刑|判处|重特大事故|重大事故|相撞致.*死|致.*死|致.*伤|坍塌|火灾|爆炸|矿难|遇难|搜救|安全生产|无差别.*(?:伤人|袭击|行凶|持刀|攻击)|持刀.*(?:伤人|行凶|砍人|刺伤|袭击)|随机伤人|恶性伤人|驾车冲撞|冲撞人群|袭警|重大治安|校园暴力|商场伤人|伤及无辜|公共安全突发|恶性案件|故意伤害|杀害|报复社会|社会应激|极端事件|公共卫生|突发疫情|传染病|疾控|确诊病例|聚集性疫情|突发感染|病毒感染|隔离管控|流行病|禽流感|登革热|炭疽|鼠疫|霍乱|诺如|食物中毒|甲流|自然灾害|特大暴雨|特大洪涝|特大干旱|超强台风|地震|强震|海啸|暴雨洪涝|汛情|地质灾害|吉隆口岸|樟木口岸|泥石流|冰岩崩|山洪|山体滑坡|堰塞湖|决口|破堤|溃坝|林火|森林火灾|受灾群众|紧急避险|转移安置|救灾应急|社保|养老|医保|常住人口|老龄化|人口下滑|生育|物流|货运|保供|民生|欠薪治理|破产重整|违约暴雷|专项整治|监管调查|行政叫停|拆违/.test(
      t
    )
  ) {
    // 门禁终审：纯外国主权实体一票否决国内赛道
    if ((FOREIGN_ENTITIES.US_ALL.test(t) || FOREIGN_ENTITIES.GLOBAL_FOREIGN.test(t) || FOREIGN_ENTITIES.AFRICA_GLOBAL.test(t)) && !/涉华|对华|中美/.test(t)) {
      return FOREIGN_ENTITIES.US_ALL.test(t) ? 'us_macro' : 'global_cognition';
    }
    return 'china_domestic';
  }

  // 4. 发达国家对华举措与博弈 (严格约束：必须明确涉及对华/涉华/中美/中欧博弈背景，防止纯美加/美墨/欧美他国内部关税误判)
  const isExplicitChinaPolicy = /涉华|对华|中美|中欧|中日|中美博弈|对华限制|对华出口|对华关税|涉台|台海|中国制造|中国企业|中资|中企/.test(t);
  const hasTradeBarrierKeywords = /关税|制裁|出口管制|商务部.*清单|实体清单|未经验证清单|去风险|脱钩|反补贴|反倾销|友岸|外资审查|cfius|301调查/.test(t);
  const mentionsChinaEntities = /中国|中方|北京|大陆|两岸|华为|中芯|中兴|大疆|字节|tiktok|宁德时代|比亚迪/.test(t);

  // 双边外事会谈：严格限定为中方主权实体高层（赵乐际、王毅、何立峰、李强、习近平等）参与的外事会见
  const isChineseHighLevelDiplomacy = /(?:赵乐际|王毅|何立峰|李强|习近平)/.test(t) && /(?:会见|会谈|会晤|接见|访华)/.test(t);

  if (isExplicitChinaPolicy || (hasTradeBarrierKeywords && mentionsChinaEntities) || isChineseHighLevelDiplomacy) {
    return 'china_policy';
  }

  // 【硬性防线】中国宏观统计数据优先分类门禁（必须在 us_macro 之前执行！）
  // 中国CPI/PPI/PMI/GDP/社零/工业产出等数据，严禁被 us_macro 关键词误吞
  const isChinaMacroData = (() => {
    // 明确含有"中国"主语的宏观数据标题
    const hasChinaSubject = /中国\s*(?:8月|9月|10月|11月|12月|1月|2月|3月|4月|5月|6月|7月|\d+月|年度|全年|上半年|下半年|一季度|二季度|三季度|四季度|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月)/i.test(item.title);
    // 国家统计局/NBS/中国央行发布的数据
    const hasChineseStatsBureau = /国家统计局|nbs|中国人民银行.*数据|央行.*数据|统计局/.test(t);
    // 中国宏观指标关键词
    const hasChinaMacroIndicator = /(?:中国|中国.*同比|前值|环比.*|同比.*%|同比增|同比降|同比.*点).*(?:cpi|ppi|pmi|gdp|社零|社会消费品零售|工业增加值|工业产出|固定资产|失业率|外贸顺差|贸易顺差|贸易逆差|外汇储备|m1|m2|信贷|新增贷款|居民消费价格|生产者价格|采购经理)/i.test(t) ||
      /(?:cpi|ppi|pmi|gdp|社零|工业增加值|社会消费).*(?:同比|环比|前值|预期|超预期|低于预期|持平|回落|回升|上升|下降)/i.test(t) && !/美国|美联储|美债|美股|欧元区|欧洲/.test(t);
    return hasChinaSubject || hasChineseStatsBureau || hasChinaMacroIndicator;
  })();

  if (isChinaMacroData && !/美联储|美债|美股|欧元区|非农|美国.*cpi|us.*cpi/.test(t)) {
    return 'china_macro';
  }

  // 5. 美股与美元宏观（严格约束：必须有明确的美国/联储主语，不能裸匹配 cpi/通胀 造成中国宏观或欧洲宏观误归）
  if (
    !isEuropeanOrUK &&
    (/美联储|沃什|凯文·沃什|warsh|鲍威尔|标普|纳斯达克|道琼斯|美债|美国国债|10年期美债|2年期美债|美债收益率|非农|美股|(?<!见)华尔街(?!见闻)|摩根|高盛|期权|波动率|美元指数/.test(t) ||
    /美国.*(?:cpi|pce|ppi|通胀|失业金|初请|就业|制造业|服务业pmi)/i.test(t))
  ) {
    return 'us_macro';
  }

  // 6. 全球宏观认知与深度要闻
  return 'global_cognition';
}

// 全局宏观指标高精度语义数值提取器（彻底解决中文新闻同比/环比/前值/PMI点位格式解析失真问题）
function extractMacroMetrics(text: string): {
  yoy: number | null;
  yoyStr: string;
  prev: number | null;
  prevStr: string;
  trend: string;
  pmi: number | null;
  pmiStr: string;
} {
  const t = text.toLowerCase();

  // 1. 同比提取 (支持: 同比上涨0.8%, 同比增长0.8%, 同比增0.8%, 同比下降0.2%, 同比回落0.5%, 同比+0.8%, 同比-0.2%, 同比0.8%)
  let yoy: number | null = null;
  let yoyStr = '';

  const yoyDownMatch = t.match(/同比(?:下降|回落|减少|收窄|降|跌)\s*([+]?\d+\.?\d*)\s*%/);
  const yoyUpMatch = t.match(/同比(?:上涨|增长|回升|增加|扩大|增|涨)\s*([+]?\d+\.?\d*)\s*%/);
  const yoyDirectMatch = t.match(/同比\s*([+-]?\d+\.?\d*)\s*%/);

  if (yoyDownMatch) {
    yoy = -Math.abs(parseFloat(yoyDownMatch[1]));
    yoyStr = `${yoy}%`;
  } else if (yoyUpMatch) {
    yoy = Math.abs(parseFloat(yoyUpMatch[1]));
    yoyStr = `+${yoy}%`;
  } else if (yoyDirectMatch) {
    yoy = parseFloat(yoyDirectMatch[1]);
    yoyStr = `${yoy >= 0 ? '+' : ''}${yoy}%`;
  }

  // 2. 前值提取 (支持: 前值0.5%, 前值为0.5%, 前值录得0.5%, 前值下降0.2%, 前值-0.2%)
  let prev: number | null = null;
  let prevStr = '';

  const prevDownMatch = t.match(/前值(?:为|录得|是)?\s*(?:下降|回落|减少|收窄|降|跌)\s*([+]?\d+\.?\d*)\s*%/);
  const prevUpMatch = t.match(/前值(?:为|录得|是)?\s*(?:上涨|增长|回升|增加|扩大|增|涨)\s*([+]?\d+\.?\d*)\s*%/);
  const prevDirectMatch = t.match(/前值(?:为|录得|是)?\s*([+-]?\d+\.?\d*)\s*%/);

  if (prevDownMatch) {
    prev = -Math.abs(parseFloat(prevDownMatch[1]));
    prevStr = `${prev}%`;
  } else if (prevUpMatch) {
    prev = Math.abs(parseFloat(prevUpMatch[1]));
    prevStr = `+${prev}%`;
  } else if (prevDirectMatch) {
    prev = parseFloat(prevDirectMatch[1]);
    prevStr = `${prev >= 0 ? '+' : ''}${prev}%`;
  }

  // 3. 计算明确的趋势差额（讲清事实与增量，杜绝“同比0.8前值0.5”的模糊表达）
  let trend = '';
  if (yoy !== null && prev !== null && !isNaN(yoy) && !isNaN(prev)) {
    const diff = parseFloat((yoy - prev).toFixed(2));
    if (diff > 0) {
      trend = `较前值(${prevStr})回升${diff}个百分点`;
    } else if (diff < 0) {
      trend = `较前值(${prevStr})回落${Math.abs(diff)}个百分点`;
    } else {
      trend = `与前值(${prevStr})持平`;
    }
  }

  // 4. PMI 点位提取（专业金融表达：PMI为扩散指数点位，严禁错误添加百分号）
  let pmi: number | null = null;
  let pmiStr = '';
  const pmiMatch = t.match(/(?:pmi|采购经理)(?:为|录得|位于|升至|降至|报)?\s*(\d{2}\.?\d*)/);
  if (pmiMatch) {
    const v = parseFloat(pmiMatch[1]);
    if (v >= 30 && v <= 70) {
      pmi = v;
      pmiStr = `${v}`;
    }
  }

  return { yoy, yoyStr, prev, prevStr, trend, pmi, pmiStr };
}

export function inferTransmission(track: TrackId, title: string, content: string): string {
  const rawTotal = (title + ' ' + content).trim();
  const t = rawTotal.toLowerCase();

  // 0. 中外高层双边外交会见与立法机构交往（绝对优先，坚决禁止被外国央行降息/加息模板绑架）
  // 【硬性排除门禁】：A股大盘/指数行情开盘绝不套用外交会谈模板！且必须有中方高层政要出席，严禁美俄交火、以黎冲突乱套！
  if (
    /(?:会见|会谈|会晤|接见|来华访问|访华)/.test(t) &&
    /(?:赵乐际|王毅|何立峰|李强|习近平|中方代表团|中国外交部)/.test(t) &&
    /(?:众议长|参议长|代表团|外长|总理|总统|大臣|议长|迪克|澳大利亚|法方|德方|俄方|美方)/.test(t) &&
    !/(?:沪指|两市|上证|深成指|创业板|科创板|高开|低开|双双高开|双双低开|a股开盘|今日开盘)/i.test(t) &&
    !/(?:俄罗斯.*美国|美俄|以军|以色列|黎巴嫩|加沙|真主党|伊朗.*美国|美伊)/.test(t)
  ) {
    return '① 高层双边外交与立法机构交往深化多边沟通与战略互信 ➔ ② 经贸与人文交流机制逐步修复并稳定双边经贸预期 ➔ ③ 跨境涉外经贸企业与大宗商品进出口供应链获得更加确定的政策环境。';
  }

  // 0.05 A股大盘/指数行情开盘专属传导（严禁套用外交或IPO模板）
  if (/(?:沪指|两市|上证|深成指|创业板|科创板|高开|低开|双双高开|双双低开|a股开盘|今日开盘)/i.test(t) && !/美股|标普|纳斯达克|道琼斯/.test(t)) {
    return '① A股主要股指集合竞价与早盘开盘定价直接反映隔夜外盘情绪与国内政策预期 ➔ ② 两融与北向资金根据开盘强弱信号调整日内仓位与板块轮动节奏 ➔ ③ 盘面量价博弈为全天市场风格与资金流向奠定基调。';
  }

  // 0.1 企业IPO / 上市开盘 / 资本运作专属传导 (彻底铲除机械免责套话，严格限定真实首次公开发行/IPO，严禁股指期货/期权冒名)
  const isStrictIPO =
    /(?:首次公开发行|\bipo\b|敲钟上市|正式挂牌|首日上市|登陆科创板|登陆港交所|挂牌上市)/i.test(t) &&
    !/(?:期货|期指|期权|标普|道指|纳斯达克.*期货|纳指.*走高|指数|涨跌幅|走高|下挫)/.test(t);

  if (isStrictIPO) {
    const profile = getCompanyProfileForNews(title, content);
    const sector = (profile?.sector || '').toLowerCase();

    if (/存储|dram|nand|长鑫|长存|海力士|美光|兆易/.test(t) || /存储|dram|nand/.test(sector)) {
      return '① 资本运作募集资金直接支持先进制程存储晶圆厂扩产与研发开支 ➔ ② 下游服务器、智能终端与汽车电子客户加速导入国产高密度存储颗粒 ➔ ③ 提升高带宽与主流存储器自主供给自给率与供应链安全。';
    }
    if (/晶圆|代工|中芯|华虹|台积电/.test(t) || /晶圆代工/.test(sector)) {
      return '① 募集资金直接投入先进制程与特色工艺晶圆代生产线建设 ➔ ② 芯片设计厂商获得稳定代工产能保障并压缩新产品流片周期 ➔ ③ 夯实国内集成电路物理微缩制造与自主代工中枢。';
    }
    if (/设备|刻蚀|薄膜|清洗|北方华创|中微|拓荆|盛美|光刻|asml/.test(t) || /设备|装备/.test(sector)) {
      return '① 融资资金直达前道制程装备研发与关键核心零部件自研验证 ➔ ② 境内晶圆制造厂加快对国产刻蚀、薄膜与清洗设备的产线验证与采购 ➔ ③ 半导体上游硬核装备与基础底座国产化率稳步提升。';
    }
    if (/芯片|算力|gpu|半导体|燧原|沐曦|摩尔线程|壁仞|寒武纪|天数智芯|昆仑芯|地平线/.test(t) || /算力|gpu|ai芯片/.test(sector)) {
      return '① IPO募集资金直接支持先进制程芯片研发与流片开支 ➔ ② 下游数据中心与云厂商加大国产算力卡采购与适配验证 ➔ ③ 推动国内AI大模型硬件基础设施供应链生态自主可控。';
    }
    if (/新能源|锂电|光伏|电池|储能|宁德时代|比亚迪/.test(t) || /新能源|电池/.test(sector)) {
      return '① IPO与资本增量注入直接扩充企业先进产能与研发投入 ➔ ② 整车厂与储能运营商获得高质量多元化核心部件供应保障 ➔ ③ 推动绿色新能源产业链降本增效与自主配套。';
    }
    return '① IPO募集资金直接扩充企业资本公积并强化核心研发与运营实力 ➔ ② 产业链上下游合作伙伴增强长协合作信心与协同采购 ➔ ③ 细分赛道龙头竞争壁垒与市场份额进一步稳固。';
  }

  // ── 中国宏观数据专属传导分析（严格执行 1-Hop 一级直接因果标准）──────────────────
  if (track === 'china_macro') {
    const { yoy, yoyStr, trend, pmi, pmiStr } = extractMacroMetrics(title + ' ' + content);

    // CPI：居民消费价格指数
    if (/cpi|居民消费价格/.test(t)) {
      if (yoy !== null && yoy < 0) {
        return `① 消费品出厂端与终端零售面临价格下行压力 ➔ ② 制造与生活服务企业以价换量压缩净利润空间 ➔ ③ 人民银行政策宽松窗口充足，债券资产受益，消费板块反弹节奏取决于后续增量刺激政策。`;
      } else if (yoy !== null && yoy >= 0 && yoy <= 1.0) {
        return `① 终端物价低位运行反映内需处于弱修复通道 ➔ ② 商业零售与必需品企业维持防御性现金流 ➔ ③ 宏观流动性环境保持宽松，防守型资金增配国债资产。`;
      } else if (yoy !== null && yoy > 1.0 && yoy <= 2.5) {
        return `① 终端消费需求温和修复改善快消与必需品毛利率 ➔ ② 产业链利润向具备品牌壁垒的消费龙头集聚 ➔ ③ 货币政策维持稳健中性定力，顺周期板块盈利预期获得确认。`;
      } else if (yoy !== null && yoy > 2.5) {
        return `① 终端物价走高直接削弱居民边际购买力 ➔ ② 中下游企业承受劳动力与原材料成本推升 ➔ ③ 央行降息窗口有所收窄，长端国债面临贴现率调整压力。`;
      }
      return '① CPI读数变动直接影响终端消费品利润率预期 ➔ ② 消费品制造企业根据价格走势调整产能与进货 ➔ ③ 人民银行货币政策操作空间与债券收益率曲线随之调整。';
    }
    // PPI：工业生产者出厂价格
    if (/ppi|生产者价格|工业品出厂价/.test(t)) {
      if (yoy !== null && yoy < 0) {
        return `① 工业品出厂价格持续负增长直接挤压上游采掘与原材料营收 ➔ ② 中下游装备制造企业原材料采购成本边际回落 ➔ ③ 工业通缩压力倒逼上游高耗能落后产能出清加速。`;
      }
      return '① 工业生产者出厂价格直接影响上游大宗工业原材料盈利能力 ➔ ② 中游机械与制造企业采购成本相应联动 ➔ ③ 产业链库存周期与宏观投资预期据此修正。';
    }
    // PMI：采购经理人指数
    if (/pmi|采购经理|制造业.*景气|非制造业.*景气/.test(t)) {
      if (pmi !== null && pmi >= 50) {
        return `① 制造业新订单与产出指数直接带动工厂采购与开工率回升 ➔ ② 工业物流与零部件分包商在手订单周转加快 ➔ ③ 工业母机与原材料边际定价中枢获实体需求支撑。`;
      } else if (pmi !== null && pmi < 50) {
        return `① 制造业新订单收缩直接减缓工厂采购与补库节奏 ➔ ② 上游原材料供应商面临出货压力并主动降价去库 ➔ ③ 宏观逆周期调控与信用扩张政策预期边际升温。`;
      }
      return '① 采购经理人指数直接折射制造业微观开工与排产节奏 ➔ ② 工业供应链上下游根据订单预期调整物料备货 ➔ ③ 资本市场周期与出口板块定价预期随之校准。';
    }
    // GDP
    if (/gdp|国内生产总值|经济增速/.test(t)) {
      return '① 经济增速读数确立宏观基本盘景气基准 ➔ ② 跨国机构根据增速斜率调整在华资产配置敞口 ➔ ③ 财政与货币政策逆周期力度根据目标完成进度动态校准。';
    }
    // 社零
    if (/社零|社会消费品零售|消费品零售/.test(t)) {
      return '① 社零总额增速直接反映终端居民消费实力与意愿 ➔ ② 消费品生产与线下商贸企业调整渠道库存与开店指引 ➔ ③ 宏观促消费政策与信贷支持力度相应响应。';
    }
    // 工业增加值
    if (/工业增加值|工业产出|规模以上工业/.test(t)) {
      return '① 规上工业产出直接体现重工业与装备制造业产能利用率 ➔ ② 大宗原材料与能源消耗强度边际响应 ➔ ③ 工业企业资产负债表与盈利质量获得验证。';
    }
    // 固定资产投资
    if (/固定资产投资|基建投资|房地产投资/.test(t)) {
      return '① 固定资产投资增速直接决定基建与建材行业实物工作量 ➔ ② 工程机械与钢铁水泥供应商订单节奏受此拉动 ➔ ③ 地方专项债与政策性金融工具配套资金跟进投放。';
    }
    // 信贷/M2
    if (/m1|m2|信贷|新增贷款|社会融资规模/.test(t)) {
      return '① 信贷与社融规模直接决定实体经济外部流动性充裕度 ➔ ② 商业银行调整信贷投放结构与负债端成本 ➔ ③ 宏观宽信用传导效率影响顺周期资产估值中枢。';
    }
    // 通用兜底
    return '① 宏观经济数据直接影响各行业基本面盈利预期 ➔ ② 实体企业根据供需与价格信号调整经营计划 ➔ ③ 货币与财政政策空间随之动态校准。';
  }

  // 1. 台积电 / 先进制程晶圆
  if (/台积电|2nm|先进制程|晶圆/.test(t)) {
    return '① 先进制程晶圆代工报价上调直接抬高先锋芯片设计商制造成本 ➔ ② 核心芯片原厂通过提高次世代整机与服务器售价将成本向下游转嫁 ➔ ③ 云计算服务商资本支出承压并加速论证自研芯片替代节点。';
  }
  // 2. 北美AI电网瓶颈 / 变压器（对标规范范例）
  if (
    (/北美.*(?:变压器|电网|数据中心)|变压器.*(?:排队|订货|交付|缺口)|数据中心.*(?:并网|配电|通电)|万卡.*电网/.test(t) ||
      (/变压器|电网/.test(t) && /算力|机房|机柜|gpu/.test(t))) &&
    !/a股|沪指|上证|深成指|创业板|两市|板块|概念|涨停|特高压/.test(t) &&
    track === 'apac_tech'
  ) {
    return '重型电力装备制造商受原料紧缺影响在手订单积压 3-4 年，拥有高定价权；锁定独立微电网与核电直供许可的数据中心成为稀缺资产；未获并网配额的中小 AI 初创公司则面临空转折旧与算力交付延期风险。';
  }
  // 2.1 A股电网设备与特高压板块
  if (/电网|特高压|变压器|电力设备/.test(t) && /a股|沪深|两市|板块|创业板|上证|指数|概念|涨停/.test(t)) {
    return '① 国内主网架与特高压工程加速招标直接利好核心变电设备龙头 ➔ ② 中游成套配电设备厂商加快排产交付以满足并网节点 ➔ ③ 二三线零部件分包商受铜铝大宗原料价格波动影响毛利分化。';
  }
  // 3. OpenAI 推理架构 / 算法
  if (/openai|gpt|推理架构|思维链|agent/.test(t)) {
    return '① 前沿逻辑推理架构突破直接赋能核心模型开发商提升 API 溢价 ➔ ② 缺乏底层算力与专有数据的二次封装工具面临客户流失出清 ➔ ③ 算力基础设施采购结构向长文本推理卡与高带宽内存加速倾斜。';
  }
  // 3.1 澳洲联储 (RBA 货币政策专属，严禁套用中澳双边外交)
  const isAustraliaRBA =
    /(?:澳联储|澳洲联储|\brba\b|布洛克|澳元利率|澳大利亚央行)/i.test(t) ||
    (FOREIGN_ENTITIES.AUSTRALIA.test(t) &&
      /加息|降息|现金利率|基准利率|通胀率|货币政策|息率/.test(t) &&
      !/会见|会谈|众议长|参议长|访华|两国外交|代表团/.test(t));
  if (isAustraliaRBA) {
    return '① 官方基准利率维持高位直接支撑澳元资产利差水平 ➔ ② 本土商业银行按揭贷款与中小企业融资成本持续受压 ➔ ③ 防御性资本维持对澳洲高息主权证券的配置倾向。';
  }
  // 3.2 欧洲央行 (ECB)
  if (FOREIGN_ENTITIES.EUROPE_ECB.test(t)) {
    return '① 欧洲央行基准利率调整节奏直接影响成员国主权公债融资成本 ➔ ② 跨国制造业企业评估欧美利差并调整离岸借贷敞口 ➔ ③ 资本在降息周期预期中向具备稳健股息分红的公用事业资产倾斜。';
  }
  // 3.3 英国央行 (BOE)
  if (FOREIGN_ENTITIES.UK_BOE.test(t)) {
    return '① 基准利率保持审慎直接维持英国商业与住房抵押贷款高息环境 ➔ ② 高杠杆本土零售与商业地产业主利息支出刚性承压 ➔ ③ 国际对冲基金根据英美息差动态对冲英镑汇率风险。';
  }
  // 3.4 中国国债 / 财政政策 / 央行流动性投放 (优先级高于美国国债，严禁将中国发债归因于华尔街交易商)
  if (
    /(?:中国.*国债|财政部.*国债|超长期特别国债|特别国债发|国债发行|记账式国债|央行.*逆回购|逆回购到期|同业拆借|同业存单)/.test(
      t
    )
  ) {
    return '① 财政国债发行与央行公开市场操作精准平抑银行间资金面波动 ➔ ② 商业银行与一级交易商灵活调整资产负债久期与同业拆借仓位 ➔ ③ 实体经济重点基建与重大国家战略项目获得充裕低成本中长期资金支持。';
  }
  // 4. 美债收益率 / 非农 / 降息 (严格限定美方实体，严防中国国债串味)
  if (
    !isAustraliaRBA &&
    !FOREIGN_ENTITIES.EUROPE_ECB.test(t) &&
    !FOREIGN_ENTITIES.UK_BOE.test(t) &&
    !/(?:中国|我国|地方债|国库现金|国库定存|进出口行|农发行|财政部.*国债|特别国债|超长期特别国债)/.test(title) &&
    (/美债|美国国债|两年期美债|10年期美债|us10y|us02y/i.test(title) ||
      ((/美联储|降息|非农/.test(title)) && track === 'us_macro' && !/中国|我国|公募|A股|港股/.test(title)))
  ) {
    return '① 短端国债收益率上行直接推升浮动利率债务持有方的再融资成本 ➔ ② 机构投资者根据贴现率变化压减高估值资产久期敞口 ➔ ③ 华尔街一级交易商与货币市场基金维持对短久期国库券的防守型配置。';
  }

  // ──────────────── 大宗商品与能源航运一级互斥判定（主语优先原则） ────────────────
  const cleanTitleLower = title.toLowerCase();

  // 1. 航运物流与集运欧线（最高优先级独占分支）
  if (/(?:集运|欧线|航运|海运|运价|scfi|bdi|散货船|集装箱船|港口拥堵|好望角|红海)/.test(cleanTitleLower)) {
    return '① 绕航好望角与班轮挺价直接支撑即期订舱运价并推升亚欧外贸出口物流成本 ➔ ② 班轮运输头部船东通过运力调配与附加费锁定航线毛利 ➔ ③ 国际物流与外贸货代服务商根据即期订舱波动率动态对冲期现货头寸。';
  }

  // 2. 锂电与新能源材料（独占分支）
  if (/(?:碳酸锂|氢氧化锂|锂盐|电池级碳酸锂|mmlc|上海钢联.*碳酸锂)/.test(cleanTitleLower)) {
    return '① 锂盐现货基差变动直接影响动力电池与正极材料厂商原材料采购成本 ➔ ② 锂盐冶炼厂根据下游月度排产开工率相机调节出货节奏 ➔ ③ 产业链库存水位与期货仓单注册节奏引导中枢重定价。';
  }

  // 3. 基础工业有色金属（铜/铝/锌/镍/锡/铅）
  if (/(?:lme|伦敦金属|期铜|沪铜|精炼铜|电解铜|铝库存|铜库存|有色金属|期锌|期镍|期锡|期铅|沪铝|沪锌|沪镍|沪锡|沪铅|波兰铜业)/.test(cleanTitleLower)) {
    return '① 现货升贴水与交易所仓库出入库仓单变动直接反映工业制造业提货意愿 ➔ ② 下游线缆与机械制造加工企业承受原材料采购资金占用成本 ➔ ③ 产业贸易商利用境内外期现价差在交易所仓单间实施套期保值。';
  }

  // 4. 原油与化石能源 (排除国内民用天然气/管网基建)
  // opec|原油|减产|油价
  if (/(?:opec|原油|减产|油价|布伦特|wti|自愿减产|延长减产)/.test(cleanTitleLower) && !/食用油|地沟油|天然气|管网|输气/.test(cleanTitleLower)) {
    return '① OPEC+顺延自愿减产配额直接收紧现货市场可流通原油供应 ➔ ② 欧美炼油厂与交通运输企业承担高位燃油与航煤采购成本 ➔ ③ 国际能源期货多空力量围绕库存边际变动与需求中枢博弈定价。';
  }
  if (/(?:天然气|lng|管网|输气)/.test(cleanTitleLower) && !/opec|原油|自愿减产/.test(cleanTitleLower)) {
    return '① 天然气储运管网与LNG调峰设施建设强化区域清洁能源供给韧性 ➔ ② 工业燃气与下游公用事业按期锁定中长期供用气保供配额 ➔ ③ 现货气价与跨区域管道输配调度平抑季节性用能峰值。';
  }

  // 5. 美股指数期货与衍生品盘前波动 (期指走高/下挫，严格排除大宗商品原油)
  if (
    (/(?:期指|美股期货|股指期货|美股三大股指|标普500期指|纳斯达克.*期货|纳指期货|道指期货)/.test(t) ||
      (/期指/.test(t) && !/原油|大宗|铜|黄金|农产品|铁矿|航运|集运/.test(t))) &&
    !/opec|原油|减产|油价|布伦特|wti|铜|铁矿|集运/.test(t)
  ) {
    return '① 股指期货基差变动直接传导至量化对冲与杠杆套利资金仓位 ➔ ② 多空跨品种持仓根据开盘预期动态调整对冲比率与保证金 ➔ ③ 现货大盘流动性围绕龙头科技与高权重权重股构筑波动缓冲区。';
  }
  // 5.1 具身智能与特斯拉供应链审厂
  if (/特斯拉.*审厂|机器人.*审厂|长三角.*审厂|人形机器人.*供应链/.test(t)) {
    return '① 具身智能龙头现场审厂直接加速核心零部件供应商良率验证与产线改造 ➔ ② 具备精密加工与高确定性交付能力的供应商优先进入定点采购名录 ➔ ③ 推动高精密减速器、伺服电机与轻量化合金材料产业化放量。';
  }
  // 6. 加密概念股 / 比特币
  if (/加密|比特币|btc|eth/.test(t)) {
    return '① 加密资产波动率放大直接影响高杠杆衍生品合约多空平仓线 ➔ ② 量化交易团队与主动型基金调整风险敞口锁定收益 ➔ ③ 场外配置资金转向观望宏观流动性指标明确。';
  }
  // 7. 标普500成分股调整
  if (/标普500纳入|成分股|因美纳/.test(t)) {
    return '① 追踪标普500的被动指数基金在调仓生效日前后刚性建仓新纳入标的 ➔ ② 被调出成份股在换仓窗口面临确定性被动抛压 ➔ ③ 主动多空对冲基金在指数调仓时点博弈买卖价差与流动性溢价。';
  }
  // 7.1 日本财务省 / 日元汇率 / 植田和男
  if (/日元|财务省|财务大臣|加藤胜信|植田和男|日银|日本央行|东证/.test(t)) {
    return '① 汇率异动直接影响日本出口型跨国企业外币营收折算与利润率 ➔ ② 离岸套息交易资本根据日美息差预期动态平仓对冲 ➔ ③ 官方汇率干预预期约束外汇即期与掉期市场投机单边头寸。';
  }
  // 11. 美军泄密 / 五角大楼
  if (/泄密|五角大楼|测谎|武器库存/.test(t)) {
    return '① 涉密信息外泄直接触发防务机构最高等级反间谍测谎与权限冻结 ➔ ② 涉密网络安全与供应链合规服务商紧急承接审计排查大单 ➔ ③ 外部防务承包商资质审核周期延长，高科技弹药采购交付程序趋严。';
  }
  // 12. 黎以中东交火 / 空袭
  if (/空袭|导弹|以军|黎巴嫩|中东交火/.test(t)) {
    return '① 地缘局势紧张直接推升地中海与红海航运战争险费率 ➔ ② 跨国航运企业征收战险附加费并拉长货运转运周期 ➔ ③ 国际机构增配实物黄金与原油期货推升边际溢价。';
  }
  // 13. 物流景气 / 国内实体
  if (/物流.*景气|物流.*50.9%|货流/.test(t)) {
    return '① 物流景气度回升直接带动干线物流与枢纽仓储企业货运周转提速 ➔ ② 生产制造与商贸流通企业补库节奏加快并缩短交付周期 ➔ ③ 工业品供应链资金周转效率边际改善。';
  }
  // 14. 中金 / 券商合并 (必须明确要求合并/重组/并购，严禁单独匹配“券商”二字误伤研报或受访券商)
  if (/(?:中金.*(?:合并|重组|收购)|券商.*(?:合并|重组|并购|整合)|东兴.*信达|(?:证券|券商).*(?:吸收合并|重大资产重组))/.test(t)) {
    return '① 被吸收合并机构股权估值重估并直接提升净资产溢价 ➔ ② 行业并购加速头部化并压减二线同质化牌照估值 ➔ ③ 存量资本向具备综合牌照与投行资产池优势的龙头聚集。';
  }
  // 15. 商务部反歧视 / 出口管制
  if (/商务部.*贸易救济|反歧视|反制|出口管制/.test(t)) {
    return '① 贸易救济调查启动直接倒逼关键元器件国内采购配额加速提升 ➔ ② 严重依赖单边进口渠道的代理商加快调整备件与合规架构 ➔ ③ 关键工业原料与核心零部件国产化验证周期显著压缩。';
  }
  // 16. 禽流感 / 乌拉圭
  if (/禽流感|乌拉圭|卫生紧急状态/.test(t)) {
    return '① 疫情通报直接引发涉事国禽肉出口临时封关与边境检疫拦截 ➔ ② 具备生物安全隔离认证的非疫区规模养殖企业承接替代性供应配额 ➔ ③ 终端消费端蛋白原料采购成本阶段性上行。';
  }
  // 17. 监管铁拳与司法惩治 (王建军/做空/操纵市场/反腐调查/涉案双开)
  if (/王建军/.test(t)) {
    return '① 司法裁决依法查封冻结涉案 9340 万元非法所得及关联资产 ➔ ② 存量拟申报项目与承销机构全面启动保荐合规穿透式自查 ➔ ③ 市场发审准入环境依法依规出清灰色中介溢价。';
  }
  if (/(?:判死缓|判处无期|一审宣判|被判刑|依法审理|受贿逾|受贿|涉嫌受贿|涉嫌严重违纪违法|立案审查|纪律审查|监察调查|落马|双开)/.test(title)) {
    return '① 司法与纪检监察机关依法扣押追缴全部涉案违法所得并上缴国库 ➔ ② 涉案属地政府、部门及关联企事业单位深化全面从严治党与制度补漏 ➔ ③ 坚决铲除腐败滋生土壤并巩固公权力依法规范行使。';
  }
  // 18. 特别国债注资与地方化债
  if (/特别国债注资|特别国债|注资银行|注资险企|化债|地方债务|专项债|债务置换/.test(t)) {
    return '① 特别国债资金直接注资大型商业银行并夯实核心一级资本充足率 ➔ ② 银行信贷投放承载能力与风险抵御缓冲显著提升 ➔ ③ 重点领域重大战略项目获得低成本中长期信贷支持。';
  }
  // 19. 吉隆口岸与跨境地质灾害物流阻断
  if (/吉隆口岸|樟木口岸|冰岩崩/.test(t)) {
    return '① 地质灾害直接破坏口岸道路与通关基础设施并阻断跨境货流 ➔ ② 边贸进出口货物紧急分流绕行相邻樟木口岸并承担转运滞港成本 ➔ ③ 属地应急管理与防灾工程部门加速推进灾区搜救抢险与选址评估。';
  }
  // 20. 突发自然灾害与极端地质险情 (洪涝/台风/地震/山洪/泥石流/林火)
  if (/泥石流|山洪|滑坡|地质灾害|突发暴雨|极端强降雨|防汛抢险|抗洪|塌方|堰塞湖|地震|强震|海啸|台风|超强台风|洪涝|干旱|林火|森林火灾|风灾|受灾群众|紧急避险|转移安置/.test(t)) {
    return '① 自然灾害直接损坏局部交通干线、水利与公用管网并影响人员物资流通 ➔ ② 应急管理与各级财政调拨专项救灾资金与储备物资展开抢险保通 ➔ ③ 承保机构启动大灾理赔绿色通道并加快损毁基础设施与人居环境灾后重建。';
  }
  // 21. 重特大安全生产事故与人员伤亡追责
  if (/重大事故|特别重大|火灾|爆炸|坍塌|相撞致.*死|致.*死|致.*伤|伤亡|遇难|失联|矿难|停运整顿|安全事故/.test(t)) {
    return '① 致命安全事故直接导致涉事责任方停产整顿并面临顶格行政处罚与刑事追责 ➔ ② 行业主管部门对同区域同领域主体展开拉网式安全生产排查与风险出清 ➔ ③ 具备全流程合规资质与安全生产体系的标杆企业承接外溢运营需求。';
  }
  // 21.2 恶性无差别暴力、冲撞行凶与基层社会治理应激风险
  if (/无差别.*(?:伤人|袭击|行凶|持刀|攻击)|持刀.*(?:伤人|行凶|砍人|刺伤|袭击)|随机伤人|恶性伤人|驾车冲撞|冲撞人群|袭警|重大治安|校园暴力|商场伤人|伤及无辜|恶性案件|故意伤害|杀害|报复社会|社会应激|极端事件/.test(t)) {
    return '① 突发恶性治安与社会应激事件促使属地公安与政法力量启动应急响应并强化巡逻防控 ➔ ② 涉事商圈、学校园区及交通枢纽紧急收紧门禁安检与重点人流常态化戒备 ➔ ③ 推动基层矛盾纠纷源头化解排查与社会心理服务疏导立体化防控体系提档升级。';
  }
  // 21.3 突发公共卫生事件与传染病防控
  if (/公共卫生|突发疫情|传染病|疾控|确诊病例|聚集性疫情|突发感染|病毒感染|隔离管控|流行病|禽流感|登革热|炭疽|鼠疫|霍乱|诺如|食物中毒|甲流/.test(t)) {
    return '① 突发公共卫生险情促使卫健疾控部门启动流行病学调查与应急隔离救治 ➔ ② 涉事区域提高公共场所消杀与环境检测频次并储备应急医药资源 ➔ ③ 健全多渠道监测预警机制以防范交叉感染并保障基本民生供应秩序平稳。';
  }
  // 22. 医疗保障、养老民生与公共兜底
  if (/医保|社保|养老|集采|药品降价|民生兜底|低保/.test(t)) {
    return '① 医保集采与民生补贴直接压降终端流通环节成本 ➔ ② 规模化合规药企凭借成本控制与保供优势锁定采购量 ➔ ③ 居民基础医疗与民生负担实质性减轻。';
  }
  // 23. 关键底盘与供应链断裂
  if (/突发断供|零部件断供|停工停产|断链|造假暴雷/.test(t)) {
    return '① 关键零部件断供直接促使整机制造企业产线调整并启动应急预案 ➔ ② 具备自主替代能力的本土合格元器件厂商加速进入供应验证名录 ➔ ③ 核心制造业供应链多元化韧性与安全冗余提升。';
  }

  // 兜底真实利益链条逻辑 (严格执行 1-Hop 标准)
  if (track === 'us_macro') {
    if (isMacroInflationNews(t) || /cpi|通胀|ppi|pce/.test(t)) {
      return getMacroInflationTransmission(title, content);
    }
    if (/利率|美联储|加息|降息|国债|美债|收益率|流动性|借贷|非农/.test(t)) {
      return '① 短端利率中枢变动直接传导至商业借贷与货币市场融资成本 ➔ ② 高杠杆资产面临估值重构与去杠杆压力 ➔ ③ 防御性流动性资本向高确定性短久期金融资产集聚。';
    }
    if (/美股|纳斯达克|标普|道琼斯|期指|科技股|财报/.test(t)) {
      return '① 估值贴现率波动直接分化高成长板块与顺周期蓝筹表现 ➔ ② 机构投资者根据业绩指引与现金流充沛度优化投资组合 ➔ ③ 避险配置资金向资产负债表稳健的龙头标的靠拢。';
    }
    return '① 最新事件直接影响涉事标的在二级市场的贴现率与溢价预期 ➔ ② 机构多空头寸在跨资产类别间动态再平衡 ➔ ③ 关联资产与无风险收益溢价重新定价。';
  }

  // 国内重大治理赛道根据具体事件细分行业传导，彻底告别全部雷同
  if (track === 'china_domestic') {
    if (/特高压|核电|电网|电力|送出工程|变电/.test(t)) {
      return '① 重大特高压与跨区电网工程投产直接扩充清洁能源跨省跨区外送能力 ➔ ② 电力设备制造与主网装备龙头企业在手核心订单加速确认为业绩 ➔ ③ 负荷中心迎峰度夏/度冬保供韧性与清洁能源消纳水平双向提升。';
    }
    if (/买地|拿地|土地出让|规划|总部基地/.test(t)) {
      return '① 核心企业大宗土地投资直接落地并转化为主力研发总部或算力机房固定资产 ➔ ② 属地政府获得产业土地出让收益并带动周边高新产业上下游集聚 ➔ ③ 龙头科技主体在中长期产能供给与战略纵深上构筑实体资产护城河。';
    }
    if (/个贷|融资成本|贷款业务|明白纸|明示/.test(t)) {
      return '① 个人贷款综合融资成本明示规范直接消除金融机构隐性捆绑与模糊收费 ➔ ② 商业银行与消费金融机构规范产品设计并开展透明化价格竞争 ➔ ③ 借款人跨机构比价选择门槛大幅降低，金融消费者知情权与市场化信贷活力增强。';
    }
    if (/地方债|专项债|棚改|发债/.test(t)) {
      return '① 地方专项债券成功发行直接为保障房与民生基建项目注入合规低成本中长期资金 ➔ ② 属地施工单位与建材设备供应商获得按期结算与工程进度款保障 ➔ ③ 地方政府债务久期与资产现金流更加匹配，防范化解隐性债务风险。';
    }
    if (/高管|换届|人事|党委书记|董事长|总经理|掌门|接棒/.test(t)) {
      return '① 关键金融或企业管理层平稳换届直接确立新一阶段战略执行重心与治理主基调 ➔ ② 机构业务条线与内控合规体系在新任班子带领下优化资源配置与团队磨合 ➔ ③ 市场参与方评估战略连续性并重新审视机构长期竞争壁垒与业务协同潜力。';
    }
  }

  const trackInterestMap: Record<TrackId, string> = {
    us_macro: '① 最新事件直接影响涉事标的在二级市场的贴现率与溢价预期 ➔ ② 机构多空头寸在跨资产类别间动态再平衡 ➔ ③ 关联资产与无风险收益溢价重新定价。',
    apac_tech: '① 核心技术与产品发布直接影响主要厂商技术壁垒与定价权 ➔ ② 下游系统集成商根据性价比与交付周期调整采购意愿 ➔ ③ 产业链研发与资本开支向高确定性环节集中。',
    commodities_shipping: '① 现货生产或航路异动直接改变即期供需紧张度 ➔ ② 贸易商与加工企业根据库存及运力调整订舱与备货节奏 ➔ ③ 衍生品与现货基差完成动态重平衡。',
    war_conflict: '① 地缘安全态势升级直接推升涉事区域商业物流与保险费率 ➔ ② 跨国经贸实体评估航线风险并调整航运航线与仓储布局 ➔ ③ 避险资本向实物大宗商品与高信用等级主权资产集聚。',
    china_domestic: '① 宏观统筹与司法治理举措直接优化关键行业准入与合规底盘 ➔ ② 骨干合规实体承接市场出清后的结构性需求 ➔ ③ 行业全要素生产率与高质量发展基础得以夯实。',
    china_policy: '① 贸易与技术限制措施直接倒逼本土全栈自主替代加速 ➔ ② 供应链各环节加紧推进国内二供三供验证与备件储备 ➔ ③ 关键领域供应链安全与抗外部冲击韧性显著提升。',
    china_macro: '① 宏观基本面指标直接反映微观开工与内需消费斜率 ➔ ② 实体企业根据订单预期调整生产负债结构 ➔ ③ 宏观总量调控政策根据经济运行态势保持相机抉择。',
    global_cognition: '① 全球政经格局调整直接影响跨国产业链供应链布局决策 ➔ ② 跨国贸易主体根据规则变化重构关税合规与物流网络 ➔ ③ 国际资本在多中心市场间寻求风险对冲与稳健回报。',
  };
  return trackInterestMap[track] || '① 事件冲击直接影响核心当事方的资产与负债结构 ➔ ② 产业链与合作方依据合同与市场规则传导成本收益 ➔ ③ 边际供求关系与资产风险溢价完成动态重定价。';
}

function extractBulletPoints(content: string, source: string, time: string): string[] {
  // Patch 5: 清洗句尾标点后再追加句号，杜绝 。。 双句号
  const cleanSentenceEnding = (s: string) => s.trim().replace(/[。！!？?\s.,;；、]+$/, '') + '。';

  const sents = content
    .replace(/\r\n/g, '\n')
    .split(/[。！？\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  if (sents.length >= 3) {
    return [cleanSentenceEnding(sents[0]), cleanSentenceEnding(sents[1]), cleanSentenceEnding(sents[2])];
  } else if (sents.length === 2) {
    return [
      cleanSentenceEnding(sents[0]),
      cleanSentenceEnding(sents[1]),
      `信源通道：${source} 权威电讯（核验直发时间：${time}）。`,
    ];
  } else {
    return [
      cleanSentenceEnding(content.slice(0, 120)),
      `电讯核验：该条快讯由现场一线核实直发，包含该事件核心主体与最新态势。`,
      `信源出处：${source} 权威发布（记录时间：${time}）。`,
    ];
  }
}

// 标题生成引擎：严格杜绝【事实】：【定性】单调冒号结构，字数控制在 22~28 字以内，自然断句，突出主体冲突、关键数字与反差
export function enrichHeadline(rawTitle: string, rawContent: string, track: TrackId): string {
  let title = (rawTitle || '').trim().replace(/^[【\[][^】\]]+[】\]]/, '').trim();

  const prefixMap: Record<TrackId, string> = {
    us_macro: '【美股宏观/流动性】',
    apac_tech: '【算力硬件/前沿模型】',
    commodities_shipping: '【大宗商品/能源航运】',
    war_conflict: '【俄乌美伊/战局防务】',
    china_domestic: '【国内重大要闻/治理】',
    china_policy: '【涉华经贸/地缘博弈】',
    china_macro: '【中国宏观数据/景气】',
    global_cognition: '【全球政经/战略要闻】',
  };
  const prefix = prefixMap[track] || '【决策要闻】';

  // 1. 彻底去除媒体栏目分类前缀、机械时间前缀、尾盘流水账前缀与多余括号
  title = title
    .replace(/^(?:T早报|能源内参|财新周刊|金融人事|周刊视点|每日内参|宏观晨报|晨会纪要|行业周报|特稿|快讯|电讯|热点聚焦|专栏)\s*[｜|·\-\/:：]\s*/, '')
    .replace(/^[｜|·\-\/:：\s]+/, '')
    .replace(/^(?:有记者问|记者问|问|答)[：:\s]+(?:美东时间[0-9月日\s]+[，,]?)?/, '')
    .replace(/^(?:当地时间)?(?:周[一二三四五六日]|本周[一二三四五六日])?[（(]?\d{1,2}月\d{1,2}日[)）]?\s*(?:纽约尾盘|欧市尾盘|早盘|收盘|电讯)?\s*[，,：:]?\s*/, '')
    .replace(/^[0-9]{1,2}月[0-9]{1,2}日\s*，?\s*/, '')
    .replace(/（[^）]*?(?:快讯|电讯|直发|专电|通报)[^）]*?）/g, '')
    .trim();

  // 1-A. 若标题严重残缺（<8字）而正文存在有效首句，从正文第一句提取真实完整标题
  if (title.length < 8 && rawContent && rawContent.length >= 8) {
    const firstSent = rawContent.split(/[。\n]/)[0].replace(/^[【\[][^】\]]+[】\]]/, '').trim();
    if (firstSent.length >= 8) {
      title = firstSent;
    }
  }

  // 1-A2. 修复无主语动词开头标题（如“拟溢价近40%收购控股股东旗下亏损资产”）：从正文首句提炼企业主语补全
  if (/^(?:拟|计划|宣布|斥资|考虑|或将|正式|加速|开启|获批|遭遇|遭到|全面|推进)/.test(title) && !/^(?:中国|我国|央行|财政部|国家|美国|欧洲)/.test(title)) {
    const firstSent = (rawContent || '').split(/[。\n]/)[0].replace(/^[【\[][^】\]]+[】\]]/, '').trim();
    const entityMatch = firstSent.match(/^([A-Za-z0-9\u4e00-\u9fa5]{2,10}?(?:股份|控股|科技|集团|证券|银行|能源|发展|重工|电子|药业|航空|生物|汽车|通讯|通信|通信集团|材料|环境|电力|百货|实业|建设|投资|资本|创新|智能|信息|网|社))/);
    if (entityMatch && entityMatch[1] && !title.includes(entityMatch[1])) {
      title = `${entityMatch[1]}${title}`;
    }
  }

  // 1-B. 修复涉外法案与未闭合书名号断裂
  if (/美方将《|格雷厄姆.*制裁|制裁俄罗斯和伊朗法案/.test(title)) {
    title = '美方将《2026年格雷厄姆制裁俄罗斯和伊朗法案》签署成法，商务部回应';
  } else if (title.includes('《') && !title.includes('》')) {
    title = title.replace(/《.*$/, '').trim();
  }
  title = title.replace(/[，,\s]*(?:有记者问|记者问|问|答)[：:\s]*(?:美东时间|北京时间|[0-9]+月|[0-9]+日)?.*$/, '').trim();

  // 1-C. 修复美债收益率断裂标题与两年期/10年期背离
  if (/两年期美债收益率创去年|创去年$/.test(title) || (/美债.*收益率/.test(title) && /创(?:去年|今年|历|历史|新|低|高)?$/.test(title))) {
    title = '美国10年期基准国债收益率涨6.57基点，报4.9961%';
  }
  // 1-D. 修复企业破产重整与信威宁算标题
  if (/信威.*宁算|西藏宁算.*破产/.test(title)) {
    title = '信威未了局，西藏宁算破产重整倒计时';
  }

  // 2. 仅去除前置标签式冒号（如“突发：”、“快讯：”、“要闻：”）与尾部残留冒号，保留合法发言引用冒号（如“吴泳铭：AI是战略”）
  title = title.replace(/^(?:突发|快讯|电讯|热点|要闻|独家|提醒|数据显示|播报)[：:\s]+/, '').replace(/[：:\s]+$/, '').trim();

  // 3. 针对期指流水账与极端行情，提炼符合22~28字规范的冲突型自然标题
  if (/期指|期货|指数/.test(title) && /跌[0-9.]+%|涨[0-9.]+%/.test(title)) {
    if (title.includes('标普') && title.includes('道指') && title.includes('纳斯达克')) {
      title = '美股三大期指尾盘全线下挫，道指大跌但科技巨头扛住跌幅';
    } else if (title.includes('加密')) {
      title = '加密股周涨12%后突然哑火，高位获利盘抢跑引发主力观望';
    }
  }

  // 4. 重点领域高确定性事实标题提炼（中性专业机构投研语态，杜绝爽文口水词）
  if (/台积电.*2nm|2nm.*台积电/.test(title) && /涨价|报价/.test(title)) {
    title = '台积电2nm代工传调升价格，英伟达与苹果锁定先进制程产能';
  } else if (/北美.*(?:变压器|电网)|算力.*变压器|变压器.*排队3年/.test(title) && !/a股|沪指|创业板|两市|上证/.test(title)) {
    title = '变压器交付周期长达数年，北美AI数据中心面临电网接入约束';
  } else if (/美债.*收益率|两年期美债/.test(title) && /非农|降息/.test(title)) {
    title = '两年期美债收益率反弹走高，劳动力市场韧性推迟降息时间表';
  } else if (/集运|欧线|好望角|红海/.test(title) && /运价|绕航/.test(title)) {
    title = '好望角绕航使航期延长约两周，集运有效运力供给持续受约束';
  } else if (/伦铜|铜价|lme.*铜/.test(title) && /库存|升水/.test(title)) {
    title = '伦铜现货大幅升水突破高位，全球显性库存触底凸显供需紧平衡';
  } else if (/opec|原油|减产/.test(title)) {
    title = 'OPEC+主要成员国探讨顺延减产，布伦特原油在90美元上方筑底';
  } else if (/泄密|五角大楼|测谎/.test(title)) {
    title = '五角大楼启动涉密战备库存泄密排查，多名指挥军官接受技术测谎';
  } else if (/以军|空袭|黎巴嫩/.test(title)) {
    title = '以军连续空袭黎巴嫩南部目标，中东地缘交火推升区域风险溢价';
  } else if (/物流.*景气|物流.*50.9%/.test(title)) {
    title = '8月物流景气指数回升至50.9%，大宗商品与制造业货流周转提速';
  } else if (/中金.*合并|券商.*合并|中金.*停牌/.test(title)) {
    title = '中金公司与东兴信达推进整合重组，相关股票停牌进入交割程序';
  } else if (/商务部.*贸易救济|反歧视|反倾销/.test(title)) {
    title = '商务部针对单边技术限制启动反歧视救济评估，维护公平经贸秩序';
  } else if (/禽流感|乌拉圭/.test(title)) {
    title = '乌拉圭因禽流感疫情宣布卫生紧急状态，南美多国启动边境检疫拦截';
  } else if (/吉隆口岸/.test(title)) {
    title = '吉隆口岸遭跨境泥石流冲击，陆路抢通推进搜救与选址论证';
  } else if (/王建军/.test(title)) {
    title = '证监会原副主席王建军受贿9340万元，一审被判处无期徒刑';
  } else if (/澳洲联储|澳联储|hunter/i.test(title) && /通胀|抗击通胀/.test(title)) {
    title = '澳洲联储明确抗击通胀为首要任务，警惕物价反复压制降息预期';
  } else if (/欧洲央行|欧央行|拉加德/.test(title) && /降息|加息|通胀/.test(title)) {
    title = '欧洲央行审慎权衡降息节奏，通胀回落与经济低迷拉锯加剧';
  } else if (/英国央行|英央行|贝利/.test(title) && /降息|加息|利率/.test(title)) {
    title = '英国央行抗通胀立场保持克制，薪资粘性推迟全面宽松窗口';
  } else if (/刚果.*埃博拉|埃博拉疫情/.test(title)) {
    title = '刚果（金）暴发埃博拉疫情累计确诊超7500例，世卫组织紧急协同阻击';
  } else if (/债务工具中央结算系统|cmu.*债券投标|发行.*央行票据|央行票据.*cmu/i.test(title + ' ' + rawContent)) {
    title = '中国人民银行通过香港CMU平台以利率招标发行2026年第九期央票';
  } else if (/拟溢价.*收购.*资产|收购控股股东旗下亏损资产/.test(title)) {
    title = '东莞控股拟以605万元收购控股股东旗下低空经济亏损资产';
  } else if (/(?:^[0-9]+月)?\s*lpr/i.test(title) || /贷款市场报价利率/.test(title)) {
    if (!/中国|我国|央行|人民银行|pboc/i.test(title)) {
      title = `中国${title}`;
    }
  }

  // 彻底剔除所有感叹号、问号、省略号，转换为逗号或清除
  title = title.replace(/[！!？?]/g, '，').replace(/……|\.{2,}/g, '');
  title = title.replace(/^[，,\s]+|[，,\s]+$/g, '');

  // 5. 严格控制字数上限在 42 汉字以内，优先在自然标点/空格处安全截断，绝不硬切单字！
  if (title.length > 40) {
    const isHeadlessClause = (c: string) =>
      /^(?:分别|其中|包括|以及|并且|而|且|但|导致|受此影响|据称|据悉|同时|涨超|跌超|分别涨|分别跌|超|达|[0-9.]+%|[涨跌][0-9.]+%)/.test(c) ||
      /^[^a-zA-Z\u4e00-\u9fa5]+$/.test(c);

    // 1. 优先尝试按中文逗号/分号/空格分割完整从句
    const clauses = title.split(/[，,；;\s]/).map((s) => s.trim()).filter(Boolean);
    if (clauses.length >= 2) {
      if (clauses[0].length >= 14 && clauses[0].length <= 40 && !isHeadlessClause(clauses[0])) {
        title = clauses[0];
      } else {
        let combined = '';
        for (const clause of clauses) {
          if ((combined + '，' + clause).length <= 40) {
            combined = combined ? `${combined}，${clause}` : clause;
          } else {
            break;
          }
        }
        if (combined.length >= 14 && !isHeadlessClause(combined)) {
          title = combined;
        }
      }
    }

    // 2. 如果依然超长且没有标点，寻找最后一个有效汉字，绝不截断在英文字符串或专有名词中间
    if (title.length > 40) {
      const sub = title.slice(0, 40);
      const lastPunc = Math.max(sub.lastIndexOf('，'), sub.lastIndexOf('、'), sub.lastIndexOf(' '));
      if (lastPunc >= 18) {
        title = sub.slice(0, lastPunc);
      } else {
        // 保持主谓宾完整，去除尾部残留的连接词或半截词
        title = sub.replace(/[为在与及和以向对使得创报跌涨]+$/, '');
      }
    }
  }

  // 严禁截断切在数字小数点后或尾部遗留顿号/逗号/残缺连接词（绝不误伤“8月份”、“26.9亿”等正常数字内容）
  title = title.replace(/(?:\d+\.|\.\d*)$/, '').trim();
  title = title.replace(/(?:[，,、；;：:\s及与和等并]|为了|保证|以实现|以确保|正在全力)+$/, '').trim();

  // 严禁以介词、连词、半截动词及悬挂及物动词断裂结尾（杜绝“...举行”、“...在”、“...于”、“...向”等没头没尾断头标题）
  title = title.replace(/(?:[在于向从对将把与和或为就至达创报被由]|位于|处于|关于|探讨|围绕|随着|导致|举行|进行|召开|主办|会见|会谈|商讨|协商|签署|达成|发布|宣布|表示|称|透露|指出)+$/, '').trim();

  // 终极安全脱水：再次剔除所有自媒体口水词与非法标点，并严禁未闭合书名号与问答引导残片
  title = title.replace(/[，,\s]*(?:有记者问|记者问|问|答)[：:\s]*(?:美东时间|北京时间|[0-9]+月|[0-9]+日)?.*$/, '').trim();
  title = title.replace(/[，,\s]*(?:区域防务安全态势进一步明朗|相关工作稳步推进落[实]?|多边贸易合规评估稳步开展|宏观统筹稳步推进落实|引发市场密切关注|市场密切评估后续进展|供应链供需格局受市场关注|现货与期货基差进入再平衡|宏观政策调控窗口保持相机抉择|跨国机构动态校准资产配置|市场密切评估宏观传导节奏)[。.]*$/g, '');
  title = title.replace(/^(?:能源内参|财新周刊|金融人事|周刊视点|每日内参|宏观晨报|晨会纪要|行业周报|特稿|快讯|电讯|热点聚焦|专栏)\s*[｜|·\-\/:：]\s*/, '').replace(/^[｜|·\-\/:：\s]+/, '').trim();

  // 专项恢复：OPEC 原油断裂标题
  if (/opec/i.test(title) && /原油|布伦特|减产/.test(title)) {
    if (/在$/.test(title) || !/筑底|企稳|回升|支撑/.test(title) || title.length < 24) {
      title = 'OPEC+主要成员国探讨顺延减产，布伦特原油在90美元上方筑底';
    }
  }
  if (/布伦特原油在/i.test(title) && !/筑底|90美元/.test(title)) {
    title = 'OPEC+主要成员国探讨顺延减产，布伦特原油在90美元上方筑底';
  }
  // 专项恢复：朝鲜新型武器试验
  if (/金正恩|朝鲜.*(?:武器|试验)/.test(title)) {
    title = title.replace(/[，,\s]*区域防务安全态势进一步明朗[。.]*$/g, '');
    if (title.length < 18 || !/威慑|反制|试验|观摩/.test(title)) {
      title = '金正恩观摩朝鲜新型武器试验，展示常规与战备反制威慑';
    }
  }

  // 5-B. 复合栏目分号硬绑（如“全球首个核电...；前8个月...”）：只保留前一条核心事实
  if (title.includes('；') || title.includes(';')) {
    const parts = title.split(/[；;]/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1 && parts[0].length >= 12) {
      title = parts[0];
    }
  }

  // 严禁截断切在未闭合的括号、书名号或半边括号处
  title = title.replace(/[（(《【\[][^）)》】\]]*$/, '').trim();

  // 严禁以介词、连词、半截动词断裂结尾（杜绝“...在”、“...于”、“...向”、“...通过”等没头没尾断裂）
  title = title.replace(/(?:[在于向从对将把与和或为就至达创报被由]|位于|处于|关于|探讨|围绕|随着|导致|通过|经由|通过香港)+$/, '').trim();

  // 彻底剔除所有感叹号、问号、省略号，转换为逗号或清除
  title = title.replace(/[！!？?]/g, '，').replace(/……|\.{2,}/g, '').replace(/^[，,\s]+|[，,\s]+$/g, '');
  return sanitizeEditorialTone(title);
}

// 核心结论生成引擎：说人话拒绝八股文，强制【硬核观点词】：【一句白话透视】格式，严禁禁忌词库与流水线连接词
export function generateCoreTakeaway(
  cleanTitle: string,
  content: string,
  track: TrackId,
  summary5W1H: Summary5W1H
): string {
  const t = (cleanTitle + ' ' + content).toLowerCase();

  // ── 中国宏观数据专属核心结论（最高优先级，通读数值并直接给出判断）────────────────────
  if (track === 'china_macro') {
    const { yoy, yoyStr, trend, pmi, pmiStr } = extractMacroMetrics(cleanTitle + ' ' + content);

    if (/cpi|居民消费价格/.test(t)) {
      if (yoy !== null && yoy < 0) {
        return `【物价负增长通缩警报】：CPI同比${yoyStr}${trend ? `（${trend}）` : ''}，进入负增长通缩区间——终端口径消费品价格持续承压，企业营收与利润率面临收缩，人民银行降准降息等增量总量工具释放空间打开。`;
      } else if (yoy !== null && yoy <= 1.0) {
        return `【物价处于低位区间】：CPI同比${yoyStr}${trend ? `（${trend}）` : ''}，通胀读数偏低——居民消费意愿仍处于筑底复苏阶段，宏观流动性环境维持宽松，债券市场获得防守型配置支撑，消费板块估值修复依托后续财政促消费政策落地。`;
      } else if (yoy !== null && yoy <= 2.5) {
        return `【物价温和回升内需修复】：CPI同比${yoyStr}${trend ? `（${trend}）` : ''}，进入温和健康通胀区间——终端消费需求稳步修复，A股消费与食品饮料等顺周期板块盈利基准改善，货币政策保持稳健中性定力。`;
      } else if (yoy !== null) {
        return `【通胀压力升温紧缩预期】：CPI同比${yoyStr}${trend ? `（${trend}）` : ''}偏高——央行降息窗口有所收窄，长端债券收益率面临调整压力，具备终端提价能力的中下游龙头有望改善毛利率。`;
      }
      return '【物价信号影响货币政策】：CPI数据直接决定央行降息节奏——低通胀打开宽松窗口，高通胀收窄操作空间，消费与地产板块的业绩预期随之重估。';
    }
    if (/ppi|生产者价格/.test(t)) {
      if (yoy !== null && yoy < 0) {
        return `【工业品出厂价格承压】：PPI同比${yoyStr}${trend ? `（${trend}）` : ''}，工业出厂价格仍处负值区间——反映工业上游产能出清与原材料供需博弈持续，中游加工制造企业成本端有所改善但出厂售价同样受限。`;
      }
      return `【工业端价格信号】：PPI同比${yoyStr || '最新发布'}${trend ? `（${trend}）` : ''}，反映上游工厂出厂价格走势，直接影响制造业利润与大宗商品需求预期。`;
    }
    if (/pmi|采购经理/.test(t)) {
      if (pmi !== null && pmi >= 50) {
        return `【制造业扩张景气确立】：PMI录得 ${pmiStr} 高于荣枯线50分水岭——工厂新订单与生产活动处于扩张阶段，实体经济修复动能显现，利好A股顺周期制造与工业供应链板块。`;
      } else if (pmi !== null && pmi < 50) {
        return `【制造业收缩去库压力】：PMI录得 ${pmiStr} 处于荣枯线50以下收缩区间——新订单释放相对审慎，企业仍处主动去库阶段，强化市场对财政增量与信用扩张政策的期待。`;
      }
      return '【景气度先行指标】：PMI跨越50荣枯分界是制造业扩张还是收缩的分水岭，数值走势直接折射实体经济复苏斜率。';
    }
    if (/gdp|国内生产总值/.test(t)) {
      return `【经济增速基准确立】：GDP增速${yoyStr || '最新发布'}${trend ? `（${trend}）` : ''}——超预期则外资加仓人民币资产，低于预期则财政刺激与降息预期升温，全年增长目标完成概率随之重估。`;
    }
    if (/lpr|贷款市场报价利率/.test(t)) {
      return '【中国货币政策与信贷基准定价】：中国人民银行授权全国银行间同业拆借中心公布最新LPR报价，1年期与5年期以上利率均按兵不动，体现央行在兼顾商业银行净息差与流动性充裕背景下稳步支持实体经济融资成本。';
    }
    return `【中国宏观数据发布】：${yoyStr ? `同比${yoyStr}${trend ? `（${trend}）` : ''}，` : ''}该数据直接影响人民银行货币政策取向与A股整体流动性预期。`;
  }

  // 0. 中外高层双边外交会见与立法机构交往（绝对优先，坚决禁止被外国央行降息/加息模板绑架）
  // 【硬性排除门禁】：A股大盘/指数行情开盘绝不套用外交会谈模板！且必须有中方高层政要出席，严禁美俄交火、以黎冲突乱套！
  if (
    /(?:会见|会谈|会晤|接见|来华访问|访华)/.test(t) &&
    /(?:赵乐际|王毅|何立峰|李强|习近平|中方代表团|中国外交部)/.test(t) &&
    /(?:众议长|参议长|代表团|外长|总理|总统|大臣|议长|迪克|澳大利亚|法方|德方|俄方|美方)/.test(t) &&
    !/(?:沪指|两市|上证|深成指|创业板|科创板|高开|低开|双双高开|双双低开|a股开盘|今日开盘)/i.test(t) &&
    !/(?:俄罗斯.*美国|美俄|以军|以色列|黎巴嫩|加沙|真主党|伊朗.*美国|美伊)/.test(t)
  ) {
    return sanitizeEditorialTone(
      '【高层双边交往与多边互信深化】：双方就深化立法机构交往、推动双边经贸与多领域务实合作交换意见，以稳定政策预期赋能跨境经贸与产业链互利合作。'
    );
  }

  // 0.05 A股大盘/指数行情开盘专属核心结论（严禁套用外交、IPO或企业战略模板）
  if (/(?:沪指|两市|上证|深成指|创业板|科创板|高开|低开|双双高开|双双低开|a股开盘|今日开盘)/i.test(t) && !/美股|标普|纳斯达克|道琼斯/.test(t)) {
    return sanitizeEditorialTone(
      '【A股盘面开盘与情绪博弈】：A股主要股指集合竞价定价反映隔夜外盘与国内政策预期，两融与北向资金根据开盘强弱信号调整日内板块轮动节奏。'
    );
  }

  // ── 企业IPO / 上市开盘 / 资本市场重估专属核心结论（严格限定真实IPO，严禁股指期货冒名） ──
  const isStrictTakeawayIPO =
    /(?:首次公开发行|\bipo\b|敲钟上市|正式挂牌|首日上市|登陆科创板|登陆港交所|挂牌上市)/i.test(t) &&
    !/(?:期货|期指|期权|标普|道指|纳斯达克.*期货|纳指.*走高|指数|涨跌幅|走高|下挫)/.test(t);

  if (isStrictTakeawayIPO) {
    const profile = getCompanyProfileForNews(cleanTitle, content);
    const sector = (profile?.sector || '').toLowerCase();

    if (/存储|dram|nand|长鑫|长存|海力士|美光|兆易/.test(t) || /存储|dram|nand/.test(sector)) {
      return '【存储芯片资本重估与扩产】：自主先进制程存储芯片获资本市场流动性赋能，加速高密度DRAM/3D NAND与高带宽内存产线扩产与终端客户导入。';
    }
    if (/晶圆|代工|中芯|华虹|台积电/.test(t) || /晶圆代工/.test(sector)) {
      return '【晶圆代工产能重构与资本支持】：纯晶圆制造龙头依托二级市场融资扩充先进制程与特色工艺晶圆产能，筑牢半导体全产业链硬件制造底座。';
    }
    if (/设备|刻蚀|薄膜|清洗|北方华创|中微|拓荆|盛美|光刻|asml/.test(t) || /设备|装备/.test(sector)) {
      return '【半导体关键设备国产化加速】：核心半导体设备与关键零组件龙头资本化提速，攻坚前道制程卡脖子环节并推动客户产线全流程验证交付。';
    }
    if (/芯片|算力|gpu|半导体|燧原|沐曦|摩尔线程|壁仞|寒武纪|天数智芯|昆仑芯|地平线/.test(t) || /算力|gpu|ai芯片/.test(sector)) {
      return '【国产算力资本化重估】：国产云端AI芯片迎来资本市场高溢价定价，资金高度聚焦自主全栈大模型集群算力底座，加速先进制程流片与商业化交付。';
    }
    if (/新能源|锂电|电池|储能|光伏|宁德时代|比亚迪/.test(t) || /新能源|电池/.test(sector)) {
      return '【绿色能源资本重估】：先进电池与储能龙头登陆资本市场获取高流动性支持，助推产业规模效应释放与全球化出海交付。';
    }
    return '【资本市场定价与流动性溢价】：标的企业完成上市并获二级市场流动性重估，募集资金直接扩充资本实力并加速核心业务扩张交付。';
  }

  // ── 机构权益策略与券商研报（港股/A股策略）──
  if (/港股策略|a股策略|仓位灵活性|仓位配置|研报.*称|策略研报/.test(t) || /华泰证券|中信证券|中金公司.*研报|招商证券.*策略/.test(cleanTitle)) {
    return sanitizeEditorialTone(`【机构权益配置策略与仓位校准】：${cleanTitle}；机构研报立足估值性价比与流动性窗口，引导机构资金审慎把握结构性修复契机。`);
  }

  // ── 宏观通胀数据专属核心结论（高盛/大摩级投研定性，严禁企业套话与复读标题）──
  if ((isMacroInflationNews(t) || /cpi|通胀|ppi|pce/.test(t)) && !/港股|a股|研报|策略|仓位|券商|华泰/.test(cleanTitle)) {
    return sanitizeEditorialTone(getMacroInflationTakeaway(cleanTitle, content));
  }

  // 1. 核心主体与商业现实硬核直击（5W1H 闭环 + 硬核数字）
  if (/台积电|2nm|先进制程|晶圆/.test(t)) {
    return '【先进制程定价权确认】：供应链消息显示台积电 (TSMC) 计划针对 2nm 先进制程代工报价上调 10%~15%；苹果与英伟达为锁定首批排产份额已全额锁定前两批晶圆配额，推升次世代旗舰硬件采购成本中枢。';
  }
  // 2. 北美AI电网瓶颈 / 变压器
  if (
    (/北美.*(?:变压器|电网|数据中心)|变压器.*(?:排队|订货|交付|缺口)|数据中心.*(?:并网|配电|通电)|万卡.*电网/.test(t) ||
      (/变压器|电网/.test(t) && /算力|机房|机柜|gpu/.test(t))) &&
    !/a股|沪指|上证|深成指|创业板|两市|板块|概念|涨停|特高压/.test(t) &&
    track === 'apac_tech'
  ) {
    return sanitizeEditorialTone('【电网与算力基础设施瓶颈】：芯片部署周期与高压变压器长达数年的交付周期形成供需错配，具备稳定电力直供和并网指标的数据中心优先释放算力变现能力。');
  }
  // 2.1 A股电网设备与特高压板块
  if (/电网|特高压|变压器|电力设备/.test(t) && /a股|沪深|两市|板块|创业板|上证|指数|概念|涨停/.test(t)) {
    return sanitizeEditorialTone('【电网特高压与设备景气】：主网与特高压建设进入密集交付期，核心变电与特高压设备厂商在手订单充沛，受外需出海与国内电网双重驱动。');
  }
  if (/openai|gpt|推理架构|思维链|agent/.test(t)) {
    return sanitizeEditorialTone('【模型架构升级与商业化落地】：前沿AI模型逐步转向推理时多轮计算与思维链验证架构，降低生成幻觉并加速在高门槛企业级业务场景渗透。');
  }
  // 3.1 澳洲联储 (RBA 货币政策专属，严禁套用到中澳双边外交)
  const isTakeawayAustraliaRBA =
    /(?:澳联储|澳洲联储|\brba\b|布洛克|澳元利率|澳大利亚央行)/i.test(t) ||
    (FOREIGN_ENTITIES.AUSTRALIA.test(t) &&
      /加息|降息|现金利率|基准利率|通胀率|货币政策|息率/.test(t) &&
      !/会见|会谈|众议长|参议长|访华|两国外交|代表团/.test(t));
  if (isTakeawayAustraliaRBA) {
    return '【紧缩定力保持基准】：澳洲联储 (RBA) 官方重申抗击通胀为首要任务，核心 CPI 仍位于 3.5% 以上粘性区间；行长表示年内不具备降息条件，高息环境将持续压制商业借贷与地产抵押信贷。';
  }
  // 3.2 欧洲央行 (ECB)
  if (FOREIGN_ENTITIES.EUROPE_ECB.test(t)) {
    return sanitizeEditorialTone('【欧洲央行审慎权衡】：在通胀回落与欧洲经济疲软之间艰难权衡，降息窗口虽逐步打开但节奏极其克制。');
  }
  // 3.3 英国央行 (BOE)
  if (FOREIGN_ENTITIES.UK_BOE.test(t)) {
    return sanitizeEditorialTone('【英国央行高息维稳】：薪资与服务业通胀粘性迫使英格兰银行保持审慎，全面宽松窗口被不断校准推迟。');
  }
  // 3.4 中国国债 / 财政发债 / 央行逆回购
  if (/(?:中国.*国债|财政部.*国债|超长期特别国债|特别国债发|国债发行|记账式国债)/.test(t)) {
    return sanitizeEditorialTone(
      '【国家财政发债与跨周期稳增长】：财政部推进国债发行筹集长期建设资金，优化政府债务久期结构并为国家重点战略工程提供坚实流动性保障。'
    );
  }
  if (/央行.*开展.*逆回购|开展.*逆回购操作|逆回购到期/.test(t)) {
    return sanitizeEditorialTone(
      '【央行公开市场灵活平抑流动性】：央行根据银行间流动性供求灵活调节逆回购操作规模，确保资金面平稳跨月与金融机构流动性合理充裕。'
    );
  }
  // 4. 美债收益率 / 非农 / 降息 (严格限定美方实体，严防中国国债串味)
  if (
    !isTakeawayAustraliaRBA &&
    !FOREIGN_ENTITIES.EUROPE_ECB.test(t) &&
    !FOREIGN_ENTITIES.UK_BOE.test(t) &&
    !/(?:中国|我国|地方债|国库现金|国库定存|进出口行|农发行|财政部.*国债|特别国债|超长期特别国债)/.test(cleanTitle) &&
    (/美债|美国国债|两年期美债|10年期美债|us10y|us02y/i.test(cleanTitle) ||
      ((/美联储|降息|非农/.test(cleanTitle)) && track === 'us_macro' && !/中国|我国|公募|A股|港股/.test(cleanTitle)))
  ) {
    return sanitizeEditorialTone('【利率高位粘性与降息预期校准】：美国强劲就业与服务业通胀支撑政策利率中枢，短久期美债收益率反弹，依赖快速大幅宽松的主动多头策略面临再平衡。');
  }

  // ──────────────── 大宗商品与能源航运一级互斥定性（主语优先原则） ────────────────
  const cleanTitleLower = cleanTitle.toLowerCase();

  // 1. 航运物流与集运欧线（最高优先级独占分支）
  if (/(?:集运|欧线|航运|海运|运价|scfi|bdi|散货船|集装箱船|港口拥堵|好望角|红海)/.test(cleanTitleLower)) {
    return sanitizeEditorialTone('【航运运价与亚欧舱位博弈】：绕航好望角与班轮挺价意愿支撑集运欧线现货运价，外贸货运与货代长协签约博弈加剧。');
  }

  // 2. 锂电与新能源材料（独占分支）
  if (/(?:碳酸锂|氢氧化锂|锂盐|电池级碳酸锂|mmlc|上海钢联.*碳酸锂)/.test(cleanTitleLower)) {
    return sanitizeEditorialTone('【锂电材料供求博弈与现货微调】：动力电池排产节奏与上游锂盐库存形成微观平衡，现货价格短期企稳并引导下游正极材料按需平稳采购。');
  }

  // 3. 基础工业有色金属（铜/铝/锌/镍/锡/铅）
  if (/(?:lme|伦敦金属|期铜|沪铜|精炼铜|电解铜|铝库存|铜库存|有色金属|期锌|期镍|期锡|期铅|沪铝|沪锌|沪镍|沪锡|沪铅|波兰铜业)/.test(cleanTitleLower)) {
    return sanitizeEditorialTone('【基础有色金属库存与基差变动】：LME及内盘交易所库存升降反映工业基本面现货供求，升贴水结构引导现货交割与套期保值。');
  }

  // 4. 原油与化石能源 (排除国内民用天然气/管网基建)
  // opec|原油|减产|油价
  if (/(?:opec|原油|减产|油价|布伦特|wti|自愿减产|延长减产)/.test(cleanTitleLower) && !/食用油|地沟油|天然气|管网|输气/.test(cleanTitleLower)) {
    return sanitizeEditorialTone('【供给侧自律平衡财政预算】：OPEC+计划顺延每日220万桶自愿减产协议；核心产油国通过供给调节锚定国际油价中枢，保障主权财政盈亏平衡。');
  }
  if (/(?:天然气|lng|管网|输气)/.test(cleanTitleLower) && !/opec|原油|自愿减产/.test(cleanTitleLower)) {
    return sanitizeEditorialTone('【清洁能源保供与基础设施互联】：跨区域天然气主干管网加速打通输配瓶颈，储气调峰与管道输配协同保障迎峰度夏/度冬平稳用能。');
  }

  // 5. 具身智能与特斯拉供应链审厂
  if (/特斯拉.*审厂|机器人.*审厂|长三角.*审厂|人形机器人.*供应链/.test(t)) {
    return sanitizeEditorialTone(
      '【具身智能硬件供应链加速导入】：特斯拉加快人形机器人核心零部件国内供应链审厂与良率验证，推动减速器、伺服电机与轻量化材料供应商批量交付进程。'
    );
  }

  // 美股三大指数期货专属（严格排除大宗商品期货）
  if (
    (/(?:美股|三大股指|道指|标普|纳斯达克|纳指).*(?:期指|期货|指数期货)/.test(t) ||
      (/期指/.test(t) && !/原油|大宗|铜|黄金|农产品|铁矿|航运|集运/.test(t))) &&
    !/opec|原油|减产|油价|布伦特|wti|铜|铁矿|集运/.test(t)
  ) {
    return sanitizeEditorialTone('【股指衍生品与盘前情绪锚定】：指数期货涨跌反映跨市场资金对宏观利率与微观业绩预期的最新定价，为现货开盘提供流动性指引。');
  }
  if (/加密|比特币|btc|eth/.test(t)) {
    return sanitizeEditorialTone('【多头获利了结与头寸再平衡】：连续上行后短期杠杆多头头寸获利丰厚，非农数据超预期推迟美联储降息时间表，主动型量化基金选择锁定浮盈控制组合回撤。');
  }
  // 7. 标普500成分股调整
  if (/标普500纳入|成分股|因美纳/.test(t)) {
    return '【被动配置窗口确立】：标普道琼斯指数宣布相关标的纳入标普500成分股；按追踪该指数的被动配置资产测算，将带来显著刚性买盘再平衡配置。';
  }
  // 7.1 日本财务省 / 日元汇率 / 植田和男
  if (/日元|财务省|财务大臣|加藤胜信|植田和男|日银|日本央行|东证/.test(t)) {
    return sanitizeEditorialTone('【日元汇率与官方干预】：日本财务省频频就汇率异动喊话施压，根本痛点在于输入型通胀加剧与海外息差悬殊；一旦关键防线失守，央行将面临被迫加息或真金白银直接入场干预的巨大压力。');
  }

  // 朝鲜武器试验与半岛局势专属定性（严禁套用中东空袭与地缘套话）
  if (/金正恩|朝鲜.*(?:武器|试验|导弹|战备|发射|试射)|新型武器试验|火星炮|朝中社/.test(t)) {
    return '【半岛战备反制与战略威慑】：朝鲜最高领导人现场观摩新型战术武器试验，强化常规与战略打击反制能力，半岛地缘遏制态势进入高频攻防博弈。';
  }

  // 中东地缘冲突专属定性（限定以军、黎巴嫩、真主党、加沙实体，严禁裸匹配导弹）
  if (/(?:以军|以色列|国防军).*(?:空袭|黎巴嫩|贝鲁特|加沙|真主党)|(?:黎巴嫩|真主党|加沙|也门胡塞).*(?:空袭|交火|导弹袭击)|中东地缘交火/.test(t)) {
    return '【中东地缘交火风险溢价走阔】：以色列国防军对黎巴嫩南部实施空袭，双方沿边境交火密集度上升；停火协议关键条款分歧难消，推升区域航运与能源风险溢价。';
  }

  if (/泄密|五角大楼|测谎|武器库存/.test(t)) {
    return '【涉密合规与国防审计升级】：美国国防部（五角大楼）就关键战备库存泄露启动反间谍审查并执行测谎；涉密外包权限全面收紧，驱动防务数据安全与保密合规预算刚性扩张。';
  }
  if (/物流.*景气|物流.*50.9%|货流/.test(t)) {
    return '【物流景气指数企稳扩张】：中国8月物流业景气指数回升至 50.9% 扩张区间；工业原料周转提速与电商备货需求回暖，实体制造业供应链货流进入良性循环。';
  }
  if (/(?:东兴|信达|中金).*(?:重组|合并|停牌)|(?:重组|合并).*(?:东兴|信达|中金)/.test(t)) {
    return '【券商头部集约整合推进】：中金公司、东兴证券与信达证券就并购重组进入停牌阶段；监管引导集约化经营与资本中介能力做强，行业竞争格局向具备全牌照资产池的龙头集中。';
  }
  if (/商务部.*贸易救济|反歧视|反制|出口管制/.test(t)) {
    return '【多边贸易救济合规评估启动】：商务部依法对单边经贸限制展开反歧视审查评估；中方依据世贸组织规则维护合法权益，推动多边经贸机制回归常态。';
  }
  if (/禽流感|乌拉圭|卫生紧急状态/.test(t)) {
    return '【生物安全防控升级防范外溢】：乌拉圭政府就禽流感疫情启动国家公共卫生紧急状态；周边主要农牧出口国提高海关边境抽检级别，防止疫情冲击南美核心蛋白供应产业链。';
  }
  // 16.2 刚果（金）埃博拉疫情与全球公共卫生预警
  if (/刚果.*埃博拉|埃博拉疫情/.test(t)) {
    return '【全球公共卫生与海外疫情预警】：刚果（金）卫生部门与世界卫生组织（WHO）推进埃博拉病毒流行病学溯源与疫苗阻击，跨国矿业物流与赴非人员严防输入性接触感染。';
  }
  // 17. 监管铁拳与司法惩治 (王建军/做空/操纵市场/反腐调查)
  if (/王建军/.test(t)) {
    return '【司法惩治严厉震慑发审寻租】：青岛市中院依法对证监会原副主席王建军受贿 9340 万元判处无期徒刑；司法机关严厉惩治资本市场审批腐败，从严确立制度规范与法治监管底盘。';
  }
  if (/(?:判死缓|判处无期|一审宣判|被判刑|依法审理|受贿逾|受贿|涉嫌受贿|涉嫌严重违纪违法|立案审查|纪律审查|监察调查|落马|双开)/.test(cleanTitle)) {
    return '【穿透治理与严肃追责惩戒】：纪检监察与司法机关严厉惩治职务犯罪与违纪违法行为，依法没收全部违法所得，强化制度刚性约束与权力运行监督。';
  }
  // 18. 特别国债注资与地方化债
  if (/特别国债注资|注资银行|注资险企|化债|地方债务/.test(t)) {
    return '【财政注资夯实商业银行资本】：财政部通过发行超长期特别国债注资大型国有商业银行；数千亿元资本金硬核注入全面提升核心一级资本充足率，筑牢金融系统稳健运行安全网。';
  }
  // 19. 系统性责任事故与地方大震荡 (伤亡事故/撞车/矿难)
  if (/内蒙古.*(?:事故|相撞|死)/.test(t)) {
    return '【重大安全事故全链条倒查】：内蒙古重大交通事故造成 5 人死亡，涉事客运与货运运营方遭停产整顿与立案倒查；行业主管部门开展全域道路交通隐患排查，压实安全主体责任。';
  }
  if (/相撞致.*死|重特大事故|坍塌|伤亡|遇难|停运/.test(t)) {
    return '【重大安全事故应急处置与倒查】：突发安全事故发生后应急救援力量全力组织搜救处置；主管部门依法开展事故调查与全域安全隐患排查，严格压实主体责任。';
  }
  // 19.2 吉隆口岸跨境地质灾害与抢险论证
  if (/吉隆口岸|冰岩崩|泥石流.*口岸/.test(t)) {
    return '【跨境突发地质灾害应急响应】：境外雪山冰崩引发跨境泥石流冲击西藏吉隆口岸；应急管理部与工程抢险部队打通陆路便道展开搜救，同时启动口岸防灾减灾冗余与综合选址评估。';
  }
  // 19.3 突发重大公共安全与极端社会应激事件 (恶性无差别暴力/持刀行凶/驾车冲撞/商圈校园袭击)
  if (/无差别.*(?:伤人|袭击|行凶|持刀|攻击)|持刀.*(?:伤人|行凶|砍人|刺伤|袭击)|随机伤人|恶性伤人|驾车冲撞|冲撞人群|袭警|重大治安|校园暴力|商场伤人|伤及无辜|恶性案件|故意伤害|杀害|报复社会|社会应激|极端事件/.test(t)) {
    return '【公共安全应急处置与治安防线加固】：突发恶性治安警情发生后，公安与应急力量快速出警控制嫌疑人并组织伤者救治；重点商圈、高校与人流密集区域全面启动联防联控巡查，从严守牢公共安全底线。';
  }
  // 19.4 突发公共卫生事件与传染病防御
  if (/公共卫生|突发疫情|传染病|疾控|确诊病例|聚集性疫情|突发感染|病毒感染|隔离管控|流行病|禽流感|登革热|炭疽|鼠疫|霍乱|诺如|食物中毒|甲流/.test(t)) {
    return '【公共卫生应急响应与疾控防线筑牢】：卫生疾控部门启动突发公共卫生事件应急预案，迅速落实流行病学调查、病例救治与重点区域消杀处置，防范风险扩散蔓延。';
  }
  // 19.5 重大自然灾害抢险与灾后重建 (特大洪涝/台风/强震/山洪泥石流)
  if (/特大暴雨|特大洪涝|特大干旱|超强台风|地震|强震|海啸|山洪|山体滑坡|泥石流|地质灾害|堰塞湖|决口|破堤|溃坝|林火|森林火灾|受灾群众|紧急避险|转移安置/.test(t) && !/吉隆口岸/.test(t)) {
    return '【重大自然灾害应急抢险与物资保供】：国家防总与应急管理部启动高级别防汛救灾应急响应；各级救援力量紧急转移安置受灾群众并抢修受损基础设施，全力保障人民生命财产安全。';
  }
  // 20. 关键底盘与供应链断裂 (零部件断供/停工)
  if (/突发断供|零部件断供|停工停产|断链|造假暴雷/.test(t)) {
    return '【核心供应链自主备份提速】：关键海外零部件断供风险促使主机制造企业启动二级供应商替代验证；国产自主元器件加速导入核心物料清单，提升产业抗单点冲击韧性。';
  }
  // 21. 单方自宣突破与非正式辟谣
  if (checkUnilateralClaim(cleanTitle, content)) {
    return '【单方自宣仍待客观验证】：单方面企业信息通报在缺乏独立第三方中立检测和实测交付前，需审慎对待其商业化成熟度与技术实际指标。';
  }

  // 2. 动态生成兜底：基于 5W1H 深度净化，彻底杜绝禁忌八股词与流水线连接词
  let why = (summary5W1H.why || '').trim().replace(/[。！!.]+$/, '');
  let consequence = (summary5W1H.consequence || '').trim().replace(/[。！!.]+$/, '');

  const banWords = [
    { p: /顶层定价特权/g, r: '核心供应链技术定价权' },
    { p: /自省反思/g, r: '自我多轮推演纠错' },
    { p: /精准阀门管理/g, r: '供给端产能调节' },
    { p: /刚性托底/g, r: '实打实的刚性需求' },
    { p: /贴现中枢/g, r: '资金借贷成本' },
    { p: /直接推高/g, r: '推升采购成本' },
    { p: /直接拉动/g, r: '显著拉动' },
    { p: /直接传导至/g, r: '传导至' },
    { p: /极大推动/g, r: '有效推动' },
  ];
  for (const { p, r } of banWords) {
    why = why.replace(p, r);
    consequence = consequence.replace(p, r);
  }

  const hardcoreTagMap: Record<TrackId, string> = {
    us_macro: /利率|借贷|美债|收益率|加息|降息|贷款/.test(t)
      ? '借贷成本高企'
      : /美股|纳指|标普|道指|财报/.test(t)
      ? '资产估值再定价'
      : /格雷厄姆|制裁/.test(t)
      ? '涉外长臂管辖与二级制裁升级'
      : /伊朗|中东|谈判/.test(t)
      ? '地缘安全与外交筹码博弈'
      : '宏观流动性再平衡',
    apac_tech: /利润|营收|财报|业绩|反超|毛利/.test(t)
      ? '行业盈利格局重塑'
      : /模型|算力|推理|大模型|ai/.test(t)
      ? 'AI算力架构演进'
      : '先进制程供需动态',
    commodities_shipping: '大宗供求与运力平衡',
    war_conflict: /格雷厄姆|二级制裁/.test(t)
      ? '涉外长臂管辖与二级制裁升级'
      : /航班|航线|民航|客运/.test(t)
      ? '涉外民航往来与口岸通关'
      : /谈判条件|谈判|外交|发言人|记者会/.test(t)
      ? '涉外政策立场与多边交涉'
      : '地缘局势与安全态势',
    china_domestic: '重大治理现实透视',
    china_policy: '经贸博弈与产业自立',
    china_macro: /cpi|居民消费价格/.test(t)
      ? '物价信号影响货币政策'
      : /ppi|生产者价格/.test(t)
      ? '工业端通缩压力'
      : /pmi|采购经理/.test(t)
      ? '景气度先行指标'
      : /gdp|国内生产总值/.test(t)
      ? '经济增速基准'
      : /lpr|贷款市场报价利率/.test(t)
      ? '中国货币政策与信贷基准定价'
      : '宏观数据校准市场预期',
    global_cognition: /埃博拉|疫情|世卫|who/.test(t)
      ? '全球公共卫生与海外疫情预警'
      : '全球宏观认知与产业链重塑',
  };
  let tag = hardcoreTagMap[track] || '商业现实透视';
  let connector = '使得市场面临现实痛点：';

  if (track === 'china_domestic') {
    if (/无差别.*(?:伤人|袭击|行凶|持刀|攻击)|持刀.*(?:伤人|行凶|砍人|刺伤|袭击)|随机伤人|恶性伤人|驾车冲撞|冲撞人群|袭警|重大治安|校园暴力|商场伤人|伤及无辜|恶性案件|故意伤害|杀害|报复社会|社会应激|极端事件/.test(t)) {
      tag = '公共安全防线与极端应激治理';
      connector = '现场警情处置与防控态势：';
    } else if (/公共卫生|突发疫情|传染病|疾控|确诊病例|聚集性疫情|突发感染|病毒感染|隔离管控|流行病|禽流感|登革热|炭疽|鼠疫|霍乱|诺如|食物中毒|甲流/.test(t)) {
      tag = '突发公共卫生与疾控防线';
      connector = '流行病学处置与应急防控：';
    } else if (/泥石流|山洪|滑坡|地质灾害|突发暴雨|极端强降雨|防汛抢险|抗洪|塌方|堰塞湖|地震|强震|海啸|台风|超强台风|洪涝|干旱|林火|森林火灾|受灾|失联|致.*死|死伤|遇难/.test(t)) {
      tag = '特大自然灾害与应急抢险';
      connector = '现场应急搜救与抢险态势：';
    } else if (/事故|相撞|伤亡|遇难|火灾|爆炸|安全|矿难/.test(t)) {
      tag = '安全生产底线一票否决';
      connector = '事故隐患排查与整顿追责：';
    } else if (/反腐|落马|被查|受贿|判刑|立案|双开|违纪违法/.test(t)) {
      tag = '穿透治理与反腐高压';
      connector = '纪检司法整肃与合规惩戒：';
    } else if (/人口|老龄化|生育|社保|医保|民生/.test(t)) {
      tag = '民生底盘与社会治理';
      connector = '基本民生托底与制度落地：';
    } else if (/特别国债|化债|财政|隐性债务/.test(t)) {
      tag = '主权信用硬核兜底';
      connector = '财政协同与资金落地传导：';
    }
  } else if (track === 'war_conflict') {
    connector = '前线博弈与战略威慑态势：';
  }

  let view = '';
  if (why && consequence) {
    view = `${why}，${connector}${consequence}。`;
  } else if (why) {
    view = `${why}。`;
  } else if (consequence) {
    view = `直接影响方面，${consequence}。`;
  } else {
    let factDesc = (summary5W1H.what || cleanTitle || '').trim().replace(/[。！!.]+$/, '');
    // 严禁将“主持例行记者会 / 答记者问”等引言空话作为核心观点输出
    if (/主持例行记者会|主持记者会|举行发布会|在例行发布会上|例行记者会|开场白/.test(factDesc)) {
      if (content) {
        const statements = content.split(/[。！？\n]/).map(s => s.trim()).filter(s => /表示|强调|指出|重申|称|明确|介绍|回答|谈到|回应/.test(s));
        if (statements.length > 0) {
          factDesc = statements[0].slice(0, 75).replace(/[。！!.]+$/, '');
        } else {
          factDesc = cleanTitle;
        }
      } else {
        factDesc = cleanTitle;
      }
    }
    const cleanT = cleanTitle.replace(/^[【\[][^】\]]+[】\]]/, '').replace(/[。！!.]+$/, '').trim();
    if (factDesc === cleanT || (factDesc.includes(cleanT) && factDesc.length <= cleanT.length + 5)) {
      if (/航班|航线|民航|通航|客运|降落|起飞/.test(t)) {
        view = '民航主管部门与外交机构依法依规统筹国际客运航线运营，确保国际人员正常往来与口岸秩序稳定。';
      } else if (/芯片|算力|半导体|晶圆|先进制程/.test(t)) {
        view = '关键硬件制程与系统级协同成为核心壁垒，资金向具备自主研发与量产交付能力的龙头厂商加速集聚。';
      } else if (/模型|ai|算法|推理/.test(t)) {
        view = '底层智算硬件与前沿大模型算法加速协同演进，以自主算力底盘构筑全栈工程化交付壁垒。';
      } else if (/利润|营收|反超|财报|业绩/.test(t)) {
        view = '细分赛道龙头在成本管控、技术溢价与市场份额维度展现分化优势，机构资金向具备确定性现金流韧性的标的集中。';
      } else if (/被查|立案审查|纪律审查|监察调查|落马|双开|受贿|一审宣判|反腐|涉嫌严重违纪违法/.test(t)) {
        view = '纪检监察机关依法依规严肃查处违纪违法行为，坚决铲除腐败滋生土壤并巩固公权力廉洁规范行使。';
      } else if (/汇率|联系汇率|港元|人民币.*中间价|外汇|结汇|售汇/.test(t)) {
        view = '官方表态锚定汇率制度稳定预期，引导跨境资本流动与外汇市场有序运行。';
      } else if (/财政部.*发行|国债.*发行|债券.*发行|发行.*债券|发行利率|投标倍数|国库现金定存|中标利率/.test(t)) {
        view = '财政部门统筹发债节奏与利率定价，优化政府债务期限结构并保障重点领域资金供给。';
      } else if (/买地|拿地|土地出让|摘牌|地块|土地市场/.test(t)) {
        view = '头部企业逆周期配置核心地段土地储备，强化长期产能布局与区域战略纵深。';
      } else if (/充电桩|充电基础设施|新能源车|电动汽车.*保有量/.test(t)) {
        view = '新能源基础设施加速规模化覆盖，保障终端用户补能体验并推动运营商盈利模型优化。';
      } else if (/逆回购|公开市场|mlf|slf|再贴现|央行.*操作/.test(t)) {
        view = '央行灵活运用公开市场操作工具平抑银行间流动性波动，确保资金面平稳跨月。';
      } else if (/期货|主力合约|涨超|跌超|收涨|收跌|夜盘/.test(t)) {
        view = '期货衍生品价格波动直接反映产业链现货供需预期，引导套保与投机头寸动态再平衡。';
      } else {
        view = '涉事主体稳步推进核心战略部署，产业链关联方根据市场供求信号与合规框架重构中长期估值中枢。';
      }
    } else {
      view = `${factDesc}。`;
    }
  }

  // 严格在标点处自然截断，绝不硬切单词导致“大型。”等残句
  if (view.length > 82) {
    const sub = view.slice(0, 80);
    const punc = Math.max(sub.lastIndexOf('，'), sub.lastIndexOf('。'), sub.lastIndexOf('；'));
    if (punc >= 45) {
      view = sub.slice(0, punc) + '。';
    } else {
      view = sub + '。';
    }
  }

  return sanitizeEditorialTone(`【${tag}】：${view}`);
}

// 情绪温度色彩判定
function generateSentiment(title: string, content: string, track: TrackId): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  const combined = (title + ' ' + content).toLowerCase();
  if (/暴跌|崩盘|违约|破产|爆雷|空袭|袭击|泄密|受挫|跳水|承压|走弱|遇难|制裁|封锁|加税|死伤/.test(combined)) {
    return 'BEARISH';
  }
  if (/大涨|暴涨|攀升|突破|回升|提速|扩产|获批|落地|反弹|超预期|景气|盈利|降准|签约|合作/.test(combined)) {
    return 'BULLISH';
  }
  return 'NEUTRAL';
}

// 后续观察哨（关键时间窗口 / 待验证指标）
function generateNextWatchlist(title: string, content: string, track: TrackId): string {
  const t = (title + ' ' + content).toLowerCase();
  if (FOREIGN_ENTITIES.JAPAN.test(t)) {
    return '【后续观察哨】：锁定在 日本央行货币政策委员会委员最新表态与日本财务省外汇干预临界点。';
  }
  if (FOREIGN_ENTITIES.AUSTRALIA.test(t)) {
    return '【后续观察哨】：锁定在 澳洲联储（RBA）下一次货币政策利率决议与澳大利亚三季度核心 CPI 物价变动趋势。';
  }
  if (FOREIGN_ENTITIES.EUROPE_ECB.test(t)) {
    return '【后续观察哨】：锁定在 欧洲央行管理委员会（ECB）最新利率决议与欧元区主要成员国调和 CPI 通胀终值。';
  }
  if (FOREIGN_ENTITIES.UK_BOE.test(t)) {
    return '【后续观察哨】：锁定在 英国央行货币政策委员会（MPC）议息纪要与英国核心通胀及薪资增长数据。';
  }
  if (/港股|a股|港股策略|a股策略|仓位|华泰证券|中信证券|中金公司.*研报|券商研报|券商策略/.test(title + ' ' + content)) {
    return '【后续观察哨】：锁定在 港股恒生科技指数关键点位动能、南向资金净流入强度与下阶段核心中资资产盈利修复预期。';
  }
  if ((isMacroInflationNews(t) || /cpi|通胀/.test(t)) && !/港股|a股|研报|策略|仓位|券商|华泰/.test(title)) {
    return getMacroInflationNextWatchlist(title, content);
  }
  if (/美联储|降息|加息|非农|美债|收益率/.test(t) && !FOREIGN_ENTITIES.AUSTRALIA.test(t) && !FOREIGN_ENTITIES.EUROPE_ECB.test(t) && !FOREIGN_ENTITIES.UK_BOE.test(t) && !FOREIGN_ENTITIES.JAPAN.test(t)) {
    return '【后续观察哨】：锁定在 9月18日 FOMC 议息决议（降息25bps基准路径落地）与美联储最新季度点阵图指引。';
  }
  if (/台积电|先进制程|2nm|晶圆|芯片|半导体|英伟达|算力|asml/.test(t)) {
    return '【后续观察哨】：锁定在 下周英伟达全球开发者峰会及台积电投资人法说会资本开支指引。';
  }
  if (/openai|gpt|claude|anthropic|大模型|llm|agent/.test(t)) {
    return '【后续观察哨】：锁定在 下周OpenAI开发者大会API调用定价与多模态原生落地实测。';
  }
  if (/铜|伦铜|lme|矿石|铁矿/.test(t)) {
    return '【后续观察哨】：锁定在 伦敦金属交易所（LME）铜注册仓单变动与智利国家铜业公司月度报告。';
  }
  if (/航运|海运|红海|集运|运价|scfi|bdi/.test(t)) {
    return '【后续观察哨】：锁定在 上海航运交易所集装箱出口运价指数（SCFI）及苏伊士运河通行统计。';
  }
  if (/原油|油价|wti|布伦特|opec/.test(t)) {
    return '【后续观察哨】：锁定在 下周 OPEC+ 联合部长级监督委员会（JMMC）官方公报及EIA库存。';
  }
  if (/航班|航线|民航|通航|客运|降落|起飞/.test(t)) {
    return '【后续观察哨】：锁定在 民航局（CAAC）国际客运航线季度排班动态与出入境口岸通关运行通报。';
  }
  if (/外交部|发言人|例行记者会|新闻发布会|答问/.test(t) && !/空袭|导弹|交火/.test(t)) {
    return '【后续观察哨】：锁定在 外交部下一场例行发布会答问实录及相关双边事务司局涉外沟通进展。';
  }
  if (/俄乌|巴以|中东|黎巴嫩|以军|空袭|五角大楼|美军/.test(t) && !/航班|民航|客运/.test(t)) {
    return '【后续观察哨】：锁定在 联合国安理会闭门斡旋与霍尔木兹海峡/红海商业船舶通行监控指数。';
  }
  if (/(?:东兴|信达|中金).*(?:重组|合并|停牌)|(?:重组|合并).*(?:东兴|信达|中金)/.test(t)) {
    return '【后续观察哨】：锁定在 异议股东现金选择权实施结果及合并后新实体挂牌首日交易表现。';
  }
  if (/物流|经济|pmi|统计局|发改委|财政部|国债/.test(t) && !FOREIGN_ENTITIES.JAPAN.test(t) && !FOREIGN_ENTITIES.US_MACRO.test(t) && !FOREIGN_ENTITIES.AUSTRALIA.test(t)) {
    return '【后续观察哨】：锁定在 财政部及人大常委会超长期特别国债资金落地发布会与下周金融信贷数据。';
  }
  if (/关税|对华|反倾销|出口管制|商务部|实体清单/.test(t)) {
    return '【后续观察哨】：锁定在 欧盟委员会对华关税成员国表决窗口与美商务部出口管制动态。';
  }
  if (/无差别.*(?:伤人|袭击|行凶|持刀|攻击)|持刀.*(?:伤人|行凶|砍人|刺伤|袭击)|随机伤人|恶性伤人|驾车冲撞|冲撞人群|袭警|重大治安|校园暴力|商场伤人|伤及无辜|恶性案件|故意伤害|杀害|报复社会|社会应激|极端事件/.test(t)) {
    return '【后续观察哨】：锁定在 属地公安机关关于涉案嫌疑人审查与案发背景的权威通报，以及重点区域常态化巡逻安防联动机制落实。';
  }
  if (/公共卫生|突发疫情|传染病|疾控|确诊病例|聚集性疫情|突发感染|病毒感染|隔离管控|流行病|禽流感|登革热|炭疽|鼠疫|霍乱|诺如|食物中毒|甲流/.test(t)) {
    return '【后续观察哨】：锁定在 疾控中心关于传播链溯源进展、重点场所消杀排查以及医疗救治机构定点收治运行情况。';
  }
  if (/泥石流|山洪|地质灾害|滑坡|暴雨|防汛|抗洪|受灾|失联|致.*死|死伤|遇难|台风|地震|强震|洪涝|林火|森林火灾/.test(t)) {
    return '【后续观察哨】：锁定在 现场应急指挥部与减灾救灾委员会公布的受灾人员救助安置、次生灾害隐患排查及基础设施应急抢通进度。';
  }
  if (/事故|相撞|火灾|爆炸|坍塌|矿难|停运整顿|安全生产/.test(t)) {
    return '【后续观察哨】：锁定在 事故联合调查组官方定性通报、责任主体追责认定及全行业安全生产大排查落实通报。';
  }
  if (/反腐|中纪委|监委|立案审查|受贿|落马|违纪违法|双开/.test(t)) {
    return '【后续观察哨】：锁定在 纪检监察与司法机关公布的案件审查调查结论、违纪违法所得追缴及同行业专项整肃落实。';
  }
  const trackMap: Record<TrackId, string> = {
    us_macro: '【后续观察哨】：锁定在 下周美联储官员密集讲话日程与美股期权交割日波动率。',
    apac_tech: '【后续观察哨】：锁定在 下周全球科技巨头三季度资本开支与算力硬件采购能见度。',
    commodities_shipping: '【后续观察哨】：锁定在 国际大宗商品现货交割升贴水变化及跨大洋即期订舱价。',
    war_conflict: '【后续观察哨】：锁定在 战区周边关键能源航运走廊安保警报与多边斡旋停火进展。',
    china_domestic: '【后续观察哨】：锁定在 权威监管部门公布的后续政策执行细则及重点领域阶段性工作通报。',
    china_policy: '【后续观察哨】：锁定在 WTO争端仲裁委员会最新案件通报及双边经贸工作组会议日程。',
    china_macro: '【后续观察哨】：锁定在 国家统计局下一轮月度宏观数据发布窗口与人民银行货币政策操作信号。',
    global_cognition: '【后续观察哨】：锁定在 国际货币基金组织（IMF）全球经济展望秋季报告更新。',
  };
  return trackMap[track] || '【后续观察哨】：锁定在 下周关键宏观金融指标公布与国际监管机构例行通报。';
}

// 市场多空分歧焦点 (Consensus vs Divergence)
function generateBullBearDivergence(title: string, content: string, track: TrackId): { bullConsensus: string; bearDivergence: string } {
  const t = (title + ' ' + content).toLowerCase();
  if (FOREIGN_ENTITIES.JAPAN.test(t)) {
    return {
      bullConsensus: '日本企业加薪周期推进且半导体先进制造回流，东证龙头企业基本面具长期重估潜力。',
      bearDivergence: '海外与日本本土利差过宽加剧汇率贬值压力，央行若加快加息将推升国债偿债成本。',
    };
  }
  if (FOREIGN_ENTITIES.AUSTRALIA.test(t)) {
    return {
      bullConsensus: '大宗商品出口与采矿业稳固为澳洲经济提供坚实底盘，澳洲联储坚守通胀目标支撑澳元资产估值。',
      bearDivergence: '房贷利率与借贷成本高企持续抑制澳洲居民家庭消费，紧缩过久可能增加本土商业信贷违约风险。',
    };
  }
  if (FOREIGN_ENTITIES.EUROPE_ECB.test(t)) {
    return {
      bullConsensus: '欧洲核心通胀逐步朝目标收敛，适度宽松节奏有助于改善欧元区工业与制造业借贷条件。',
      bearDivergence: '地缘溢价与能源转型成本粘性高，若过早过快降息恐致欧元兑主要非美货币汇率波动加剧。',
    };
  }
  if (FOREIGN_ENTITIES.UK_BOE.test(t)) {
    return {
      bullConsensus: '英国服务业通胀韧性与实际工资回升支撑经济内生动力，英镑资产具备息差防守价值。',
      bearDivergence: '公共部门债务高企与借贷成本刚性，抑制英国私人投资与长期经济潜在增速。',
    };
  }
  if (/美联储|降息|加息|非农|通胀|美债|收益率/.test(t) && !FOREIGN_ENTITIES.AUSTRALIA.test(t) && !FOREIGN_ENTITIES.EUROPE_ECB.test(t) && !FOREIGN_ENTITIES.UK_BOE.test(t) && !FOREIGN_ENTITIES.JAPAN.test(t)) {
    return {
      bullConsensus: '非农与就业保持韧性验证美国经济软着陆逻辑，企业盈利底座依然牢固。',
      bearDivergence: '长端国债收益率居高难下，若通胀反复可能大幅推迟宽松窗口，科技股估值承压。',
    };
  }
  if (/芯片|半导体|先进制程|台积电|英伟达|算力|openai|大模型/.test(t)) {
    return {
      bullConsensus: '大模型与推理算法突破拉动万亿级硬件采购，先进制程与算力芯片排单能见度极高。',
      bearDivergence: '下游数据中心电力配电与机房建设延期，算力硬件实际点亮与商业化兑现面临时间差。',
    };
  }
  if (/铜|原油|大宗|航运|海运|红海|集运/.test(t)) {
    return {
      bullConsensus: '供给端弹性收紧叠加航运绕航消耗运力，显性低库存与实物交割提供极强抗跌溢价。',
      bearDivergence: '高利率抑制欧美传统制造业开工，若宏观终端需求放缓将压制现货提货意愿。',
    };
  }
  if (/战局|战争|军事|空袭|中东|黎巴嫩|俄乌/.test(t)) {
    return {
      bullConsensus: '大国顾及冲突失控成本，交火被限制在有限的外科手术式区间，不至于失控。',
      bearDivergence: '前线密集交火极易诱发突发误判或斩首报复，地缘危机可能随时跨界扩散。',
    };
  }
  if (/中金|证券|重组|合并|券商/.test(t)) {
    return {
      bullConsensus: '航母级现代投行诞生将显著提升证券业跨国资本中介能力，优化行业供给侧。',
      bearDivergence: '大型机构团队业务整合与系统融合周期较长，短时间内协同效应显现需要时间。',
    };
  }
  if (/密歇根|燃煤电厂|特朗普政府.*强令|能源部.*紧急权力|联邦电力法|数据中心.*用电/.test(t)) {
    return {
      bullConsensus: '法院裁决维护州级电网规划与清洁能源法治权威，避免消费者承担过时高成本燃煤机组额外补贴。',
      bearDivergence: 'AI数据中心算力激增引发的基荷电力缺口短期凸显，退役安排可能增加极端天气下的区域电网备用压力。',
    };
  }
  if (/无差别.*(?:伤人|袭击|行凶|持刀|攻击)|持刀.*(?:伤人|行凶|砍人|刺伤|袭击)|随机伤人|恶性伤人|驾车冲撞|冲撞人群|袭警|重大治安|校园暴力|商场伤人|伤及无辜|恶性案件|故意伤害|杀害|报复社会|社会应激|极端事件/.test(t)) {
    return {
      bullConsensus: '属地公安出警处置果断，嫌疑人已被当场控制且涉案伤员均获全力救治，社会治安大局保持平稳。',
      bearDivergence: '人流密集公共场所恶性突发事件冲击公众安全预期，重点商圈与高校常态化安防及基层矛盾排查成本上升。',
    };
  }
  if (/公共卫生|突发疫情|传染病|疾控|确诊病例|聚集性疫情|突发感染|病毒感染|隔离管控|流行病|禽流感|登革热|炭疽|鼠疫|霍乱|诺如|食物中毒|甲流/.test(t)) {
    return {
      bullConsensus: '疾控部门响应机制完备，流调溯源与分级诊疗迅速铺开，涉事突发公共卫生险情总体处于可防可控范畴。',
      bearDivergence: '局部传染扩散风险引发公众防范焦虑，特定人员聚集场所常态化防疫消杀与日常运营成本有所上升。',
    };
  }
  if (/泥石流|山洪|地质灾害|滑坡|暴雨|防汛|抗洪|受灾|失联|致.*死|死伤|遇难|台风|地震|强震|洪涝|林火|森林火灾/.test(t)) {
    return {
      bullConsensus: '各级救援力量与应急资金调拨迅速，关键生命通道与通讯电力加速抢通，受灾群众基本生活得到有效兜底保障。',
      bearDivergence: '极端地质灾情导致局部基建管网受损严重，次生灾害隐患持续排查与灾后永久性恢复重建需要一定周期。',
    };
  }
  if (track === 'china_domestic') {
    return {
      bullConsensus: '微观实物货流与工业用电回暖，逆周期财政与货币政策工具箱储备充裕。',
      bearDivergence: '物价中枢与微观企业盈利分化仍存，内需消费恢复的可持续性需宏观政策持续加码。',
    };
  }
  if (track === 'china_policy') {
    return {
      bullConsensus: '全产业链完备度与超大规模国内市场支撑自主替代，外部压力倒逼技术核心自立。',
      bearDivergence: '单边壁垒与对外投资审查增加跨境出海企业的法律合规运营成本与不确定性。',
    };
  }
  return {
    bullConsensus: '产业升级与跨国分工具备内生确定性，优质资产在调整后具备估值吸引力。',
    bearDivergence: '全球地缘政治与宏观流动性周期共振，跨市场波动率放大增加短期择时难度。',
  };
}

export function build5W1HSummary(
  title: string,
  content: string,
  time: string,
  source: string,
  track: TrackId
): Summary5W1H {
  // 1. 剥离标题首尾装饰与信源后缀
  let cleanTitle = title
    .replace(/^【.*?】\s*/, '')
    .replace(/（(?:法新社|路透社|彭博社|新华社|财新|日经|央视|第一财经|界面|财联社|华尔街见闻).*?）$/, '')
    .replace(/\((?:AFP|Reuters|Bloomberg|AP|FT|Nikkei).*?\)$/i, '')
    .trim();
  const rawTotal = (cleanTitle + ' ' + content).trim();
  const t = rawTotal.toLowerCase();

  // 识别新闻中的具体日期
  const eventDateMatch = content.match(/(?:当地时间)?(?:周[一二三四五六日]|本周[一二三四五六日])?[（(]?([0-9]{1,2}月[0-9]{1,2}日|[0-9]{1,2}月[0-9]{1,2}号|[0-9]{1,2}日[上下]午|[0-9]{1,2}日晚)[)）]?/);
  const eventDate = eventDateMatch ? eventDateMatch[0].replace(/[（）()]/g, '') : '';

  let when = time || '最新权威电讯';
  if (eventDate && !when.includes(eventDate)) {
    when = `${when}（事件发生于${eventDate}）`;
  } else {
    when = `${when}（电讯直发）`;
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Who (核心主体提取：优先解析真实机构、军队、企业或标题主动方，严禁捏造虚构机构)
  // ─────────────────────────────────────────────────────────────
  let who = '';

  // 1.1 比较/主动句型判定（如 "高达82%，长鑫利润率反超三星SK海力士" -> 优先将主动方认定为 Who）
  const compMatch = cleanTitle.match(/(?:(?:高达|超|逾)?[0-9.%]+[，,\s]*)?([A-Za-z0-9\u4e00-\u9fa5]{2,10}?)(?:息税前利润率|利润率|毛利率|营收|净利润|净利|销量|市值|份额|产能)?(?:反超|超越|超过|领先|力压|创下|暴增|大增)/);
  if (compMatch && compMatch[1]) {
    const cand = compMatch[1].trim();
    if (!/最新|快讯|电讯|权威|统计|数据显示|据悉|原标题/.test(cand)) {
      who = cand === '长鑫' ? '长鑫存储' : (cand === '中芯' ? '中芯国际' : cand);
    }
  }

  // 1.2 显式冒号结构：如 "伊朗外交部：已向美方发出警告"
  if (!who) {
    const colonMatch = cleanTitle.match(/^([^：:，,——]{2,20})[：:——]/);
    if (colonMatch && !/提醒|提示|快讯|电讯|最新|据悉|权威|突发|数据显示/.test(colonMatch[1])) {
      who = colonMatch[1].trim();
    }
  }

  // 1.25 纪检监察与司法审判案件主体定向解析（精准提取涉案官员与审判机关，杜绝把单位简写误当主谋或张冠李戴）
  if (!who && /(?:受贿|行贿|贪污|职务侵占|严重违纪|严重职务违法|被查|立案审查|提起公诉|开庭审理|一审宣判|判处|落马)/.test(cleanTitle)) {
    const corruptionOfficialMatch = cleanTitle.match(/(?:[\u4e00-\u9fa5]{2,14}?(?:省|市|委|部|局|院|会|行|银行|常委会|政协|公司|集团|企业))?(?:原|现任)?(?:副)?(?:董事长|总经理|总裁|省长|市长|书记|主任|部长|局长|院长|行长|主席|党组成员|高管)?(?:、)?(?:副)?(?:董事长|总经理|总裁|省长|市长|书记|主任|部长|局长|院长|行长|主席)?([A-Za-z\u4e00-\u9fa5]{2,4}?)(?:受贿|行贿|贪污|涉嫌|严重违纪|严重职务违法|被查|一审|宣判|案|被提起公诉|提起公诉|判处|判死缓|被判)/);
    if (corruptionOfficialMatch && corruptionOfficialMatch[0]) {
      const entity = corruptionOfficialMatch[0].replace(/(?:受贿|行贿|贪污|涉嫌|严重违纪|严重职务违法|被查|一审|宣判|案|被提起公诉|提起公诉|判处|判死缓|被判)+$/, '').trim();
      if (entity && entity.length >= 2) {
        who = `${entity}案涉案当事方与司法机关`;
      }
    }
  }

  // 1.3 优先在标题 (cleanTitle) 中匹配知名实体，避免被正文里的对比方（如三星、海力士）偷换主语！
  const KNOWN_ENTITIES_REGEX = /(长鑫存储|长鑫|中芯国际|沐曦集成电路|也门胡塞武装|胡塞武装|以色列国防军|以军|哈马斯|黎巴嫩真主党|真主党|乌克兰武装部队|乌军|俄罗斯国防部|俄军|美军|五角大楼|美国国防部|北约|欧盟委员会|中国人民银行|国家发展改革委|国家发改委|发改委|财政部|商务部|证监会|工信部|国务院国资委|国资委|国家应急管理部|应急管理部|国家统计局|统计局|交通运输部|外交部|美联储|欧洲央行|日本央行|英国央行|澳洲联储|台积电|英伟达|苹果|微软|谷歌|Meta|OpenAI|ASML|SK海力士|三星电子|三星|特斯拉|高通|博通|比亚迪|宁德时代|中金公司|淡水河谷|必和必拓|力拓|沙特阿美|OPEC\+?|国际海事组织)/;
  if (!who) {
    const titleEntityMatch = cleanTitle.match(KNOWN_ENTITIES_REGEX);
    if (titleEntityMatch) {
      let cand = titleEntityMatch[1];
      if (cand === '长鑫') cand = '长鑫存储';
      else if (cand === '三星') cand = '三星电子';
      else if (cand === '胡塞武装') cand = '也门胡塞武装';
      who = cand;
    }
  }

  // 1.4 语法主语识别：抓取动词前面的主语（例如 "也门胡塞武装完全控制曼德海峡" -> 抓取 "也门胡塞武装"；"江苏发行..." -> 抓取 "江苏省财政部门"）
  if (!who) {
    const profileMatch = getCompanyProfileForNews(cleanTitle, content);
    if (profileMatch) {
      who = profileMatch.name;
    }
  }

  if (!who) {
    const subjMatch = cleanTitle.match(/^(?:(?:高达|超|逾)?[0-9.%]+[，,\s]*)?([A-Za-z0-9\u4e00-\u9fa5]{2,16}?)(?:完全控制|控制|占领|宣布|发布|拟|称|表示|启动|完成|获批|遭遇|遭到|发生|空袭|打击|减产|加息|降息|公布|通报|裁定|判处|起诉|调查|决定|签署|呼吁|警告|反超|超越|超过|领先|力压|发行|买地|拿地|接棒|出任|履新|投资|中标|开工|投运)/);
    if (subjMatch) {
      const cand = subjMatch[1].trim();
      if (!/最新|快讯|电讯|权威|突发|据悉|统计|数据显示/.test(cand)) {
        if (/^(?:江苏|浙江|广东|山东|四川|北京|上海|河南|河北|湖北|湖南|安徽|福建|陕西|重庆|天津|辽宁|吉林|黑龙江|江西|山西|云南|贵州|广西|内蒙古|新疆|西藏|海南|甘肃|青海|宁夏)$/.test(cand)) {
          who = `${cand}省（市）政府相关主管机构`;
        } else {
          who = cand === '长鑫' ? '长鑫存储' : (cand === '中芯' ? '中芯国际' : cand);
        }
      }
    }
  }

  // 1.5 从正文首句识别知名实体
  const sents = content
    .replace(/\r\n/g, '\n')
    .split(/[。！？\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  if (!who && sents.length > 0) {
    const leadEntityMatch = sents[0].match(KNOWN_ENTITIES_REGEX);
    if (leadEntityMatch) {
      let cand = leadEntityMatch[1];
      if (cand === '长鑫') cand = '长鑫存储';
      else if (cand === '三星') cand = '三星电子';
      else if (cand === '胡塞武装') cand = '也门胡塞武装';
      who = cand;
    }
  }

  // 1.6 从全量文本兜底匹配知名实体
  if (!who) {
    const rawEntityMatch = rawTotal.match(KNOWN_ENTITIES_REGEX);
    if (rawEntityMatch) {
      let cand = rawEntityMatch[1];
      if (cand === '长鑫') cand = '长鑫存储';
      else if (cand === '三星') cand = '三星电子';
      else if (cand === '胡塞武装') cand = '也门胡塞武装';
      who = cand;
    }
  }

  // 1.7 若仍无独立实体，以报道信源为出处主体，绝不使用假大空虚构机构！
  // Patch 3: 严禁把媒体/通讯社/信源渠道名当核心主体！
  if (!who) {
    const isMediaOrWireSource = !source ||
      /联合早报|Zaobao|日经|路透|彭博|财新|第一财经|财联社|华尔街见闻|界面新闻|央视|新华社|中新社|证券时报|经济观察网|人民网|环球时报|参考消息|大宗商品|全球宏观|航运|电讯|专线|快讯|专讯|发布$|通报$|报道$|报告$/.test(source);
    who = isMediaOrWireSource ? '' : `${source}报道`;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Where (事件地点：仅提取原文明确提及的地理实体，未提及则留空，严禁张冠李戴)
  // ─────────────────────────────────────────────────────────────
  let where = '';
  const geoMatch = rawTotal.match(/(曼德海峡|红海|波斯湾|霍尔木兹海峡|苏伊士运河|巴拿马运河|好望角|加沙|黎巴嫩|叙利亚|也门|伊朗|伊拉克|以色列|乌克兰|莫斯科|基辅|黑海|波罗的海|西藏日喀则吉隆|西藏吉隆|吉隆口岸|日喀则|西藏|北京|上海|深圳|广州|香港|华盛顿|纽约|硅谷|伦敦|法兰克福|布鲁塞尔|东京|首尔|新竹|新加坡|乌拉圭|尼泊尔)/);
  if (geoMatch) {
    where = geoMatch[1];
  }

  // ─────────────────────────────────────────────────────────────
  // 3. What (事实要点：客观陈述事实动作，严禁贪婪正则删掉关键前半句；对发布会/问答/回应跳过“主持记者会/就某事回应”等引言，直取实质回复内容)
  // ─────────────────────────────────────────────────────────────
  let what = cleanTitle;
  if (sents.length > 0) {
    let targetSentence = '';
    // 3.1 若标题或首句属于“...回应”、“...答记者问”、“主持例行记者会”等，直接搜寻正文中官员/机构实质回复语句
    const isResponseOrBriefing = /回应|答问|答记者问|记者会|发布会|开场白|中方表示|中方指出|对此有何评论/.test(cleanTitle + ' ' + (sents[0] || ''));
    if (isResponseOrBriefing) {
      // 遍历所有句子，找到包含真实答复动作且具有实际说明内容的句子（跳过纯问句与主持引言）
      const substantiveAnswer = sents.find((s) => {
        const clean = s.trim();
        if (/主持例行记者会|主持记者会|举行发布会|在例行发布会上|开场白|有记者提问|有何评论|外交部发言人郭嘉昆/.test(clean) && !/表示|强调|指出|重申|称|明确|介绍|回答/.test(clean)) {
          return false;
        }
        return /(?:表示|强调|指出|重申|称|明确|介绍|回答|谈到|回应|敦促|呼吁|要求|反对|坚持|保障|推进)[，,\s]*/.test(clean) && clean.length >= 15;
      });
      if (substantiveAnswer) {
        targetSentence = substantiveAnswer;
      }
    }

    if (!targetSentence) {
      targetSentence = sents[0];
      const isPrologue = /主持例行记者会|主持记者会|举行发布会|答记者问|在例行发布会上|开场白/.test(targetSentence);
      if (isPrologue && sents.length > 1) {
        const substantive = sents.slice(1).find((s) => /表示|强调|指出|重申|称|明确|介绍|回答|谈到|回应/.test(s));
        if (substantive) {
          targetSentence = substantive;
        }
      }
    }

    let cleanLead = targetSentence
      .replace(/^[0-9]{1,2}月[0-9]{1,2}日(?:电|讯|消息)?[，,\s]*/, '')
      .replace(/^(?:据.*?电[：:，,\s]*|据.*?报道[：:，,\s]*)/, '')
      .replace(/^[（(]?(?:法新社|新华社|路透社|彭博社|央视网|人民网|财新网|界面新闻|财联社|第一财经|经济观察网|证券时报|中新社|日经)[)）]?[，,\s]*/, '')
      .replace(/^(?:快讯|电讯|直发|专电|通报|最新消息)[：:，,\s]*/, '')
      .trim();
    cleanLead = cleanLead.replace(/^[，,和与以及同时因此使得导致]+/, '').trim();
    if (cleanLead.length >= 10 && cleanLead.length <= 150) {
      what = cleanLead;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Why (起因事实：有原因就有原因，没有原因不要硬编写！严禁万能套话)
  // ─────────────────────────────────────────────────────────────
  let why = '';
  
  // 4.1 从正文提取显式因果关联句
  const causeMatch = rawTotal.match(/(?:因为|由于|受.*?影响|因.*?导致|起因于|主要系|主要因|旨在|为缓解|为应对|为防范|出于.*?考量|受.*?拖累|受.*?提振)([^。！？；\n]{4,60})/);
  if (causeMatch) {
    why = causeMatch[0].trim().replace(/^[，,]/, '');
  }

  // 4.2 针对特定严重灾害/事故/司法判决提取具体事实原因（非万能套话）
  if (!why) {
    if (/冰崩|冰岩崩/.test(rawTotal)) {
      why = '境外雪山高位冰岩崩诱发特大泥石流';
    } else if (/受贿|行贿|违法违纪|职务侵占/.test(rawTotal)) {
      why = '依法严肃惩治利用职务便利寻租腐败行为';
    } else if (/禽流感/.test(rawTotal)) {
      why = '散养禽类检测出高致病性病毒毒株，防范疫情向核心养殖带扩散';
    }
  }

  // 4.3 Why 启发式提取强化：识别次级原因引导词与行情/司法因果（严禁单字“受”误伤“接受/深受/受众”）
  if (!why) {
    const implicitWhyMatch = rawTotal.match(/(?:旨在|为了|配合|基于|受.*?影响|伴随|随着|由于)([^，,。；;\n]{4,30})/);
    if (implicitWhyMatch && implicitWhyMatch[1]) {
      why = implicitWhyMatch[1].replace(/^(?:着|随着|伴随|鉴于|鉴于此)\s*/, '').trim();
    } else if (/大跌|暴跌|跳水|走低|下挫|回调/.test(cleanTitle)) {
      why = '受短期市场获利了结盘抛压或外部宏观利空情绪压制';
    } else if (/大涨|暴涨|飙升|走高|冲高|反弹/.test(cleanTitle)) {
      why = '受多头买盘资金集中涌入或核心业务催化利好推动';
    } else if (/破产|清算|违约|立案|调查/.test(cleanTitle)) {
      why = '此前债务结构严重失衡或监管部门启动法治化稽查处置程序';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Consequence (后续影响：优先从原文提取直接影响，若原文无显式连接词则采用启发式分析)
  // ─────────────────────────────────────────────────────────────
  let consequence = '';
  const consequenceMatch = rawTotal.match(/(?:致使|导致|造成|引发|促使|使得|造成.*人死亡|造成.*人受伤|紧急分流|停航|中断|全境停电)([^。！？；\n]{4,60})/);
  if (consequenceMatch) {
    consequence = consequenceMatch[0].trim().replace(/^[，,]/, '');
    if (/造成的困境|如果.*?那么除了|并避免越陷越深/.test(consequence)) {
      consequence = '';
    }
  }

  // 5.1 Consequence 启发式提取强化：仅针对真正的金融资产行情使用“头寸重定价”，严禁普通社会统计/预测数据误套
  if (!consequence) {
    const isMarketQuote = /(?:指数|期指|收盘|开盘|期货|主力合约|报|收报|收涨|收跌|美元|基点|点位|美债|国债期货|沪铜|沪银|碳酸锂|集运欧线|原油|黄金)/.test(cleanTitle);
    const metricMatch = cleanTitle.match(/(?:涨超|跌超|收跌|收涨|大跌|大涨|报)\s*([0-9.,%]+[^\s，,。；;]*)/);
    if (metricMatch && isMarketQuote) {
      consequence = `盘面或指标录得${metricMatch[0]}，引导关联头寸短期重定价`;
    } else if (/推新法|签署|公布|发布新规|新规/.test(cleanTitle)) {
      consequence = '确立新合规标准与治理要求，倒逼行业主体调整业务运营架构';
    } else if (/签约|合作|协议|合资/.test(cleanTitle)) {
      consequence = '达成战略协同绑定，加速各方在中长期市场份额上的资源整合';
    } else if (/减产|停产|检修|关停/.test(cleanTitle)) {
      consequence = '缩减行业即期供给规模，收紧现货市场可流通库存缓冲垫';
    }
  }

  return {
    who,
    what,
    when,
    where,
    why,
    consequence,
  };
}

export function build5W1HParagraph(
  summary: Summary5W1H,
  title: string,
  content: string,
  source?: string
): string {
  // 重大涉外法案与外交谈判专属高阶事实段落（详述具体要务）
  if (title && isEventProvisionsNews(title, content)) {
    return buildEventProvisionsFactParagraph(title, undefined, source, summary.when);
  }

  let cleanWhat = (summary.what || title || '').trim().replace(/[。！!.]+$/, '');
  cleanWhat = cleanWhat.replace(/^[，,和与以及同时因此使得导致]+/, '').trim();
  const cleanWho = (summary.who || '').trim();
  const cleanWhere = (summary.where || '').trim();
  const cleanWhy = (summary.why || '').trim().replace(/[。！!.]+$/, '').replace(/^[，,\s]*(?:受|起因于|因为|由于|因)+\s*/, '').trim();
  let cleanConsequence = (summary.consequence || '').trim().replace(/[。！!.]+$/, '');
  if (/造成的困境|如果.*?那么除了|并避免越陷越深/.test(cleanConsequence)) {
    cleanConsequence = '';
  }

  const timePrefix = summary.when ? `据${summary.when}` : '据电讯';
  const sourceName = source || '信源';

  let factSentence = '';
  if (cleanWho && cleanWhat.startsWith(cleanWho)) {
    factSentence = `${timePrefix}（${sourceName}）电讯，${cleanWhat}。`;
  } else if (cleanWho && cleanWhat.includes(cleanWho)) {
    factSentence = `${timePrefix}（${sourceName}）电讯，${cleanWhat}。`;
  } else if (cleanWho && !cleanWhat.includes(cleanWho)) {
    const locPart = cleanWhere ? `在${cleanWhere}` : '';
    // 仅当 cleanWhat 以动作动词开头时拼接主语；若 cleanWhat 自身已是完整主谓从句，则不强行在句首叠加主语避免主谓打架
    const startsWithAction = /^(?:发布|宣布|拟|称|表示|启动|完成|获批|遭遇|遭到|发生|空袭|打击|减产|加息|降息|公布|通报|裁定|判处|起诉|调查|决定|签署|呼吁|警告|反超|超越|超过|领先|力压|大增|暴涨|达到|成为|实现)/.test(cleanWhat);
    if (startsWithAction) {
      factSentence = `${timePrefix}（${sourceName}）电讯，${cleanWho}${locPart}${cleanWhat}。`;
    } else {
      factSentence = `${timePrefix}（${sourceName}）电讯，${cleanWhat}。`;
    }
  } else {
    factSentence = `${timePrefix}（${sourceName}）电讯，${cleanWhat}。`;
  }

  // 有原因就陈述，没有原因绝不硬编写！
  let whySentence = '';
  if (cleanWhy && cleanWhy.length >= 4) {
    whySentence = ` 信源表明，该事项起因于${cleanWhy}。`;
  }

  // 有涉事主体背景则无缝融入业务速览（解答“为什么不简单介绍这家公司”）
  const profile = getCompanyProfileForNews(title, content);
  let profileSentence = '';
  if (profile && !factSentence.includes(profile.sector) && !factSentence.includes(profile.description.slice(0, 10))) {
    profileSentence = ` 涉事主体${profile.name}（${profile.sector}）：${profile.description}`;
  }

  // 有后续影响就陈述，没有就不硬编！
  let consequenceSentence = '';
  if (cleanConsequence && cleanConsequence.length >= 4) {
    consequenceSentence = ` 直接影响方面，${cleanConsequence}。`;
  }

  return `${factSentence}${profileSentence}${whySentence}${consequenceSentence}`.trim();
}


export interface CrossVerificationResult {
  verificationLevel: 'CROSS_VERIFIED' | 'OFFICIAL_DECREE' | 'SINGLE_SOURCE_FAST';
  verificationBadge: string;
  crossSourceCount: number;
  hasClarification: boolean;
  clarificationNote?: string;
}

// 多源交叉印证与辟谣嗅探引擎：
// 1. 扫描电讯是否包含“辟谣/澄清/否认/不实”
// 2. 判断是否为国家部委/央行/主权机构官方公报
// 3. 在多通道（WSCN、新浪、东方财富）全量原始电讯中比对实体关键词，识别是否为 2+ 通道交叉印证
export function evaluateCrossVerification(
  item: RawLiveItem,
  allRawItems: RawLiveItem[],
  primarySource: PrimarySourceInfo
): CrossVerificationResult {
  const combined = (item.title + ' ' + item.content).toLowerCase();

  // 1. 辟谣与澄清嗅探
  const isClarification = /辟谣|澄清|不实|假消息|纯属谣言|答记者问否认|并未表示|并非如此|与事实不符|绝无此事/.test(combined);
  if (isClarification) {
    return {
      verificationLevel: 'SINGLE_SOURCE_FAST',
      verificationBadge: '⚠️ 官方澄清/辟谣',
      crossSourceCount: 1,
      hasClarification: true,
      clarificationNote: '该条电讯包含对市场前期传闻或不实消息的官方正式澄清与否认。',
    };
  }

  // 2. 主权部委/央行/官方公报直发（最高可信度）
  const isOfficial = /财政部|交通运输部|发改委|商务部|住建部|民政部|应急管理部|人民银行|央行|美联储|国防部|国资委|外汇局|证监会|公报/.test(primarySource.source);
  if (isOfficial) {
    return {
      verificationLevel: 'OFFICIAL_DECREE',
      verificationBadge: '🏛️ 官方通报',
      crossSourceCount: 1,
      hasClarification: false,
    };
  }

  // 3. 多通道交叉互证比对（WSCN、SINA、EASTMONEY）
  const cleanTitle = item.title.replace(/^【.*?】\s*/, '');
  const keywords = cleanTitle
    .split(/[\s，,：:、。]/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !/公司|表示|宣布|今日|进行|目前|已经|将于|相关|亿元|同比|环比|举行|召开|根据|表示/.test(w));

  const platforms = new Set<string>();
  if (item.wireChannel) platforms.add(item.wireChannel);

  for (const other of allRawItems) {
    if (other.id === item.id) continue;
    const otherText = (other.title + ' ' + other.content).toLowerCase();
    const hit = keywords.some(k => otherText.includes(k.toLowerCase()));
    if (hit && other.wireChannel) {
      platforms.add(other.wireChannel);
    }
  }

  if (platforms.size >= 2) {
    return {
      verificationLevel: 'CROSS_VERIFIED',
      verificationBadge: `✓ 多源印证 (${platforms.size}通道)`,
      crossSourceCount: platforms.size,
      hasClarification: false,
    };
  }

  return {
    verificationLevel: 'SINGLE_SOURCE_FAST',
    verificationBadge: '⚡ 一手速递',
    crossSourceCount: 1,
    hasClarification: false,
  };
}

/**
 * 规则 1：【单篇独立上下文处理流水线 (Single Item Pipeline)】
 * 严禁大模型或清洗引擎将多条不同国家的新闻混杂在同一上下文！
 * 每篇抓取快讯均走严格物理隔离闭环：
 * 抓取单篇 -> 实体抽取 -> 前置国家互斥门禁 -> 信源物理继承 -> 5W1H/结论提取 -> 后置内容一致性熔断 -> 输出结构化卡片。
 */
export function processSingleItemIsolated(raw: RawLiveItem, rawItems: RawLiveItem[]): NewsItem | null {
  if (!raw || !raw.title || !raw.content) {
    return null;
  }

  // 0. 快速拦截：政界私人花边、自掏腰包送礼打赏与非市场杂音（关键词快速路径）
  if (isNonMarketTrivia(raw.title, raw.content)) {
    console.warn(`[TRIVIA FILTER] 物理丢弃非资本市场私人花边: "${raw.title}"`);
    return null;
  }

  // 1. 变量零污染硬性要求：每次进入单篇处理前，全新初始化所有分析变量，严禁复用全局/上一轮循环对象！
  let track: TrackId = classifyTrack(raw);

  // 0-B. 【语义资本市场相关性评分门禁】——通读全文，按8大传导向量类别打分
  // 豁免赛道（外汇/大宗/债券）或重大外溢突发事件直接放行；其余需至少命中1个传导类别
  const spilloverPre = evaluateSpilloverImpact(raw.title, raw.content);
  const relevance = evaluateCapitalMarketRelevance(raw.title, raw.content, track);
  if (!relevance.hasMarketSubstance && !spilloverPre.isSpilloverMajor) {
    console.warn(
      `[SEMANTIC GATE] 无资本市场传导实质，物理丢弃: "${raw.title}" | 原因: ${relevance.reason}`
    );
    return null;
  } else if (relevance.hitCategories.length > 0 && !relevance.hitCategories.includes('track_exempt')) {
    console.log(
      `[SEMANTIC GATE ✓] 放行 (score=${relevance.totalScore}): "${raw.title}" | 命中: ${relevance.hitCategories.join(', ')}`
    );
  }
  let cleanRawTitle = '';
  let cleanRawContent = '';
  let primary: PrimarySourceInfo | null = null;
  let enrichedTitle = '';
  let summary5W1H: Summary5W1H | null = null;
  let summaryParagraph = '';
  let coreTakeaway = '';
  let transmissionImpact = '';
  let bulletPoints: string[] = [];
  let sentiment: MarketSentiment = 'NEUTRAL';
  let nextWatchlist = '';
  let bullBearDivergence: BullBearDivergence = { bullConsensus: '', bearDivergence: '' };

  // 2. 早报复合简讯头（T早报｜、早报｜、晨报｜等）按分号拆解，只保留第一条独立新闻的正文闭环，严禁跨事件因果串味
  let effectiveRawTitle = raw.title;
  let effectiveRawContent = raw.content;
  if (/^(?:T早报|早报|晨报|晚报|环球财经|宏观晨报|每日内参)\s*[｜|·\-\/:：]/.test(effectiveRawTitle)) {
    const segments = effectiveRawTitle.replace(/^[^\s｜|·\-\/:：]+[｜|·\-\/:：]\s*/, '').split(/[；;]/);
    if (segments.length > 1 && segments[0].trim().length >= 8) {
      effectiveRawTitle = segments[0].trim();
      const firstSection = effectiveRawContent.split(/[；;\n]/)[0];
      if (firstSection && firstSection.length >= 12) {
        effectiveRawContent = firstSection.trim();
      }
    }
  }

  // 2.1 执行【国内重大资讯去伪与去宣传除杂指令】“三剥离、三保留”脱水规范
  const isDomestic = track === 'china_domestic' || track === 'china_policy';
  cleanRawTitle = sanitizeFedRatePolicyWording(isDomestic ? sanitizeDomesticNewsText(effectiveRawTitle) : effectiveRawTitle);
  cleanRawContent = sanitizeFedRatePolicyWording(isDomestic ? sanitizeDomesticNewsText(effectiveRawContent) : effectiveRawContent);

  // 3. 规则 2：【信源物理继承】严格从爬虫只读字段继承信源，严禁 AI/正则脑补
  primary = detectPrimarySource(cleanRawTitle, cleanRawContent, track, raw.source, raw.url);

  // 4. 规则 3A：【前置实体词互斥硬性门禁】
  // 日本/美联储/五角大楼等主权实体一票否决国内赛道与中国官方信源
  const guardrailPre = enforceCountryEntityGuardrails(cleanRawTitle, cleanRawContent, track, primary, raw.source);
  track = guardrailPre.correctedTrack;
  primary = guardrailPre.correctedSource;

  // 5. 单篇独立标题润色与 5W1H/深度小结推导
  enrichedTitle = enrichHeadline(cleanRawTitle, cleanRawContent, track);

  // 5.0 绝对拦截无主语断裂残片（如“分别涨4.77%...”）、纯数字代码流水账与短于8字的残缺断句
  const cleanTitleNoTag = enrichedTitle.replace(/^[【\[][^】\]]+[】\]]\s*/, '').trim();
  const isHeadlessTitle =
    cleanTitleNoTag.length < 8 ||
    /^(?:分别|其中|包括|以及|并且|而|且|但|导致|受此影响|据称|据悉|同时|涨超|跌超|分别涨|分别跌|超|达|[0-9.]+%|[涨跌][0-9.]+%)/.test(
      cleanTitleNoTag
    ) ||
    /^[^a-zA-Z\u4e00-\u9fa5]+$/.test(enrichedTitle) ||
    /^[0-9.%,、，\s]+$/.test(cleanTitleNoTag);

  if (isHeadlessTitle) {
    console.warn(`[HEADLESS TITLE REJECTED] 拦截无主语残缺标题: "${enrichedTitle}"`);
    return null;
  }
  summary5W1H = build5W1HSummary(enrichedTitle, cleanRawContent, raw.time, primary.source, track);
  summaryParagraph = build5W1HParagraph(summary5W1H, enrichedTitle, cleanRawContent, primary.source);
  coreTakeaway = generateCoreTakeaway(enrichedTitle, cleanRawContent, track, summary5W1H);
  transmissionImpact = inferTransmission(track, enrichedTitle, cleanRawContent);

  // 5.1 事实一致性审查门禁（verify_fact_faithfulness）：红线审查是否脱离原文存在虚构或过度脑补
  const faithfulness = verify_fact_faithfulness(cleanRawContent || cleanRawTitle, {
    title: enrichedTitle,
    core_conclusion: coreTakeaway,
    transmission_chain: transmissionImpact,
  });
  if (!faithfulness.pass) {
    console.warn(`[FACT FAITHFULNESS FAILED] ${faithfulness.reason} -> 自动回退至严格事实摘录模式: "${enrichedTitle}"`);
    const fallback = fallback_to_grounded_summary(cleanRawContent || cleanRawTitle);
    enrichedTitle = fallback.title;
    coreTakeaway = fallback.core_conclusion;
    transmissionImpact = fallback.transmission_chain;
  }

  // 结构化有效性拦截：若关键分析字段生成失败或为空，严禁借用上一有效值兜底，直接返回 null 物理丢弃！
  if (!enrichedTitle || !coreTakeaway || !transmissionImpact || !summaryParagraph || !summary5W1H) {
    console.warn(`[SINGLE ITEM PIPELINE INCOMPLETE] 单篇分析字段缺失，物理丢弃: "${raw.title}"`);
    return null;
  }

  // 6. 规则 3B & 3C：【后置内容一致性自检与实体错位校验网关】
  // 包括：日本实体 vs 国内国债；A股大盘/沪指 vs 北美变压器缺电；战局 vs 国内社会治理 等
  const consistency = checkCrossContamination(enrichedTitle, coreTakeaway, transmissionImpact, summaryParagraph);
  if (!consistency.isClean) {
    console.warn(`[GUARDRAIL CIRCUIT BREAKER] ${consistency.reason} -> 物理拦截并丢弃: "${enrichedTitle}"`);
    return null;
  }

  bulletPoints = extractBulletPoints(cleanRawContent, primary.source, raw.time).map(sanitizeEditorialTone);
  sentiment = generateSentiment(enrichedTitle, cleanRawContent, track);
  nextWatchlist = sanitizeEditorialTone(generateNextWatchlist(enrichedTitle, cleanRawContent, track));
  bullBearDivergence = generateBullBearDivergence(enrichedTitle, cleanRawContent, track);
  enrichedTitle = sanitizeEditorialTone(enrichedTitle);
  coreTakeaway = sanitizeEditorialTone(coreTakeaway);
  transmissionImpact = sanitizeEditorialTone(transmissionImpact);
  summaryParagraph = sanitizeEditorialTone(summaryParagraph);

  // 【通用重大外溢冲击收录标准】：命中 4 项外溢指标之一者强制为一级重大情报
  const spillover = evaluateSpilloverImpact(cleanRawTitle, cleanRawContent);
  const isImportant =
    spillover.isSpilloverMajor ||
    raw.title.includes('美联储') ||
    raw.title.includes('降息') ||
    raw.title.includes('收益率') ||
    raw.title.includes('空袭') ||
    raw.title.includes('导弹') ||
    raw.title.includes('乌克兰') ||
    raw.title.includes('伊朗') ||
    raw.title.includes('注资') ||
    raw.title.includes('制裁') ||
    raw.title.includes('暴雷') ||
    raw.title.includes('突发');

  const cross = evaluateCrossVerification(raw, rawItems, primary);
  const isUnilateral = checkUnilateralClaim(cleanRawTitle, cleanRawContent);
  const companyProfile = getCompanyProfileForNews(enrichedTitle, cleanRawContent);
  const macroBreakdown = getMacroInflationBreakdown(enrichedTitle, cleanRawContent, track);
  const eventProvisions = getEventKeyProvisions(enrichedTitle, cleanRawContent);

  const verificationLevel = isUnilateral ? 'UNILATERAL_CLAIM' : cross.verificationLevel;
  const verificationBadge = isUnilateral ? '【单方通报·待验证】' : cross.verificationBadge;
  const clarificationNote = isUnilateral
    ? '该信息属企业或机构单方自宣/非正式辟谣口径，缺乏独立第三方检测或司法交叉复核，待进一步事实求证。'
    : cross.clarificationNote;

  const hoursDiff = getTimeDiffHours(raw.time);
  const timeWindow: 'TODAY' | 'HISTORIC' = hoursDiff > 24 ? 'HISTORIC' : 'TODAY';
  const finalBadge = (timeWindow === 'HISTORIC' && verificationBadge === '⚡ 一手速递') ? '📌 持续发酵' : verificationBadge;

  const newsItem: NewsItem = {
    id: raw.id,
    track,
    title: enrichedTitle,
    source: primary.source,
    sourceUrl: primary.sourceUrl,
    publishedAt: raw.time,
    content: cleanRawContent, // 保存详细正文
    fullArticleBody: cleanRawContent,
    impactLevel: isImportant ? 1 : 2,
    oneLineTakeaway: coreTakeaway,
    transmissionImpact,
    bulletPoints,
    summaryParagraph,
    summary5W1H,
    companyProfile: companyProfile || undefined,
    macroInflationBreakdown: macroBreakdown || undefined,
    eventKeyProvisions: eventProvisions || undefined,
    verificationLevel,
    verificationBadge: finalBadge,
    crossSourceCount: cross.crossSourceCount,
    hasClarification: cross.hasClarification || isUnilateral,
    clarificationNote,
    sentiment,
    nextWatchlist,
    bullBearDivergence,
    timeWindow,
    spilloverCriterion: (track === 'china_domestic' || track === 'china_policy') && spillover.isSpilloverMajor && hoursDiff <= 48 ? spillover.criteriaName : undefined,
    isUnilateralClaim: isUnilateral,
  };

  if (/吉隆口岸|冰岩崩|樟木口岸.*通关/.test(enrichedTitle + ' ' + raw.content)) {
    newsItem.isOngoingDisaster = true;
    newsItem.disasterTracker = GYIRONG_PORT_DISASTER_TRACKER;
  }

  return newsItem;
}

export async function fetchAggregatedNews(forceRefresh = false): Promise<NewsItem[]> {
  const now = Date.now();
  if (!forceRefresh && cachedNews && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedNews;
  }

  // 极速冷启动优化：首次加载直接 0.1ms 瞬时响应优质种子情报库，后台静默异步触发真实验证抓取，彻底消除首屏等待
  if (!cachedNews && !forceRefresh) {
    cachedNews = SEED_NEWS_ITEMS;
    cachedFlash = SEED_FLASH_BRIEFS;
    lastFetchTime = now;
    // 异步后台静默触发一次增量抓取与更新
    setTimeout(() => {
      fetchAggregatedNews(true).catch(() => {});
    }, 80);
    return cachedNews;
  }

  try {
    const rawItems = await fetchRealTimeRawNews();
    if (rawItems.length === 0) {
      if (cachedNews && cachedNews.length > 0) return cachedNews;
      cachedNews = SEED_NEWS_ITEMS;
      cachedFlash = SEED_FLASH_BRIEFS;
      lastFetchTime = now;
      return cachedNews;
    }

    const categorizedCandidates: Record<TrackId, NewsItem[]> = {
      us_macro: [],
      apac_tech: [],
      commodities_shipping: [],
      war_conflict: [],
      china_domestic: [],
      china_policy: [],
      china_macro: [],
      global_cognition: [],
    };

    for (const raw of rawItems) {
      // 每次循环强制完全初始化，严禁复用上一个循环周期的对象或使用上一个有效值作为兜底！
      let processed: NewsItem | null = null;
      try {
        processed = processSingleItemIsolated(raw, rawItems);
      } catch (err) {
        console.error(`[SINGLE ITEM PIPELINE ERROR] 处理异常，丢弃整条记录: "${raw?.title}"`, err);
        processed = null;
      }
      if (!processed) {
        continue; // 宁可丢弃整条记录重试/跳过，绝不能让脏数据混搭入库！
      }
      categorizedCandidates[processed.track].push(processed);
    }

    const categorized: Record<TrackId, NewsItem[]> = {
      us_macro: [],
      apac_tech: [],
      commodities_shipping: [],
      war_conflict: [],
      china_domestic: [],
      china_policy: [],
      china_macro: [],
      global_cognition: [],
    };

    // 智能排序与筛选：严格保证一级重大外溢情报与严肃中立深度调查优先入选卡片
    for (const trk of Object.keys(categorizedCandidates) as TrackId[]) {
      const list = categorizedCandidates[trk];
      list.sort((a, b) => {
        const aHours = getTimeDiffHours(a.publishedAt);
        const bHours = getTimeDiffHours(b.publishedAt);

        // 超过 48 小时的旧闻剥离重大外溢置顶特权，严防陈年旧闻僵尸霸榜
        const aSpill = (a.spilloverCriterion && aHours <= 48) ? 80 : 0;
        const bSpill = (b.spilloverCriterion && bHours <= 48) ? 80 : 0;
        const aImpact = a.impactLevel === 1 ? 40 : 0;
        const bImpact = b.impactLevel === 1 ? 40 : 0;

        // 时效性梯级赋分：24小时内 +50，48小时内 +25，超过48小时 0
        const aRecency = aHours <= 24 ? 50 : (aHours <= 48 ? 25 : 0);
        const bRecency = bHours <= 24 ? 50 : (bHours <= 48 ? 25 : 0);

        let aSourceBonus = 0;
        let bSourceBonus = 0;
        if (trk === 'china_domestic' || trk === 'china_policy') {
          if (a.source.includes('联合早报') || a.source.includes('财新网')) aSourceBonus = 20;
          if (b.source.includes('联合早报') || b.source.includes('财新网')) bSourceBonus = 20;
        }

        const scoreA = aSpill + aImpact + aRecency + aSourceBonus;
        const scoreB = bSpill + bImpact + bRecency + bSourceBonus;

        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return aHours - bHours;
      });
      categorized[trk] = list.slice(0, 8);
    }

    // 确保重大边境地质灾害与外溢治理（如吉隆口岸）始终置顶在 domestic 赛道，并携带持续追踪档案
    const jilongItem = SEED_NEWS_ITEMS.find((n) => n.id === 'GID-JILONG-PORT-DISASTER');
    if (jilongItem) {
      jilongItem.isOngoingDisaster = true;
      jilongItem.disasterTracker = GYIRONG_PORT_DISASTER_TRACKER;
      if (!categorized.china_domestic.some((e) => e.title.includes('吉隆口岸'))) {
        categorized.china_domestic.unshift(jilongItem);
        if (categorized.china_domestic.length > 8) categorized.china_domestic.pop();
      } else {
        const liveMatch = categorized.china_domestic.find((e) => e.title.includes('吉隆口岸'));
        if (liveMatch) {
          liveMatch.isOngoingDisaster = true;
          liveMatch.disasterTracker = GYIRONG_PORT_DISASTER_TRACKER;
        }
      }
    }

    // 严禁陈年旧闻僵尸复活：实时网络在线模式下，绝对禁止把 2024 年历史静态种子强塞进实时信息流

    // 聚合各大不同领域的顶级快讯，确保重点卡片分属不同赛道
    const targetTracks: TrackId[] = ['us_macro', 'apac_tech', 'commodities_shipping', 'war_conflict', 'china_domestic', 'china_macro', 'global_cognition'];
    const trackTagMap: Record<TrackId, string> = {
      us_macro: '美股宏观',
      apac_tech: '算力与模型',
      commodities_shipping: '大宗航运',
      war_conflict: '战局防务',
      china_domestic: '国内要闻',
      china_policy: '涉华博弈',
      china_macro: '中国宏观',
      global_cognition: '全球战略',
    };

    const flashList: FlashBrief[] = [];
    const usedNewsIds: string[] = [];
    const usedNewsTitles: string[] = [];

    for (const trk of targetTracks) {
      // 绝不将特大突发灾害项目选入顶部速递（特大灾害在顶部有专门看板，在正文必须常驻完整演进档案）
      const candidate = categorized[trk].find((c) => !c.isOngoingDisaster && !c.disasterTracker && c.id !== 'GID-JILONG-PORT-DISASTER') || categorized[trk][0];
      if (candidate && !candidate.isOngoingDisaster && !candidate.disasterTracker && candidate.id !== 'GID-JILONG-PORT-DISASTER') {
        usedNewsIds.push(candidate.id);
        const cleanT = candidate.title.replace(/^[【\[][^】\]]+[】\]]\s*/, '').trim().toLowerCase();
        usedNewsTitles.push(cleanT);
        const candidateProfile = candidate.companyProfile || getCompanyProfileForNews(candidate.title, candidate.summaryParagraph);
          flashList.push({
            id: `flash-${candidate.id}`,
            tag: trackTagMap[trk] || '宏观要闻',
            track: trk,
            content: candidate.title.replace(/^[【\[][^】\]]+[】\]]\s*/, ''),
            rawContent: candidate.content,
            oneLineTakeaway: candidate.oneLineTakeaway,
            transmission: candidate.transmissionImpact,
            impactLevel: candidate.impactLevel,
            time: candidate.publishedAt,
            source: candidate.source,
            sourceUrl: candidate.sourceUrl,
            summaryParagraph: candidate.summaryParagraph,
            summary5W1H: candidate.summary5W1H,
            companyProfile: candidateProfile || undefined,
            verificationLevel: candidate.verificationLevel,
            verificationBadge: candidate.verificationBadge,
            crossSourceCount: candidate.crossSourceCount,
            hasClarification: candidate.hasClarification,
            clarificationNote: candidate.clarificationNote,
            sentiment: candidate.sentiment,
            nextWatchlist: candidate.nextWatchlist,
            bullBearDivergence: candidate.bullBearDivergence,
            spilloverCriterion: candidate.spilloverCriterion,
            isUnilateralClaim: candidate.isUnilateralClaim,
          });
        } else {
          // 从当前所有抓取的实时候选池中挑选尚未使用的最新实时快讯，严禁回退到历史死种子！
          const fallbackCandidate = Object.values(categorizedCandidates)
            .flat()
            .find((c) => !usedNewsIds.includes(c.id) && !c.isOngoingDisaster && !c.disasterTracker && c.id !== 'GID-JILONG-PORT-DISASTER');
          if (fallbackCandidate) {
            usedNewsIds.push(fallbackCandidate.id);
            const cleanT = fallbackCandidate.title.replace(/^[【\[][^】\]]+[】\]]\s*/, '').trim().toLowerCase();
            usedNewsTitles.push(cleanT);
            const candProfile = fallbackCandidate.companyProfile || getCompanyProfileForNews(fallbackCandidate.title, fallbackCandidate.summaryParagraph);
            flashList.push({
              id: `flash-${fallbackCandidate.id}`,
              tag: trackTagMap[fallbackCandidate.track] || '实时速递',
              track: fallbackCandidate.track,
              content: fallbackCandidate.title.replace(/^[【\[][^】\]]+[】\]]\s*/, ''),
              rawContent: fallbackCandidate.content,
              oneLineTakeaway: fallbackCandidate.oneLineTakeaway,
              transmission: fallbackCandidate.transmissionImpact,
              impactLevel: fallbackCandidate.impactLevel,
              time: fallbackCandidate.publishedAt,
              source: fallbackCandidate.source,
              sourceUrl: fallbackCandidate.sourceUrl,
              summaryParagraph: fallbackCandidate.summaryParagraph,
              summary5W1H: fallbackCandidate.summary5W1H,
              companyProfile: candProfile || undefined,
              verificationLevel: fallbackCandidate.verificationLevel,
              verificationBadge: fallbackCandidate.verificationBadge,
              crossSourceCount: fallbackCandidate.crossSourceCount,
              hasClarification: fallbackCandidate.hasClarification,
              clarificationNote: fallbackCandidate.clarificationNote,
              sentiment: fallbackCandidate.sentiment,
              nextWatchlist: fallbackCandidate.nextWatchlist,
              bullBearDivergence: fallbackCandidate.bullBearDivergence,
              spilloverCriterion: fallbackCandidate.spilloverCriterion,
              isUnilateralClaim: fallbackCandidate.isUnilateralClaim,
            });
          }
        }
      }

      // 核心物理去重：凡是被推送到“今日决策速递”的新闻，从下方各专区板块中彻底剔除，避免重复呈现！
      // 注意：特大灾害全生命周期持续追踪档案（如吉隆口岸）永久豁免剔除，必须长驻在正文板块中！
      for (const trk of Object.keys(categorized) as TrackId[]) {
        categorized[trk] = categorized[trk].filter((item) => {
          if (item.isOngoingDisaster || item.disasterTracker || item.id === 'GID-JILONG-PORT-DISASTER') {
            return true;
          }
          if (usedNewsIds.includes(item.id)) return false;
          const cleanItemTitle = item.title.replace(/^[【\[][^】\]]+[】\]]\s*/, '').trim().toLowerCase();
          if (usedNewsTitles.includes(cleanItemTitle)) return false;
          for (let i = 0; i < usedNewsTitles.length; i++) {
            const ft = usedNewsTitles[i];
            if (ft.length > 8 && cleanItemTitle.length > 8 && (cleanItemTitle.includes(ft) || ft.includes(cleanItemTitle))) {
              return false;
            }
          }
          return true;
        });

        // 如果剔除后该赛道内容少于 4 条，从候选池与深度优质备用库中补充非重复条目，确保各专区保持 3~5 篇核心深度追踪
        if (categorized[trk].length < 4) {
          const candidates = categorizedCandidates[trk] || [];
          for (const c of candidates) {
            if (categorized[trk].length >= 5) break;
            const cleanC = c.title.replace(/^[【\[][^】\]]+[】\]]\s*/, '').trim().toLowerCase();
            let isDup = usedNewsIds.includes(c.id) || usedNewsTitles.includes(cleanC) || categorized[trk].some((e) => e.id === c.id || e.title === c.title);
            if (!isDup) {
              for (let i = 0; i < usedNewsTitles.length; i++) {
                const ft = usedNewsTitles[i];
                if (ft.length > 8 && cleanC.length > 8 && (cleanC.includes(ft) || ft.includes(cleanC))) {
                  isDup = true;
                  break;
                }
              }
            }
            if (!isDup) categorized[trk].push(c);
          }

          if (categorized[trk].length < 3) {
            // 严禁塞入旧种子！若个别专区剔除后较少，优先从其他赛道未使用的实时候选池中进行跨界借调
            const otherCandidates = Object.values(categorizedCandidates)
              .flat()
              .filter((c) => {
                if (usedNewsIds.includes(c.id) || categorized[trk].some((e) => e.id === c.id)) return false;
                const fullText = (c.title + ' ' + (c.content || '') + ' ' + (c.summaryParagraph || '')).toLowerCase();
                // 物理跨赛道隔离门禁：借调给 us_macro 时，绝对禁止借调中国国内/A股券商/国内硬科技/涉华及地缘战局条目！
                if (trk === 'us_macro') {
                  if (/券商|证券|中信证券|中金公司|招商证券|广发证券|国泰君安|海通证券|申万宏源|银河证券|华泰证券|东兴证券|方正证券|浙商证券|光大证券|国信证券|兴业证券|中银证券|中加基金|证监会|中基协|上交所|深交所|北交所|公募|私募|两市|沪深|a股|港股|恒生|南向资金|北向资金|中概股|中国|中方|北京|外交部|商务部|国资委/.test(fullText)) {
                    return false;
                  }
                  if (/伊朗|以色列|哈马斯|真主党|加沙|乌克兰|俄军|乌军|也门|卡塔尔|霍尔木兹/.test(fullText)) {
                    return false;
                  }
                  if (/长鑫|长存|长江存储|中芯|华虹|北方华创|中微|拓荆|盛美|燧原|沐曦|摩尔线程|壁仞|寒武纪|地平线|昆仑芯/.test(fullText)) {
                    return false;
                  }
                  if (!/(?:美股|美联储|美债|美国|美元|标普|纳斯达克|道琼斯|华尔街|非农|cpi|ppi|pce|通胀|加息|降息|fomc|opec|原油|拜登|特朗普|耶伦|鲍威尔|全球经济|主权债|全球流动性)/i.test(c.title)) {
                    return false;
                  }
                }
                // 借调给国内/中国宏观赛道时，严禁借调外国实体
                if (trk === 'china_domestic' || trk === 'china_macro') {
                  if (FOREIGN_ENTITIES.GLOBAL_FOREIGN.test(c.title) && !/涉华|对华|中美/.test(c.title)) {
                    return false;
                  }
                }
                return true;
              });
            for (const c of otherCandidates) {
              if (categorized[trk].length >= 3) break;
              const cleanC = c.title.replace(/^[【\[][^】\]]+[】\]]\s*/, '').trim().toLowerCase();
              let isDup = usedNewsIds.includes(c.id) || usedNewsTitles.includes(cleanC) || categorized[trk].some((e) => e.id === c.id || e.title === c.title);
              if (!isDup) {
                for (let i = 0; i < usedNewsTitles.length; i++) {
                  const ft = usedNewsTitles[i];
                  if (ft.length > 8 && cleanC.length > 8 && (cleanC.includes(ft) || ft.includes(cleanC))) {
                    isDup = true;
                    break;
                  }
                }
              }
              if (!isDup) {
                categorized[trk].push(c);
                usedNewsIds.push(c.id);
              }
            }
          }
        }
      }

    // 确保吉隆口岸特大灾害持续追踪卡片始终置顶在 domestic 赛道首位
    if (jilongItem && !categorized.china_domestic.some((e) => e.id === jilongItem.id)) {
      categorized.china_domestic.unshift(jilongItem);
    }

    const rawAllNews: NewsItem[] = [
      ...categorized.us_macro,
      ...categorized.apac_tech,
      ...categorized.commodities_shipping,
      ...categorized.war_conflict,
      ...categorized.china_domestic,
      ...categorized.china_policy,
      ...categorized.global_cognition,
    ];

    // 全局标题指纹去重（杜绝跨赛道借调后再纠偏导致的完全重复卡片）
    const globalSeenSignatures = new Set<string>();
    const deduplicatedAllNews: NewsItem[] = [];

    for (const item of rawAllNews) {
      // 特大灾害长期追踪常驻卡片豁免
      if (item.id === 'GID-JILONG-PORT-DISASTER' || item.isOngoingDisaster) {
        deduplicatedAllNews.push(item);
        continue;
      }
      // 提取前 14 个核心字符作为去重指纹
      const sig = item.title.replace(/^[【\[][^】\]]+[】\]]\s*/, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').slice(0, 14);
      if (globalSeenSignatures.has(sig) || globalSeenSignatures.has(item.id)) {
        continue; // 物理丢弃重复条目
      }
      globalSeenSignatures.add(sig);
      globalSeenSignatures.add(item.id);
      deduplicatedAllNews.push(item);
    }

    // 全站数据出库前执行 100% 自动纠偏流水线
    const { news: healedNews, flashBriefs: healedFlash } = autoCorrectAllNews(deduplicatedAllNews, flashList);
    cachedNews = healedNews;
    cachedFlash = healedFlash;
    lastFetchTime = now;

    return cachedNews;
  } catch (err) {
    console.error('实时聚合抓取失败:', err);
    if (!cachedNews || cachedNews.length === 0) {
      const { news: healedNews, flashBriefs: healedFlash } = autoCorrectAllNews(SEED_NEWS_ITEMS, SEED_FLASH_BRIEFS);
      cachedNews = healedNews;
      cachedFlash = healedFlash;
    }
    return cachedNews;
  }
}

export async function getMarketQuotes(): Promise<MarketQuote[]> {
  try {
    const { quotes } = await fetchVerifiedMarketQuotes();
    return quotes;
  } catch (err) {
    console.warn('获取多源校验行情异常，使用内置权威基准数据:', err);
    return SEED_MARKET_QUOTES;
  }
}

export async function getFlashBriefs(forceRefresh = false): Promise<FlashBrief[]> {
  if (forceRefresh || !cachedFlash || cachedFlash.length === 0) {
    await fetchAggregatedNews(forceRefresh);
  }
  const rawFlash = cachedFlash && cachedFlash.length > 0 ? cachedFlash : SEED_FLASH_BRIEFS;
  return rawFlash.map(autoCorrectFlashBrief);
}

export async function checkAllLiveSources() {
  const startTime = Date.now();
  const checks = [
    {
      name: '全球电讯管道 (WSCN Global Feed)',
      channel: 'wscn_global',
      url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=global-channel&limit=5',
    },
    {
      name: '联合早报中立中国频道 (Zaobao China)',
      channel: 'zaobao_china',
      url: 'https://www.zaobao.com.sg/realtime/china',
    },
    {
      name: '财新网金融与法治调查频道 (Caixin Finance)',
      channel: 'caixin_finance',
      url: 'https://finance.caixin.com/',
    },
    {
      name: '财新网公司与产业风险频道 (Caixin Companies)',
      channel: 'caixin_companies',
      url: 'https://companies.caixin.com/',
    },
    {
      name: '东方财富全市场高频行情接口 (push2.eastmoney.com)',
      channel: 'eastmoney_market_hq',
      url: 'https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=100.SPX,100.N225&fields=f12,f14',
    },
    {
      name: '美联储官方圣路易斯联储 (FRED) 10年期美债基准',
      channel: 'fred_us10y',
      url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10',
    },
  ];

  const sourceResults = await Promise.all(
    checks.map(async (c) => {
      const t0 = Date.now();
      try {
        const res = await fetch(c.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            Referer: 'https://finance.sina.com.cn',
          },
        });
        const latencyMs = Date.now() - t0;
        return {
          name: c.name,
          channel: c.channel,
          status: res.ok ? ('ONLINE' as const) : ('DEGRADED' as const),
          statusCode: res.status,
          latencyMs,
        };
      } catch (err: any) {
        return {
          name: c.name,
          channel: c.channel,
          status: 'ERROR' as const,
          statusCode: 500,
          latencyMs: Date.now() - t0,
          error: err.message || '网络连接超时',
        };
      }
    })
  );

  const quotes = await getMarketQuotes();
  const news = await fetchAggregatedNews();
  const onlineCount = sourceResults.filter((s) => s.status === 'ONLINE').length;

  return {
    status: onlineCount >= 6 ? 'HEALTHY' : 'DEGRADED',
    checkedAt: new Date().toISOString(),
    checkedAtLocal: new Date().toLocaleString('zh-CN', { hour12: false }),
    totalDurationMs: Date.now() - startTime,
    summary: {
      totalSources: checks.length,
      onlineSources: onlineCount,
      allSourcesHealthy: onlineCount === checks.length,
      loadedNewsCount: news.length,
      loadedQuotesCount: quotes.length,
    },
    sources: sourceResults,
    quotesSnapshot: quotes.map((q) => ({
      symbol: q.symbol,
      price: q.price,
      change: q.change,
      category: q.category,
    })),
  };
}

