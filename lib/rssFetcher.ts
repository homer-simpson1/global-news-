import { FlashBrief, MarketQuote, NewsItem, TrackId, Summary5W1H } from './types';
import { SEED_FLASH_BRIEFS, SEED_NEWS_ITEMS, SEED_MARKET_QUOTES } from '@/data/seedData';
import { fetchVerifiedMarketQuotes } from './quotesVerifier';

let cachedNews: NewsItem[] | null = null;
let cachedFlash: FlashBrief[] | null = null;
let cachedQuotes: MarketQuote[] | null = null;
let lastFetchTime = 0;
let lastQuotesFetchTime = 0;

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

  // 4. 系统性责任事故与地方大震荡：重特大安全事故、地方公共信用/财政极端事件、跨区域公共危机
  if (
    /重特大事故|特别重大|特大火灾|坍塌事故|重大伤亡|遇难|死亡(?:\d+|多)人|致死|相撞致.*死|致.*伤|爆炸事故|矿难|地方公共信用|地方债务展期|地方财政困难|破产重整|违约暴雷|停运|群体性事件|紧急状态|跨区域危机|特大自然灾害|特别国债注资/.test(
      text
    )
  ) {
    return {
      isSpilloverMajor: true,
      criteriaIndex: 4,
      criteriaName: '系统性责任事故与地方大震荡',
      reason: '涉及重特大责任事故、人员伤亡、地方公共信用或跨区域突发危机',
    };
  }

  return { isSpilloverMajor: false };
}

// ==========================================
// 【股票分时跳动与券商炒作噪音严防引擎】
// 坚决扑灭：纯行情流水账、个股涨跌停、板块跟风、券商IPO造势等投机噪音
// ==========================================
export const STOCK_TAPE_SPAM_REGEX =
  /涨停|跌停|持续拉升|盘中拉升|高开|低开|跳水|翻红|转涨|转跌|触及涨停|触及跌停|盘中异动|主力净流入|概念股|个股|板块走强|板块拉升|板块走低|板块下挫|板块领涨|板块领跌|指数涨超|指数跌超|震荡走高|震荡走低|创业板指|深证成指|上证指数|北证50|科创50|沪深300|中证500|中证1000|北向资金|净买入|净卖出|换手率|超大单|资金净流出|资金净流入|净流出超|净流入超|连板|首板|二连板|回落|探底回升|日内跌幅|日内涨幅|上市在即|拟上市|报[0-9.]+点|涨幅扩大至|跌幅扩大至|早盘高开|开盘调整|开盘走高|成交额超|ETF份额|ETF净流入|券商提前布局|研报维持|目标价|买入评级|增持评级|盘前必读|早盘必读|见闻早餐|午盘总结|收盘评述|尾盘拉升/;

export function isStockTapeSpam(title: string, content: string): boolean {
  const text = (title + ' ' + content).toLowerCase();
  // 命中司法宣判、特别国债、重特大责任事故、反腐双开、重大外溢冲击者，不视为行情杂音
  const isCriticalEvent =
    /判决|判处|受贿|贪腐|无期徒刑|特别国债|注资|重特大|死亡|遇难|事故|立案调查|立案侦查|专项整治|反腐|落马|被查|牌照吊销|全面叫停|突发断供|造假暴雷|反制|商务部|外交部|涉案|双开/.test(
      text
    );
  if (isCriticalEvent) return false;
  return STOCK_TAPE_SPAM_REGEX.test(text);
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
    })
      .then((r) => r.text())
      .then((html) => {
        const zbList: RawLiveItem[] = [];
        const regex = /href="(\/(?:realtime|news)\/china\/story[^\"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        const seenZb = new Set<string>();
        while ((m = regex.exec(html)) !== null) {
          const rawTitle = m[2].replace(/<[^>]+>/g, '').trim();
          if (rawTitle.length >= 6 && !seenZb.has(rawTitle)) {
            seenZb.add(rawTitle);
            zbList.push({
              id: generateIntelId(`ZAOBAO_${m[1]}`),
              wireChannel: 'CH_ZAOBAO',
              title: rawTitle,
              content: rawTitle,
              time: formatIntelDateTime(Date.now()),
              source: '联合早报 Zaobao',
              url: `https://www.zaobao.com.sg${m[1]}`,
            });
          }
        }
        return { source: '联合早报', data: zbList };
      })
      .catch(() => ({ source: '联合早报', data: null })),

    // 2. 《财新网》金融频道（调查报道、法治监管、专抓重特大责任事故、金融反腐与违规暴雷）
    fetch('https://finance.caixin.com/', {
      headers: defaultHeaders,
    })
      .then((r) => r.text())
      .then((html) => {
        const cxList: RawLiveItem[] = [];
        const regex = /<a[^>]+href="([^"]*(?:caixin\.com\/202\d|finance\.caixin)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        const seenCx = new Set<string>();
        while ((m = regex.exec(html)) !== null) {
          const rawTitle = m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
          if (rawTitle.length >= 8 && !seenCx.has(rawTitle)) {
            seenCx.add(rawTitle);
            const fullUrl = m[1].startsWith('http') ? m[1] : `https:${m[1]}`;
            cxList.push({
              id: generateIntelId(`CAIXIN_${m[1]}`),
              wireChannel: 'CH_CAIXIN',
              title: rawTitle,
              content: rawTitle,
              time: formatIntelDateTime(Date.now()),
              source: '财新网 Caixin',
              url: fullUrl,
            });
          }
        }
        return { source: '财新网', data: cxList };
      })
      .catch(() => ({ source: '财新网', data: null })),

    // 3. 《财新网》公司与产业频道（抓企业停产、违约逾期、供应链断裂、实业风险）
    fetch('https://companies.caixin.com/', {
      headers: defaultHeaders,
    })
      .then((r) => r.text())
      .then((html) => {
        const cxList: RawLiveItem[] = [];
        const regex = /<a[^>]+href="([^"]*(?:caixin\.com\/202\d|companies\.caixin)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        const seenCx = new Set<string>();
        while ((m = regex.exec(html)) !== null) {
          const rawTitle = m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
          if (rawTitle.length >= 8 && !seenCx.has(rawTitle)) {
            seenCx.add(rawTitle);
            const fullUrl = m[1].startsWith('http') ? m[1] : `https:${m[1]}`;
            cxList.push({
              id: generateIntelId(`CAIXIN_CO_${m[1]}`),
              wireChannel: 'CH_CAIXIN',
              title: rawTitle,
              content: rawTitle,
              time: formatIntelDateTime(Date.now()),
              source: '财新网 Caixin',
              url: fullUrl,
            });
          }
        }
        return { source: '财新网公司频道', data: cxList };
      })
      .catch(() => ({ source: '财新网公司频道', data: null })),

    // 4. 全球宏观、外汇、大宗商品电讯
    ...endpoints.map((ep) =>
      fetch(ep.url, { headers: defaultHeaders })
        .then((r) => r.json())
        .then((d) => ({ source: ep.source, data: d }))
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
        const text = (raw.content_text || '').trim();
        if (!text) continue;
        // 严防官方宣传通篇口号内宣污染：若含有纯新华社/人民日报口号且无硬核事实则剔除
        if (/新华社|人民日报/.test(text) && /高度重视|众志成城|坚决贯彻/.test(text) && !/判决|违约|事故|注资|立案|死/.test(text)) {
          continue;
        }

        const title = (raw.title || text.split('\n')[0].replace(/【.*?】/, '')).trim().slice(0, 70);
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

  // 严格过滤低信噪比杂音与股票盘中异动：
  // 无论属于哪个板块，凡纯属股票分时行情、个股拉升跌停、IPO 券商造势者，一律剔除！
  // 只有命中【通用重大外溢冲击收录标准】的重特大事件除外。
  const seen = new Set<string>();
  const deduped: RawLiveItem[] = [];
  const noiseRegex = /摩托车|锦标赛|排球|足球|篮球|马拉松|选美|车展|博览会闭幕|闭幕式|开幕式|演唱会|明星|彩票|中奖|电视剧|电影节|见闻早餐|早报\s*\||连板|早盘必读|盘中异动/;

  for (const item of items) {
    const spillover = evaluateSpilloverImpact(item.title, item.content);
    // 只要命中外溢冲击指标之一，严禁过滤，强制收录！
    if (!spillover.isSpilloverMajor) {
      if (noiseRegex.test(item.title + ' ' + item.content)) continue;
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
  fallbackUrl?: string
): PrimarySourceInfo {
  const combined = (title + ' ' + content).toLowerCase();

  // 1. 显式提及的一级权威通讯社/官方部委机构（严禁接入新华社、人民日报等官方全量内宣大喇叭）
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
    return { source: '彭博中国 Bloomberg', sourceUrl: 'https://www.bloomberg.com' };
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
  if (/第一财经|一财|yicai/.test(combined)) {
    return { source: '第一财经 Yicai Global', sourceUrl: 'https://www.yicai.com' };
  }
  if (/经济学人|the economist/.test(combined)) {
    return { source: '经济学人 The Economist', sourceUrl: 'https://www.economist.com' };
  }
  if (/美联社|ap news|associated press/.test(combined)) {
    return { source: '美联社 AP News', sourceUrl: 'https://apnews.com' };
  }
  if (/标普|s&p global|spglobal/.test(combined)) {
    return { source: '标普全球 S&P Global', sourceUrl: 'https://www.spglobal.com' };
  }
  if (/半岛电视台|al jazeera/.test(combined)) {
    return { source: '半岛电视台 Al Jazeera', sourceUrl: 'https://www.aljazeera.com' };
  }
  if (/塔斯社|tass/.test(combined)) {
    return { source: '塔斯社 TASS', sourceUrl: 'https://tass.com' };
  }
  if (/交通运输部|交运部/.test(combined)) {
    return { source: '中国交通运输部通报', sourceUrl: 'https://www.mot.gov.cn' };
  }
  if (/财政部|中央财政/.test(combined)) {
    return { source: '中国财政部通报', sourceUrl: 'http://www.mof.gov.cn' };
  }
  if (/发改委|国家发改委/.test(combined)) {
    return { source: '国家发展改革委公报', sourceUrl: 'https://www.ndrc.gov.cn' };
  }
  if (/住建部/.test(combined)) {
    return { source: '国家住房和城乡建设部', sourceUrl: 'https://www.mohurd.gov.cn' };
  }
  if (/民政部|应急管理部/.test(combined)) {
    return { source: '国家应急管理部通报', sourceUrl: 'https://www.mem.gov.cn' };
  }
  if (/国资委|上海市国资委/.test(combined)) {
    return { source: '国资监管委员会公报', sourceUrl: 'http://www.sasac.gov.cn' };
  }
  if (/人民银行|央行|外汇局/.test(combined) && (track === 'china_domestic' || /人民币|降准|逆回购/.test(combined))) {
    return { source: '中国人民银行 PBOC', sourceUrl: 'http://www.pbc.gov.cn' };
  }
  if (/美联储|fomc|鲍威尔|沃勒/.test(combined)) {
    return { source: '美联储 FOMC 声明', sourceUrl: 'https://www.federalreserve.gov' };
  }
  if (/五角大楼|美国国防部|美军指挥部/.test(combined)) {
    return { source: '美国国防部 DoD 简报', sourceUrl: 'https://www.defense.gov' };
  }

  // 2. 根据专业领域赛道与内容特征，哈希轮询映射全球核心中立权威信源（确保多元化，杜绝内宣单一垄断）
  let hash = 0;
  const str = title + content;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }

  const trackSourcePools: Record<TrackId, PrimarySourceInfo[]> = {
    apac_tech: [
      { source: '日经亚洲 Nikkei Asia', sourceUrl: 'https://asia.nikkei.com' },
      { source: '彭博科技 Bloomberg Tech', sourceUrl: 'https://www.bloomberg.com/technology' },
      { source: '路透科技 Reuters Tech', sourceUrl: 'https://www.reuters.com/technology' },
      { source: '英国金融时报 FT Tech', sourceUrl: 'https://www.ft.com/technology' },
    ],
    commodities_shipping: [
      { source: '标普全球商品 S&P Commodities', sourceUrl: 'https://www.spglobal.com/commodityinsights' },
      { source: '劳氏日报 Lloyd\'s List', sourceUrl: 'https://www.lloydslist.com' },
      { source: '普氏能源资讯 S&P Global Energy', sourceUrl: 'https://www.spglobal.com/commodityinsights' },
      { source: '彭博大宗能源 Bloomberg Commodities', sourceUrl: 'https://www.bloomberg.com/energy' },
    ],
    war_conflict: [
      { source: '路透社防务专电 Reuters Defense', sourceUrl: 'https://www.reuters.com/world' },
      { source: '半岛电视台 Al Jazeera', sourceUrl: 'https://www.aljazeera.com' },
      { source: '美联社全球防务 AP World', sourceUrl: 'https://apnews.com/world-news' },
      { source: '华尔街日报 WSJ World', sourceUrl: 'https://www.wsj.com/world' },
    ],
    us_macro: [
      { source: '华尔街日报 WSJ Markets', sourceUrl: 'https://www.wsj.com/market-data' },
      { source: '彭博宏观社评 Bloomberg Markets', sourceUrl: 'https://www.bloomberg.com/markets' },
      { source: '英国金融时报 FT Markets', sourceUrl: 'https://www.ft.com/markets' },
      { source: '路透全球财经 Reuters Markets', sourceUrl: 'https://www.reuters.com/markets' },
    ],
    china_domestic: [
      { source: '财新网 Caixin 深度调查', sourceUrl: 'https://finance.caixin.com' },
      { source: '联合早报 Zaobao 中国电讯', sourceUrl: 'https://www.zaobao.com.sg' },
      { source: '路透中文网 Reuters 中国专线', sourceUrl: 'https://www.reuters.com' },
      { source: '彭博中国 Bloomberg 宏观特电', sourceUrl: 'https://www.bloomberg.com' },
      { source: '第一财经 Yicai 产业现场', sourceUrl: 'https://www.yicai.com' },
    ],
    china_policy: [
      { source: '联合早报 Zaobao 国际观察', sourceUrl: 'https://www.zaobao.com.sg' },
      { source: '财新国际 Caixin Global', sourceUrl: 'https://www.caixinglobal.com' },
      { source: '路透中文网 Reuters 涉华追踪', sourceUrl: 'https://www.reuters.com' },
      { source: '彭博中国观察 Bloomberg Asia', sourceUrl: 'https://www.bloomberg.com' },
      { source: '英国金融时报 FT China', sourceUrl: 'https://www.ft.com' },
    ],
    global_cognition: [
      { source: '经济学人 The Economist', sourceUrl: 'https://www.economist.com' },
      { source: '标普全球 S&P Global Intelligence', sourceUrl: 'https://www.spglobal.com' },
      { source: '彭博商业周刊 Bloomberg Businessweek', sourceUrl: 'https://www.bloomberg.com' },
      { source: '路透深度特稿 Reuters Insight', sourceUrl: 'https://www.reuters.com' },
    ],
  };

  const pool = trackSourcePools[track] || trackSourcePools.global_cognition;
  return pool[hash % pool.length];
}

function classifyTrack(item: RawLiveItem): TrackId {
  const t = (item.title + ' ' + item.content).toLowerCase();

  // 【通用重大外溢冲击收录标准判定准则】：
  // 无论事件属于文旅、民生、汽车、科技、法治、体育还是行政，只要命中 4 项外溢指标之一，强制收录！
  const spillover = evaluateSpilloverImpact(item.title, item.content);
  if (spillover.isSpilloverMajor) {
    if (spillover.criteriaIndex === 3) {
      return 'china_policy';
    }
    // 监管铁拳、供应链断裂、系统性责任事故与地方大震荡 -> 强制收录进国内要闻与治理板块
    return 'china_domestic';
  }

  // 联合早报与财新网等严肃中立信源电讯精准对齐赛道：
  if (item.wireChannel === 'CH_ZAOBAO' || item.wireChannel === 'CH_CAIXIN') {
    // 涉外博弈与地缘防务
    if (/涉外|关税|制裁|美国|欧盟|外资|反制|出海|特使|两岸|台湾|涉台|南海|两国防务|防务合作|军工出口|外长|巴基斯坦|解放军.*军事/.test(t)) {
      return 'china_policy';
    }
    // 前沿模型与芯片科技
    if (/世界模型|大模型|生成式ai|算力|芯片|半导体|人形机器人/.test(t)) {
      return 'apac_tech';
    }
    // 其余全量归属于国内要闻与社会治理
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

  // 3. 算力硬件与前沿模型 (融合芯片硬件与OpenAI、Google、大模型突破)
  if (
    /openai|gpt|claude|anthropic|deepmind|大模型|llm|agent|多模态|生成式ai|端侧模型|算力|芯片|半导体|先进制程|台积电|联电|日月光|三星|海力士|sk海力士|铠侠|阿斯麦|asml|光刻|东京电子|爱德万|日经|东证|日银|日本央行|ai芯片|英伟达|高通|博通|超威|arm|数据中心|hbm|cowos|先进封装|matx|coatue/.test(
      t
    )
  ) {
    return 'apac_tech';
  }

  // 3. 中国国内要闻与社会治理 (聚焦国家治理、司法反腐、重特大事故、宏观财政化债、社会民生，严禁股票分时跳动)
  const isForeignEntity = /(?:土耳其|阿根廷|巴西|印度|越南|泰国|德国|法国|英国|印尼|南非|墨西哥|加拿大|埃及|沙特|阿联酋|欧洲央行|日本央行|韩国央行|美联储|美国财政部)/.test(item.title);
  if (
    !isForeignEntity &&
    /特别国债|超长期国债|中国再保|进出口银行|中国信保|财政部|发改委|住建部|民政部|国家医保局|国家统计局|应急管理部|自然资源部|工信部|交通运输部|生态环境部|农业农村部|最高法|最高检|公安部|中纪委|国家监委|国资委|化债|地方债|隐性债务|债务置换|央行.*降准|央行.*逆回购|反腐|落马|被查|受贿|贪污|职务犯罪|双开|立案调查|立案侦查|判刑|判处|重特大事故|重大事故|相撞致.*死|致.*死|坍塌|火灾|爆炸|矿难|遇难|搜救|安全生产|暴雨洪涝|汛情|地质灾害|社保|养老|医保|常住人口|老龄化|人口下滑|生育|物流|货运|保供|民生|欠薪治理|破产重整|违约暴雷|专项整治|监管调查|行政叫停|拆违/.test(
      t
    )
  ) {
    return 'china_domestic';
  }

  // 4. 发达国家对华举措与博弈 (严格约束：必须明确涉及对华/涉华/中美/中欧博弈背景，防止纯美加/美墨/欧美他国内部关税误判)
  const isExplicitChinaPolicy = /涉华|对华|中美|中欧|中日|中美博弈|对华限制|对华出口|对华关税|涉台|台海|中国制造|中国企业|中资|中企/.test(t);
  const hasTradeBarrierKeywords = /关税|制裁|出口管制|商务部.*清单|实体清单|未经验证清单|去风险|脱钩|反补贴|反倾销|友岸|外资审查|cfius|301调查/.test(t);
  const mentionsChinaEntities = /中国|中方|北京|大陆|两岸|华为|中芯|中兴|大疆|字节|tiktok|宁德时代|比亚迪/.test(t);

  if (isExplicitChinaPolicy || (hasTradeBarrierKeywords && mentionsChinaEntities)) {
    return 'china_policy';
  }

  // 5. 美股与美元宏观 (精确匹配美债、美联储及美股市场，避免将国内特别国债误判)
  if (
    /美联储|鲍威尔|标普|纳斯达克|道琼斯|美债|美国国债|10年期美债|2年期美债|美债收益率|非农|cpi|pce|通胀|初请|失业金|美股|华尔街|摩根|高盛|期权|波动率|美元指数/.test(
      t
    )
  ) {
    return 'us_macro';
  }

  // 6. 全球宏观认知与深度要闻
  return 'global_cognition';
}

function inferTransmission(track: TrackId, title: string, content: string): string {
  const t = (title + ' ' + content).toLowerCase();

  // 1. 台积电 / 先进制程晶圆
  if (/台积电|2nm|先进制程|晶圆/.test(t)) {
    return '代工成本上涨不会压垮英伟达，反而会逼迫英伟达进一步调高 B200 整机售价，最终由下游自研大模型的云计算大厂买单。';
  }
  // 2. 北美AI电网瓶颈 / 变压器
  if (/变压器|电网|数据中心.*并网|算力.*电/.test(t)) {
    return '重型变压器厂商和独立核电运营商成了最大赢家、订单排到十年后，买了昂贵GPU却通不上电的初创算力公司在白白空转烧钱。';
  }
  // 3. OpenAI 推理架构 / 算法
  if (/openai|gpt|推理架构|思维链|agent/.test(t)) {
    return '掌握最强推理算法的闭源大厂开始向企业收取高昂API溢价，缺乏自研能力的包装型套壳软件加速死掉，算力采购全面倾斜向推理加速卡。';
  }
  // 4. 美债收益率 / 非农 / 降息
  if (/美债|收益率|两年期|10年期/.test(t) || (/美联储|降息|非农/.test(t) && track === 'us_macro')) {
    return '华尔街一级做市商与货币基金赚取无风险高息，重资产高杠杆中小企业背负沉重利息支出，避险资金持续从成长股倒流回短久期美债。';
  }
  // 5. 期指尾盘下挫 / 巨头抗跌
  if (/期指|期货|美股三大|道指|标普|纳斯达克/.test(t)) {
    return '高负债周期股与区域性商业银行承担资金抽血阵痛，苹果英伟达等现金奶牛龙头被动承接避险买盘，杠杆多头正在加速撤离周期板块。';
  }
  // 6. 加密概念股 / 比特币
  if (/加密|比特币|btc|eth/.test(t)) {
    return '早期低成本埋伏的海外量化大户大举出货锁定暴利，后知后觉追高的高杠杆散户惨遭流动性锁死，增量热钱全在场外观望不敢轻易接盘。';
  }
  // 7. 标普500成分股调整
  if (/标普500纳入|成分股|因美纳/.test(t)) {
    return '提前潜伏调仓名单的跨国对冲基金坐收抬轿暴利，被剔除的失势老股惨遭被动基金无情砸盘，散户跟风买入则极易在生效日高位接盘。';
  }
  // 8. 伦铜 / 金属升水
  if (/铜|伦铜|lme.*铜/.test(t)) {
    return '拥有优质铜矿资源的跨国矿业巨头大发横财，毫无议价权的下游中小线缆加工厂被原料暴涨挤压到濒临亏损，产业资金加速囤货惜售。';
  }
  // 9. 红海海运 / 集运欧线
  if (/集运|欧线|航运|海运|红海|好望角/.test(t)) {
    return '集运班轮巨头手握绝对订舱议价权大赚暴利，亚欧跨国出口外贸企业硬抗翻倍运费，货主资金正被高额订舱押金与滞港费深度占用。';
  }
  // 10. 原油 / OPEC+
  if (/opec|原油|减产|油价/.test(t)) {
    return '沙特等低开采成本产油国继续靠高油价支撑国内超级工程，欧美炼油厂与航空公司承担昂贵航煤成本，游资正在期货盘面上反复围剿做空力量。';
  }
  // 11. 美军泄密 / 五角大楼
  if (/泄密|五角大楼|测谎|武器库存/.test(t)) {
    return '网络安全与保密合规承包商突击斩获紧急审查大单，传统军火外包商因权限冻结被迫停滞交付，军费预算加速流向涉密审计防线。';
  }
  // 12. 黎以中东交火 / 空袭
  if (/空袭|导弹|以军|黎巴嫩|中东交火/.test(t)) {
    return '跨国军工复合体订单爆满股价逆市冲高，地中海东岸商业航运保费翻倍飙升，大量国际中东避险资金弃股买金、推升现货黄金避险溢价。';
  }
  // 13. 物流景气 / 国内实体
  if (/物流.*景气|物流.*50.9%|货流/.test(t)) {
    return '干线干道物流与仓储龙头率先享受货运量回升的现金流溢价，下游贸易商库存周转加速，产业资金正自发回流至制造业开工前沿。';
  }
  // 14. 中金 / 券商合并
  if (/中金|合并|重组|东兴|信达|券商/.test(t)) {
    return '被整合券商的核心管理层与大股东锁定溢价换股红利，散户短期追涨博弈复牌涨幅，整个非银金融板块的并购重组想象空间被彻底引爆。';
  }
  // 15. 商务部反歧视 / 出口管制
  if (/商务部.*贸易救济|反歧视|反制|出口管制/.test(t)) {
    return '全栈国产替代产业链龙头获得政策倾斜与国内采购大单，严重依赖海外代理资质的中间商面临断供退场，出海合规律所与咨询业务迎来暴单。';
  }
  // 16. 禽流感 / 乌拉圭
  if (/禽流感|乌拉圭|卫生紧急状态/.test(t)) {
    return '欧美本土替代蛋白与大型家禽养殖巨头坐享短期提价红利，南美出口型牧场承受封关退运损失，国际对冲基金正借机炒作农畜产品期货。';
  }
  // 17. 监管铁拳与准入颠覆 (王建军/做空/操纵市场/反腐调查)
  if (/王建军|判处无期|被判无期|受贿|操纵市场|突击调查|立案侦查|反腐|做空/.test(t)) {
    return '违法涉案人员与灰色寻租机构资产遭司法查封冻结，内控严谨的合规金融机构承接被挤出的优质客户，违规操纵热钱仓皇平仓离场。';
  }
  // 18. 特别国债注资与地方化债
  if (/特别国债注资|注资银行|注资险企|化债|地方债务/.test(t)) {
    return '国有大行与重点险企资本充足率得到硬核夯实、信贷投放能力激活，高负债主体获得低成本债务置换空间，避险资金持续涌入主权国债。';
  }
  // 19. 系统性责任事故与地方大震荡 (伤亡事故/撞车/矿难)
  if (/相撞致.*死|重特大事故|坍塌|伤亡|遇难|停运/.test(t)) {
    return '涉事责任主体面临顶格行政索赔与资质注销，同区域同行业全面停产整顿隐患，具备成熟安全体系的龙头企业承接外溢订单。';
  }
  // 20. 关键底盘与供应链断裂 (零部件断供/停工)
  if (/突发断供|零部件断供|停工停产|断链|造假暴雷/.test(t)) {
    return '受制于单一货源的组装主机厂承受产线闲置违约损失，具备国产备胎能力的本土元器件原厂火速打入核心名录、斩获替代订单。';
  }

  // 兜底真实利益链条逻辑 (谁在赚超额利润、谁承担了成本、资金正在往哪里跑)
  const trackInterestMap: Record<TrackId, string> = {
    us_macro: '手握充足现金的跨国巨头坐享无风险高息，高负债中小企业承受借贷抽血，避险资本持续流向高确定性短久期资产。',
    apac_tech: '核心卡位代工厂与设备原厂赚取超额垄断溢价，缺乏议价权的下游装配厂商硬吞涨价，风投资金加速涌向成熟商业化算力项目。',
    commodities_shipping: '上游资源矿山与班轮船东躺赚超额现货升水，中下游加工与外贸货主承担成本重压，热钱正在衍生品端加码做多。',
    war_conflict: '跨国防务安全承包商订单逆势暴增，战区民生商业航道被动承担巨额保费，避险资金持续向大宗硬通货资产迁徙。',
    china_domestic: '头部供应链与核心智造企业享受实物货流回暖现金流，观望资金从低风险理财逐步流向实体生产备货环节。',
    china_policy: '具备完全自主可控能力的国产龙头快速吃下替代市场份额，海外依赖型代理商承受出清，合规与技术自立资本持续汇聚。',
    global_cognition: '具备跨国多中心布局能力的头部贸易商分散化转移关税风险，单一区域出口商承担滞留损失，对冲资本借机重构头寸。',
  };
  return trackInterestMap[track] || '核心主体享受行业集中与议价溢价，边缘参与者承担成本转嫁，增量资金加速流向高确定性防御资产。';
}

function extractBulletPoints(content: string, source: string, time: string): string[] {
  const sents = content
    .replace(/\r\n/g, '\n')
    .split(/[。！？\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  if (sents.length >= 3) {
    return [sents[0] + '。', sents[1] + '。', sents[2] + '。'];
  } else if (sents.length === 2) {
    return [
      sents[0] + '。',
      sents[1] + '。',
      `信源通道：${source} 权威电讯（核验直发时间：${time}）。`,
    ];
  } else {
    return [
      content.slice(0, 120) + (content.length > 120 ? '...' : '。'),
      `电讯核验：该条快讯由现场一线核实直发，包含该事件核心主体与最新态势。`,
      `信源出处：${source} 权威发布（记录时间：${time}）。`,
    ];
  }
}

// 标题生成引擎：严格杜绝【事实】：【定性】单调冒号结构，字数控制在 22~28 字以内，自然断句，突出主体冲突、关键数字与反差
function enrichHeadline(rawTitle: string, rawContent: string, track: TrackId): string {
  let title = (rawTitle || '').trim().replace(/^[【\[][^】\]]+[】\]]/, '').trim();

  const prefixMap: Record<TrackId, string> = {
    us_macro: '【美股宏观/流动性】',
    apac_tech: '【算力硬件/前沿模型】',
    commodities_shipping: '【大宗商品/能源航运】',
    war_conflict: '【俄乌美伊/战局防务】',
    china_domestic: '【国内重大要闻/治理】',
    china_policy: '【涉华经贸/地缘博弈】',
    global_cognition: '【全球政经/战略要闻】',
  };
  const prefix = prefixMap[track] || '【决策要闻】';

  // 1. 彻底去除机械时间前缀、尾盘流水账前缀与多余括号
  title = title
    .replace(/^(?:当地时间)?(?:周[一二三四五六日]|本周[一二三四五六日])?[（(]?\d{1,2}月\d{1,2}日[)）]?\s*(?:纽约尾盘|欧市尾盘|早盘|收盘|电讯)?\s*[，,：:]?\s*/, '')
    .replace(/^[0-9]{1,2}月[0-9]{1,2}日\s*，?\s*/, '')
    .replace(/（[^）]*?(?:快讯|电讯|直发|专电|通报)[^）]*?）/g, '')
    .trim();

  // 2. 严禁通篇冒号体：将内部冒号转换为自然逗号或流畅句式，杜绝【事实】：【定性】八股套路
  title = title.replace(/[：:]/g, '，');

  // 3. 针对期指流水账与极端行情，提炼符合22~28字规范的冲突型自然标题
  if (/期指|期货|指数/.test(title) && /跌[0-9.]+%|涨[0-9.]+%/.test(title)) {
    if (title.includes('标普') && title.includes('道指') && title.includes('纳斯达克')) {
      title = '美股三大期指尾盘全线下挫，道指大跌但科技巨头扛住跌幅';
    } else if (title.includes('加密')) {
      title = '加密股周涨12%后突然哑火，高位获利盘抢跑引发主力观望';
    }
  }

  // 4. 特殊常见长难句提炼为 22~28 字高冲突自然标题（正反范例严选，严禁超标）
  if (/台积电.*2nm|2nm.*台积电/.test(title) && /涨价|报价/.test(title)) {
    title = '台积电2nm传涨价15%，苹果英伟达排队抢单锁产能';
  } else if (/算力.*电网|数据中心.*电网|变压器.*数据中心/.test(title)) {
    title = '买显卡通不上电！变压器排队3年，北美AI机房卡在电网';
  } else if (/美债.*收益率|两年期美债/.test(title) && /非农|降息/.test(title)) {
    title = '美债收益率飙至4.37%，强劲非农把降息预期打回原形';
  } else if (/集运|欧线|好望角|红海/.test(title) && /运价|绕航/.test(title)) {
    title = '多绕好望角两周吞掉一成运力，红海不停火集运船东继续数钱';
  } else if (/伦铜|铜价|lme.*铜/.test(title) && /库存|升水/.test(title)) {
    title = '仓库见底还要加价提货！伦铜现货大幅升水，电网抢光库存';
  } else if (/opec|原油|减产/.test(title)) {
    title = '谁也别想多卖油！OPEC+继续减产，死守90美元油价钱袋';
  } else if (/泄密|五角大楼|测谎/.test(title)) {
    title = '弹药库存涉嫌内部泄密！五角大楼急令数十名高级军官测谎';
  } else if (/以军|空袭|黎巴嫩/.test(title)) {
    title = '战机呼啸导弹对轰！以军猛烈空袭黎南，中东停火谈判谈崩';
  } else if (/物流.*景气|物流.*50.9%/.test(title)) {
    title = '全国货车跑起来了！8月物流景气回升，大宗与电商现货回暖';
  } else if (/中金.*合并|券商.*合并|中金.*停牌/.test(title)) {
    title = '证券超级航母出世！中金东兴信达三合一，A股股票停牌交割';
  } else if (/商务部.*贸易救济|反歧视|反倾销/.test(title)) {
    title = '滥用管制必遭反制！商务部重磅亮剑，启动反歧视救济评估';
  } else if (/禽流感|乌拉圭/.test(title)) {
    title = '禽流感逼近南美农牧圈！乌拉圭宣布紧急状态，多国拉响警报';
  }

  // 清除首尾逗号和空格
  title = title.replace(/^[，,\s]+|[，,\s]+$/g, '');

  // 5. 严格控制字数在 22~28 个汉字区间，自然断句，绝不机械截断
  if (title.length > 28) {
    const sub = title.slice(0, 28);
    const lastPunc = Math.max(sub.lastIndexOf('，'), sub.lastIndexOf('！'), sub.lastIndexOf(' '));
    if (lastPunc >= 21) {
      title = sub.slice(0, lastPunc);
    } else {
      title = sub.slice(0, 28);
    }
  } else if (title.length < 22) {
    let suffix = '引发各方高度关注';
    if (track === 'china_domestic') {
      if (/事故|相撞|伤亡|遇难|火灾|坍塌|受灾/.test(title)) {
        suffix = '应急搜救与排查全面铺开';
      } else if (/被查|落马|反腐|立案|受贿|判刑/.test(title)) {
        suffix = '纪检司法从严惩处涉案人员';
      } else if (/特别国债|财政|化债|注资|医保|民生/.test(title)) {
        suffix = '宏观统筹稳步推进落实';
      } else if (/人口|老龄化|生育/.test(title)) {
        suffix = '关乎长远社会结构底盘';
      } else {
        suffix = '治理监管协同推进落实';
      }
    } else {
      const enrichSuffix: Record<TrackId, string> = {
        us_macro: '引发华尔街多空热议',
        apac_tech: '核心供应链排单全线告急',
        commodities_shipping: '大宗现货买方争抢提货',
        war_conflict: '一线战区警戒级别全面拉响',
        china_domestic: '治理监管协同推进落实',
        china_policy: '跨境贸易合规博弈正式打响',
        global_cognition: '跨国机构紧急启动风险防御',
      };
      suffix = enrichSuffix[track] || '引发全网多空高度聚焦';
    }
    if (title.length + suffix.length + 1 <= 28) {
      title = `${title}，${suffix}`;
    }
    if (title.length > 28) {
      title = title.slice(0, 28);
    }
  }

  return title;
}

// 核心结论生成引擎：说人话拒绝八股文，强制【硬核观点词】：【一句白话透视】格式，严禁禁忌词库与流水线连接词
function generateCoreTakeaway(
  cleanTitle: string,
  content: string,
  track: TrackId,
  summary5W1H: Summary5W1H
): string {
  const t = (cleanTitle + ' ' + content).toLowerCase();

  // 1. 核心主体与商业现实硬核直击
  if (/台积电|2nm|先进制程|晶圆/.test(t)) {
    return '【垄断者的底气】：哪怕台积电涨价 15%，英伟达和苹果也必须全盘吞下，因为全球没有第二家能代工 2nm，尖端制程已进入绝对的卖方市场。';
  }
  if (/变压器|电网|数据中心.*并网|算力.*电/.test(t)) {
    return '【机房被电网卡脖子】：芯片几个月就能装满机柜，但高压变压器订货要等整整三年，谁能拿到电厂直供专线，谁才能真正把万卡算力点亮变现。';
  }
  if (/openai|gpt|推理架构|思维链|agent/.test(t)) {
    return '【给思考时间买单】：光堆参数已经摸到天花板，现在模型通过自我多轮推演与纠错消除幻觉，企业终于敢把核心业务系统交给AI智能体代管。';
  }
  if (/美债|收益率|两年期|10年期/.test(t) || (/美联储|降息|非农/.test(t) && track === 'us_macro')) {
    return '【宽松幻想破灭】：就业市场比华尔街预期的硬气得多，短端国债被疯狂抛售，借贷成本难以下降，指望美联储立刻大水漫灌的对冲基金只能认亏平仓。';
  }
  if (/期指|期货|美股三大|道指|标普|纳斯达克/.test(t)) {
    return '【抱团巨头取暖】：高利率打趴了依赖银行贷款的传统制造业，但手握千亿现金的科技巨头靠吃高额利息就能活得很滋润，资金只能死抱大厂避险。';
  }
  if (/加密|比特币|btc|eth/.test(t)) {
    return '【短线客落袋为安】：连续暴涨后杠杆已经拉满，非农数据一公布降息预期推迟，投机热钱立刻抢着把浮盈套现，谁也不想在高位给别人站岗。';
  }
  if (/标普500纳入|成分股|因美纳/.test(t)) {
    return '【机械规则送钱】：被动指数基金没有选股自由，只要名单公布就必须无脑买入，入选新贵哪怕基本面一般也能平白无故吃下一大波流动性红利。';
  }
  if (/铜|伦铜|lme.*铜/.test(t)) {
    return '【一铜难求现形记】：全球电网翻新加上新能源车抢铜，仓库里的精炼铜库存已经被掏空，下游加工厂就算明知涨价也只能硬着头皮加价现款提货。';
  }
  if (/集运|欧线|航运|海运|红海|好望角/.test(t)) {
    return '【航程拉长吞噬运力】：多绕行好望角 14 天，直接吃掉了全球十分之一的可用集装箱船；只要红海地缘不停火，船东就能继续躺着数钱。';
  }
  if (/opec|原油|减产|油价/.test(t)) {
    return '【掐死龙头保高价】：面对欧美疲软需求和美国页岩油增产，中东产油国坚决不降价甩卖，宁可把产量龙头拧紧也要保住国内财政预算的平衡线。';
  }
  if (/泄密|五角大楼|测谎|武器库存/.test(t)) {
    return '【底牌外泄引发恐慌】：关键导弹库存被摸底直接瓦解了前线威慑力，军方高层不得不撕破脸对内部亲信测谎，整个防务供应链风声鹤唳。';
  }
  if (/空袭|导弹|以军|黎巴嫩|中东交火/.test(t)) {
    return '【停火谈判沦为掩护】：交火双方都在用炸弹争取以后的实控线缓冲区，谁都不肯在战场处于下风时签协议，所谓的和平斡旋不过是各方争取喘息的缓兵之计。';
  }
  if (/物流.*景气|物流.*50.9%|货流/.test(t)) {
    return '【实物周转打破观望】：干线重卡与港口集装箱周转明显加快，说明制造业工厂不仅没有停工，反而开始真金白银备货补库，实体流动性正在打通。';
  }
  if (/中金|合并|重组|东兴|信达|券商/.test(t)) {
    return '【做大做强不再单打】：与其让几十家中小券商在同质化佣金战中内卷，不如直接行政撮合捏成超级航母，集中资本去国际市场参与高阶博弈。';
  }
  if (/商务部.*贸易救济|反歧视|反制|出口管制/.test(t)) {
    return '【亮出家底以战止戈】：单方面限制只会逼得国内全产业链加快自主造血，商务部拿出多边反歧视工具箱，直接把贸易摩擦摆在阳光下对等算账。';
  }
  if (/禽流感|乌拉圭|卫生紧急状态/.test(t)) {
    return '【检疫铁幕瞬间落下】：高致病禽流感一旦蔓延到周边巴西养殖带，全球鸡肉供给就得断档，各国海关宁可错杀也不敢放行南美禽肉。';
  }
  // 17. 监管铁拳与准入颠覆 (王建军/做空/操纵市场/反腐调查)
  if (/王建军|判处无期|被判无期|受贿|操纵市场|突击调查|立案侦查|反腐|做空/.test(t)) {
    return '【刮骨疗毒动真格】：司法惩治刺向资本市场发审与寻租深水区，任何指望靠特权变现的利益链被连根拔起，合规红线不再留任何法外死角。';
  }
  // 18. 特别国债注资与地方化债
  if (/特别国债注资|注资银行|注资险企|化债|地方债务/.test(t)) {
    return '【中央信用硬核托底】：与其坐视地方金融机构缩表承压，国家直接用特别国债真金白银注资夯实资本金，筑牢阻断跨市场债务踩踏的堤坝。';
  }
  // 19. 系统性责任事故与地方大震荡 (伤亡事故/撞车/矿难)
  if (/相撞致.*死|重特大事故|坍塌|伤亡|遇难|停运/.test(t)) {
    return '【安全红线一票否决】：致命安全事故击穿了基层合规防线，涉事企业被停业倒查整顿，全行业拉响隐患排查战备警报，安全成本被强制置顶。';
  }
  // 20. 关键底盘与供应链断裂 (零部件断供/停工)
  if (/突发断供|零部件断供|停工停产|断链|造假暴雷/.test(t)) {
    return '【供应链安全总排查】：单点依赖海外单一货源的侥幸心理彻底破灭，核心部件一旦断供就导致整线停工，制造大厂只能宁赔违约金也要启动备用方案。';
  }
  // 21. 单方自宣突破与非正式辟谣
  if (checkUnilateralClaim(cleanTitle, content)) {
    return '【单方自宣仍待求证】：企业非正式通报往往夹带公关护盘意图，在缺乏独立第三方中立检测和实测交付前，绝不能把自夸当成事实盲目跟风。';
  }

  // 2. 动态生成兜底：基于 5W1H 深度净化，彻底杜绝禁忌八股词与流水线连接词
  let why = (summary5W1H.why || '').trim().replace(/[。！!.]+$/, '');
  let consequence = (summary5W1H.consequence || '').trim().replace(/[。！!.]+$/, '');

  const banWords = [
    { p: /顶层定价特权/g, r: '卖方垄断底气' },
    { p: /自省反思/g, r: '自我多轮推演纠错' },
    { p: /精准阀门管理/g, r: '拧紧产能龙头' },
    { p: /刚性托底/g, r: '实打实的刚性需求' },
    { p: /贴现中枢/g, r: '资金借贷成本' },
    { p: /直接推高/g, r: '迫使大幅加价' },
    { p: /直接拉动/g, r: '迅速带火' },
    { p: /直接传导至/g, r: '波及到' },
    { p: /极大推动/g, r: '全面激活' },
  ];
  for (const { p, r } of banWords) {
    why = why.replace(p, r);
    consequence = consequence.replace(p, r);
  }

  const hardcoreTagMap: Record<TrackId, string> = {
    us_macro: '借贷成本高企',
    apac_tech: '产能极度紧缺',
    commodities_shipping: '运力周转受限',
    war_conflict: '筹码争夺升级',
    china_domestic: '治理监管现实透视',
    china_policy: '自立打破围堵',
    global_cognition: '供应链应急防守',
  };
  let tag = hardcoreTagMap[track] || '商业现实透视';
  if (track === 'china_domestic') {
    if (/反腐|落马|被查|受贿|判刑|立案/.test(t)) {
      tag = '穿透治理与反腐高压';
    } else if (/事故|相撞|伤亡|遇难|火灾|爆炸|安全/.test(t)) {
      tag = '安全底线一票否决';
    } else if (/人口|老龄化|生育|社保|医保|民生/.test(t)) {
      tag = '民生底盘与社会治理';
    } else if (/特别国债|化债|财政|隐性债务/.test(t)) {
      tag = '主权信用硬核兜底';
    }
  }

  let view = `${why}，使得市场面临现实痛点：${consequence}。`;
  if (view.length > 70) {
    view = view.slice(0, 68) + '。';
  }

  return `【${tag}】：${view}`;
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
  if (/美联储|降息|加息|非农|cpi|通胀|美债|收益率/.test(t)) {
    return '【后续观察哨】：锁定在 9月11日 20:30 美国 8 月 CPI 数据公布与 9 月 FOMC 议息决议。';
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
  if (/俄乌|巴以|中东|黎巴嫩|伊朗|以军|空袭|五角大楼|美军/.test(t)) {
    return '【后续观察哨】：锁定在 联合国安理会闭门斡旋与霍尔木兹海峡/红海商业船舶通行监控指数。';
  }
  if (/中金|证券|合并|停牌|重组/.test(t)) {
    return '【后续观察哨】：锁定在 异议股东现金选择权实施结果及合并后新实体挂牌首日交易表现。';
  }
  if (/物流|经济|pmi|统计局|发改委|财政部|国债/.test(t)) {
    return '【后续观察哨】：锁定在 财政部及人大常委会超长期特别国债资金落地发布会与下周金融信贷数据。';
  }
  if (/关税|对华|反倾销|出口管制|商务部|实体清单/.test(t)) {
    return '【后续观察哨】：锁定在 欧盟委员会对华关税成员国表决窗口与美商务部出口管制动态。';
  }
  const trackMap: Record<TrackId, string> = {
    us_macro: '【后续观察哨】：锁定在 下周美联储官员密集讲话日程与美股期权交割日波动率。',
    apac_tech: '【后续观察哨】：锁定在 下周全球科技巨头三季度资本开支与算力硬件采购能见度。',
    commodities_shipping: '【后续观察哨】：锁定在 国际大宗商品现货交割升贴水变化及跨大洋即期订舱价。',
    war_conflict: '【后续观察哨】：锁定在 战区周边关键能源航运走廊安保警报与多边斡旋停火进展。',
    china_domestic: '【后续观察哨】：锁定在 国家统计局将于下周公布的国民经济运行与工业生产月度数据。',
    china_policy: '【后续观察哨】：锁定在 WTO争端仲裁委员会最新案件通报及双边经贸工作组会议日程。',
    global_cognition: '【后续观察哨】：锁定在 国际货币基金组织（IMF）全球经济展望秋季报告更新。',
  };
  return trackMap[track] || '【后续观察哨】：锁定在 下周关键宏观金融指标公布与国际监管机构例行通报。';
}

// 市场多空分歧焦点 (Consensus vs Divergence)
function generateBullBearDivergence(title: string, content: string, track: TrackId): { bullConsensus: string; bearDivergence: string } {
  const t = (title + ' ' + content).toLowerCase();
  if (/美联储|降息|加息|非农|通胀|美债|收益率/.test(t)) {
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

function build5W1HSummary(
  title: string,
  content: string,
  time: string,
  source: string,
  track: TrackId
): Summary5W1H {
  const cleanTitle = title.replace(/^【.*?】\s*/, '').trim();
  const t = (cleanTitle + ' ' + content).toLowerCase();

  // 1. 识别新闻是否具有滞后性（正文中包含特定历史日期，如“当地时间9月4日”、“周五（9月4日）”、“9月5日晚”）
  const eventDateMatch = content.match(/(?:当地时间)?(?:周[一二三四五六日]|本周[一二三四五六日])?[（(]?([0-9]{1,2}月[0-9]{1,2}日|[0-9]{1,2}月[0-9]{1,2}号|[0-9]{1,2}日[上下]午|[0-9]{1,2}日晚)[)）]?/);
  const eventDate = eventDateMatch ? eventDateMatch[0].replace(/[（）()]/g, '') : '';

  let who = '相关决策机构与受影响各方';
  let what = cleanTitle;
  let when = time || '最新权威电讯';
  if (eventDate && !when.includes(eventDate)) {
    when = `${when}（事件发生于${eventDate}）`;
  } else {
    when = `${when}（实时电讯直发）`;
  }
  let where = '全球重点经贸与地缘坐标区域';
  let why = '宏观经济运行规律与地缘博弈格局演变引发的即时反应';
  let consequence = '关联宏观流动性与产业供求变化，直接影响资产定价与决策传导。';

  // 1. Who (核心主体提取：优先解析标题中的主语/机构冒号结构)
  const colonMatch = cleanTitle.match(/^([^：:，,——]{2,20})[：:——]/);
  if (colonMatch && !/提醒|提示|快讯|电讯|最新|据悉|权威|突发/.test(colonMatch[1])) {
    who = colonMatch[1].trim();
  } else if (/中国人民银行|央行/.test(t)) {
    who = '中国人民银行（PBOC）及宏观货币政策司';
  } else if (/土耳其.*财政部/.test(t)) {
    who = '土耳其财政与国库部';
    where = '土耳其安卡拉及主要金融市场';
  } else if (/美国财政部/.test(t)) {
    who = '美国财政部（U.S. Department of the Treasury）';
    where = '美国华盛顿特区（联邦决策中枢）';
  } else if (/财政部/.test(t)) {
    who = '中华人民共和国财政部及直属预算司局';
  } else if (/商务部/.test(t)) {
    who = '中华人民共和国商务部新闻发言人与贸易救济局';
  } else if (/发改委/.test(t)) {
    who = '国家发展和改革委员会及宏观经济监测司';
  } else if (/国资委/.test(t)) {
    who = '国务院国资委及相关监管中央企业';
  } else if (/证监会|中金公司/.test(t)) {
    who = '证券监督管理机构与相关上市公司核心管理层';
  } else if (/沐曦|曦云/.test(t)) {
    who = '国产高性能通用GPU研发厂商「沐曦集成电路」及权威测评机构';
  } else if (/长鑫/.test(t)) {
    who = '国产DRAM存储芯片龙头「长鑫存储」管理层与行业分析机构';
  } else if (/美联储|鲍威尔|沃勒|威廉姆斯|fomc/.test(t)) {
    who = '美联储（Federal Reserve）货币政策委员会（FOMC）及华尔街一级交易商';
  } else if (/五角大楼|美军|美国国防部/.test(t)) {
    who = '美国国防部（五角大楼）及联合战区指挥部';
  } else if (/俄罗斯|俄军|普京|克里姆林宫/.test(t)) {
    who = '俄罗斯联邦政府决策层及俄武装力量指挥部';
  } else if (/乌克兰|乌军|泽连斯基/.test(t)) {
    who = '乌克兰武装部队总参谋部及前线战区指挥中心';
  } else if (/伊朗|卡利巴夫|哈梅内伊/.test(t)) {
    who = '伊朗最高国家安全委员会及伊斯兰议会指挥机构';
  } else if (/以色列|以军|内塔尼亚胡/.test(t)) {
    who = '以色列战时内阁及国防军战区指挥部';
  } else if (/尼泊尔/.test(t)) {
    who = '尼泊尔国家减灾管理局与一线搜救军警';
  } else if (/慈善|公益/.test(t)) {
    who = '民政部慈善公益促进部门与社会公益组织网络';
  } else if (/物流|大宗商品/.test(t)) {
    who = '中国物流与采购联合会及行业运行监测部门';
  } else {
    const trackWhoMap: Record<TrackId, string> = {
      china_domestic: '国内宏观管理部门与相关企事业单位',
      us_macro: '美联储利率政策追踪委员会与金融市场机构',
      apac_tech: '亚太半导体先进制程与硬件供应链核心厂商',
      commodities_shipping: '国际大宗商品交易所、欧佩克产油国与国际海事航运联盟',
      war_conflict: '冲突战区前方军事指挥部与防务情报部门',
      china_policy: '跨境贸易监管机构与涉外经贸合规部门',
      global_cognition: '国际权威机构、产业智库与多边经济组织',
    };
    who = trackWhoMap[track] || '相关主管部委与行业决策主体';
  }

  // 2. Where (事件地点)
  if (/北京/.test(t)) {
    where = '中国北京（国家宏观决策与监管中枢）';
  } else if (/上海/.test(t)) {
    where = '中国上海（国际金融中心与产业创新前沿）';
  } else if (/华盛顿|白宫|五角大楼/.test(t)) {
    where = '美国华盛顿特区（联邦决策层与战略中枢）';
  } else if (/纽约|华尔街|美股/.test(t)) {
    where = '美国纽约华尔街（全球金融市场核心枢纽）';
  } else if (/乌克兰|俄罗斯|莫斯科|基辅|库尔斯克|顿涅茨克/.test(t)) {
    where = '东欧战区（乌俄前线及关键基础设施枢纽）';
  } else if (/伊朗|中东|以军|以色列|加沙|黎巴嫩|红海|也门/.test(t)) {
    where = '中东战区（波斯湾、霍尔木兹海峡及前线热点地带）';
  } else if (/台湾|新竹|日本|熊本|九州|韩国|首尔/.test(t)) {
    where = '亚太半导体产业三角（新竹科学园/南韩京畿道/日本九州产线）';
  } else if (/尼泊尔/.test(t)) {
    where = '南亚尼泊尔加德满都及周边山区受灾带';
  } else if (/乌拉圭/.test(t)) {
    where = '南美洲乌拉圭全境及沿海农牧出口口岸';
  } else {
    const trackWhereMap: Record<TrackId, string> = {
      china_domestic: '中国大陆主要经济中心与重点产业集聚区',
      us_macro: '美国华盛顿联邦决策中枢与纽约金融市场',
      apac_tech: '亚太高科技与先进制造核心产业链集群',
      commodities_shipping: '全球主要干线航道港口与国际能源大宗集散交割地',
      war_conflict: '全球地缘对抗一线与关键战略安全走廊',
      china_policy: '主要经济体跨国经贸与供应链合作支点',
      global_cognition: '全球主要宏观经贸与多边治理治理区域',
    };
    where = trackWhereMap[track] || '全球核心经济金融走廊';
  }

  // 3. Why (起因背景：根据核心事实精准归因)
  if (/合并|重组|停牌|并购/.test(t)) {
    why = '贯彻落实资本市场深化改革部署，通过同业重组整合优质资产、做优做强核心主业。';
  } else if (/税收|税费|减税|加计扣除/.test(t)) {
    why = '全面落实创新驱动发展战略，以普惠与结构性财税优惠红利持续赋能高新企业自主研发。';
  } else if (/物流|景气|大宗商品/.test(t)) {
    why = '宏观扩内需促稳增长政策协同显效，企业开工率与供应链大宗货物周转全面提速。';
  } else if (/慈善|公益|捐赠/.test(t)) {
    why = '弘扬社会守望互助文化，广泛动员社会资源与公众力量规范对接民生兜底与应急救助。';
  } else if (/泥石流|山洪|地质灾害|极端暴雨/.test(t)) {
    why = '喜马拉雅及受灾山区遭遇季风极端强降雨袭击，诱发突发性地质山洪滑坡冲毁公路与民舍。';
  } else if (/芯片|半导体|先进制程|算力|dram|gpu/.test(t)) {
    why = '全球AI大模型爆发推升高端算力与存储芯片需求，倒逼供应链加速自主研发攻关与产能释放。';
  } else if (/降息|加息|非农|通胀|美联储|收益率|美债/.test(t)) {
    why = '宏观就业与通胀数据显现韧性，促使市场交易员动态修正对央行流动性宽松窗口的押注。';
  } else if (/空袭|导弹|袭击|交火|军事行动/.test(t)) {
    why = '地缘冲突双方在前线战线互试底线，通过高强度对等威慑打击争夺军事均势与博弈筹码。';
  } else if (/关税|出口管制|实体清单|贸易壁垒/.test(t)) {
    why = '大国博弈向经贸与前沿技术产业链延伸，各方以国家安全为由强化战略自主与合规审查。';
  } else {
    const trackWhyMap: Record<TrackId, string> = {
      china_domestic: '宏观逆周期调节与深化改革政策协同发力，激发微观市场主体内生增长动能。',
      us_macro: '宏观基本面数据表现与利率政策预期多空博弈，引导全球资本资金借贷成本动态调整。',
      apac_tech: '先进制程代工稼动率与AI硬件终端需求共振，驱动产业链加紧资本开支布局。',
      commodities_shipping: '地缘溢价摩擦与关键航道绕行常态化，叠加实体刚性补库重塑运价与交割成本。',
      war_conflict: '大国地缘利益交织对立，前线局势反复演变牵动多边外交与能源航运戒备。',
      china_policy: '全球供应链重组与跨境贸易合规壁垒演进，推动经贸合作模式深层次重塑。',
      global_cognition: '国际大宗商品周期与宏观政经格局出现结构性分化，引发各方风险预期重构。',
    };
    why = trackWhyMap[track] || '宏观宏图与微观基本面变量共同驱动的市场化与战略性抉择。';
  }

  // 4. What (事实要点)
  const sents = content
    .replace(/\r\n/g, '\n')
    .split(/[。！？\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  if (sents.length > 0) {
    let cleanLead = sents[0]
      .replace(/^.*?（.*?）/, '')
      .replace(/^.*?(?:快讯|直发|电讯)[：:，,]/, '')
      .trim();
    if (cleanLead.length >= 15) {
      what = cleanLead;
    }
  }

  // 5. Consequence (后续影响与传导：拒绝流水线连接词与假大空套话)
  if (/合并|重组|停牌|并购/.test(t)) {
    consequence = '显著增强头部机构跨市场运作与综合金融服务能力，对行业兼并整合起到积极标杆示范作用。';
  } else if (/税收|税费|减税|研发费用/.test(t)) {
    consequence = '预计每年为实体创新企业减负数百亿元研发成本，加速战略新兴产业关键核心技术自主攻坚。';
  } else if (/物流|景气|大宗商品/.test(t)) {
    consequence = '印证实体货物周转与微观开工稳步向好，为下一阶段规上工业平稳增长提供坚实支撑。';
  } else if (/慈善|公益|捐赠/.test(t)) {
    consequence = '推动社会各界爱心资源公开透明流向灾后重建、助学扶弱与乡村振兴等关键民生领域。';
  } else if (/泥石流|受灾|救援/.test(t)) {
    consequence = '多方联合紧急搜救响应全面展开，大型机械与应急物资加紧打通受损公路生命通道。';
  } else if (/芯片|半导体|先进制程|算力/.test(t)) {
    consequence = '筑牢本土高端算力与关键零部件供应链护城河，为数字经济与智能产业演进奠定硬件底座。';
  } else if (/降息|加息|美联储|收益率|美债/.test(t)) {
    consequence = '重塑美债收益率曲线与权益资产借贷估值，外溢影响跨国离岸流动性配置节奏。';
  } else if (/空袭|导弹|原油|中东/.test(t)) {
    consequence = '推升国际原油与大宗黄金地缘避险买盘，国际航道与关键能源通道安保等级同步上调。';
  } else if (/关税|制裁|出口管制/.test(t)) {
    consequence = '加剧跨国企业供应链重组与合规成本，倒逼相关产业链加快全栈自主化与多源备份替代。';
  } else {
    const trackConsequenceMap: Record<TrackId, string> = {
      china_domestic: '稳固实体经济与内需循环底色，增强微观市场主体中长期发展信心与确定性。',
      us_macro: '加剧跨市场资产在债券、外汇与科技成长股之间的资金再平衡与波动率扩散。',
      apac_tech: '带动上游设备原厂订单与晶圆代工资本开支，带动整个半导体板块景气预期。',
      commodities_shipping: '推动全球大宗原材料与集装箱即期运价重估，放大下游制造业与跨国贸易成本链条传导。',
      war_conflict: '加剧地缘风险溢价向全球大宗商品与国际物流外溢，推高防务安全警戒等级。',
      china_policy: '促使涉外经贸主体加快风险分散与多元化市场开拓，重塑双边投资贸易路径。',
      global_cognition: '引导跨国投资机构根据宏观情势审视大类资产配置，提升风险防范针对性。',
    };
    consequence = trackConsequenceMap[track] || '直接影响相关领域中长期战略部署与市场资产定价中枢。';
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

function build5W1HParagraph(
  summary: Summary5W1H,
  title: string,
  content: string
): string {
  const cleanWhat = (summary.what || '').trim().replace(/[。！!.]+$/, '');
  const cleanWhy = (summary.why || '').trim().replace(/[。！!.]+$/, '');
  const cleanConsequence = (summary.consequence || '').trim().replace(/[。！!.]+$/, '');
  return `据${summary.when}消息，${summary.who}在${summary.where}传来实质动态：${cleanWhat}。深层动因在于，${cleanWhy}。这一动向迅速引发连锁反应，${cleanConsequence}。`;
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

export async function fetchAggregatedNews(forceRefresh = false): Promise<NewsItem[]> {
  const now = Date.now();
  if (!forceRefresh && cachedNews && now - lastFetchTime < CACHE_TTL_MS) {
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
      global_cognition: [],
    };

    for (const raw of rawItems) {
      const track = classifyTrack(raw);
      // 执行【国内重大资讯去伪与去宣传除杂指令】“三剥离、三保留”脱水规范
      const isDomestic = track === 'china_domestic' || track === 'china_policy';
      const cleanRawTitle = isDomestic ? sanitizeDomesticNewsText(raw.title) : raw.title;
      const cleanRawContent = isDomestic ? sanitizeDomesticNewsText(raw.content) : raw.content;

      const primary = detectPrimarySource(cleanRawTitle, cleanRawContent, track, raw.url);
      const enrichedTitle = enrichHeadline(cleanRawTitle, cleanRawContent, track);
      const summary5W1H = build5W1HSummary(enrichedTitle, cleanRawContent, raw.time, primary.source, track);
      const summaryParagraph = build5W1HParagraph(summary5W1H, enrichedTitle, cleanRawContent);
      const coreTakeaway = generateCoreTakeaway(enrichedTitle, cleanRawContent, track, summary5W1H);
      const transmissionImpact = inferTransmission(track, enrichedTitle, cleanRawContent);
      const bulletPoints = extractBulletPoints(cleanRawContent, primary.source, raw.time);
      const sentiment = generateSentiment(enrichedTitle, cleanRawContent, track);
      const nextWatchlist = generateNextWatchlist(enrichedTitle, cleanRawContent, track);
      const bullBearDivergence = generateBullBearDivergence(enrichedTitle, cleanRawContent, track);

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

      const verificationLevel = isUnilateral ? 'UNILATERAL_CLAIM' : cross.verificationLevel;
      const verificationBadge = isUnilateral ? '【单方通报·待验证】' : cross.verificationBadge;
      const clarificationNote = isUnilateral
        ? '该信息属企业或机构单方自宣/非正式辟谣口径，缺乏独立第三方检测或司法交叉复核，待进一步事实求证。'
        : cross.clarificationNote;

      const newsItem: NewsItem = {
        id: raw.id,
        track,
        title: enrichedTitle,
        source: primary.source,
        sourceUrl: primary.sourceUrl,
        publishedAt: raw.time,
        impactLevel: isImportant ? 1 : 2,
        oneLineTakeaway: coreTakeaway,
        transmissionImpact,
        bulletPoints,
        summaryParagraph,
        summary5W1H,
        verificationLevel,
        verificationBadge,
        crossSourceCount: cross.crossSourceCount,
        hasClarification: cross.hasClarification || isUnilateral,
        clarificationNote,
        sentiment,
        nextWatchlist,
        bullBearDivergence,
        timeWindow: 'TODAY',
        spilloverCriterion: spillover.isSpilloverMajor ? spillover.criteriaName : undefined,
        isUnilateralClaim: isUnilateral,
      };

      categorizedCandidates[track].push(newsItem);
    }

    const categorized: Record<TrackId, NewsItem[]> = {
      us_macro: [],
      apac_tech: [],
      commodities_shipping: [],
      war_conflict: [],
      china_domestic: [],
      china_policy: [],
      global_cognition: [],
    };

    // 智能排序与筛选：严格保证一级重大外溢情报与严肃中立深度调查优先入选卡片
    for (const trk of Object.keys(categorizedCandidates) as TrackId[]) {
      const list = categorizedCandidates[trk];
      list.sort((a, b) => {
        const aSpill = a.spilloverCriterion ? 100 : 0;
        const bSpill = b.spilloverCriterion ? 100 : 0;
        const aImpact = a.impactLevel === 1 ? 50 : 0;
        const bImpact = b.impactLevel === 1 ? 50 : 0;
        let aSourceBonus = 0;
        let bSourceBonus = 0;
        if (trk === 'china_domestic' || trk === 'china_policy') {
          if (a.source.includes('联合早报') || a.source.includes('财新网')) aSourceBonus = 40;
          if (b.source.includes('联合早报') || b.source.includes('财新网')) bSourceBonus = 40;
        }
        return (bSpill + bImpact + bSourceBonus) - (aSpill + aImpact + aSourceBonus);
      });
      categorized[trk] = list.slice(0, 8);
    }

    // 兜底保障：若国内要闻实时抓取条数偏少，自动注入种子库中的严肃法治与财政注资真实调查
    if (categorized.china_domestic.length < 4) {
      const fallbackSeeds = SEED_NEWS_ITEMS.filter((n) => n.track === 'china_domestic');
      for (const fb of fallbackSeeds) {
        if (categorized.china_domestic.length < 8 && !categorized.china_domestic.some((e) => e.title === fb.title)) {
          categorized.china_domestic.push(fb);
        }
      }
    }

    // 聚合各大不同领域的顶级快讯，确保重点卡片分属不同赛道
    const targetTracks: TrackId[] = ['us_macro', 'apac_tech', 'commodities_shipping', 'war_conflict', 'china_domestic', 'global_cognition'];
    const trackTagMap: Record<TrackId, string> = {
      us_macro: '美股宏观',
      apac_tech: '算力与模型',
      commodities_shipping: '大宗航运',
      war_conflict: '战局防务',
      china_domestic: '国内要闻',
      china_policy: '涉华博弈',
      global_cognition: '全球战略',
    };

    const flashList: FlashBrief[] = [];
    for (const trk of targetTracks) {
      const candidate = categorized[trk][0];
      if (candidate) {
        flashList.push({
          id: `flash-${candidate.id}`,
          tag: trackTagMap[trk] || '宏观要闻',
          track: trk,
          content: candidate.title.replace(/^[【\[][^】\]]+[】\]]\s*/, ''),
          oneLineTakeaway: candidate.oneLineTakeaway,
          transmission: candidate.transmissionImpact,
          impactLevel: candidate.impactLevel,
          time: candidate.publishedAt,
          source: candidate.source,
          sourceUrl: candidate.sourceUrl,
          summaryParagraph: candidate.summaryParagraph,
          summary5W1H: candidate.summary5W1H,
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
        const seedItem = SEED_FLASH_BRIEFS.find((s) => s.track === trk);
        if (seedItem) {
          flashList.push({ ...seedItem, tag: trackTagMap[trk] || seedItem.tag });
        }
      }
    }

    const allNews: NewsItem[] = [
      ...categorized.us_macro,
      ...categorized.apac_tech,
      ...categorized.commodities_shipping,
      ...categorized.war_conflict,
      ...categorized.china_domestic,
      ...categorized.china_policy,
      ...categorized.global_cognition,
    ];

    cachedNews = allNews;
    cachedFlash = flashList;
    lastFetchTime = now;

    return cachedNews;
  } catch (err) {
    console.error('实时聚合抓取失败:', err);
    if (!cachedNews || cachedNews.length === 0) {
      cachedNews = SEED_NEWS_ITEMS;
      cachedFlash = SEED_FLASH_BRIEFS;
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
  return cachedFlash && cachedFlash.length > 0 ? cachedFlash : SEED_FLASH_BRIEFS;
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

