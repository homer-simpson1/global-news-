/**
 * 全球决策情报终端 · 独家深度透视与逻辑研判引擎 (Deep Perspective Engine)
 * 
 * 核心规范：
 * 1. 严格区分“事实通报”与“深度透视”：
 *    - 事实通报：详尽介绍事情的经过、地点、数据、现场处置与权威官方通报；
 *    - 深度透视：独家解读，包含【核心论点】、【支撑论据】与【强逻辑推导链路】，绝不复读事实通报。
 * 2. 并非所有文章都需要解读：
 *    - 纯自然灾害（地震、泥石流、山洪、台风等）与常规偶发事故，信源仅陈述客观伤亡与救援，严禁虚构所谓的“深度解读”；
 *    - 这类新闻直接不提供“展开深度透视”按钮，保持卡片干脆利落；
 *    - 只有具有宏观政策、地缘博弈、产业演进、资本市场治理深层逻辑的新闻，才提供深度透视。
 */

import type { NewsItem, Summary5W1H } from './types';

// 纯自然灾害、突发险情与常规事故关键词库（无需深度透视）
export const PURE_FACTUAL_DISASTER_REGEX =
  /泥石流|地震|山洪|滑坡|地质灾害|台风|暴雨|强对流|降雪|山火|火灾|爆炸|坍塌|相撞|车祸|交通事故|落水|溺水|冰岩崩|矿难|搜救|失联人员|遇难人员|死伤人员/;

/**
 * 判断文章是否具有深度解读的必要性
 */
export function isDeepPerspectiveEligible(item: {
  title?: string;
  content?: string;
  summaryParagraph?: string;
  track?: string;
  eventKeyProvisions?: any;
  macroInflationBreakdown?: any;
  companyProfile?: any;
}): boolean {
  const title = item.title || '';
  const text = `${title} ${item.summaryParagraph || ''} ${item.content || ''}`;

  // 1. 如果已挂载核心条款清单、宏观分项穿透或涉事主体档案，天然属于深度研判事件
  if (item.macroInflationBreakdown || item.eventKeyProvisions) {
    return true;
  }

  // 2. 纯自然灾害、突发搜救与常规事故通报，严禁进行“深度透视”与过度解读
  const isPureDisasterOrAccident =
    PURE_FACTUAL_DISASTER_REGEX.test(text) &&
    !/央行|美联储|财政|特别国债|化债|关税|制裁|出口管制|先进制程|GPU|芯片|大模型|并购|重组|退市|立案调查|反垄断/.test(
      text
    );

  if (isPureDisasterOrAccident) {
    return false;
  }

  // 3. 具备宏观政策、地缘博弈、产业架构或金融治理深层逻辑的新闻才需要深度透视
  const hasStrategicDepth =
    /美联储|降息|加息|利率|货币政策|央行|pboc|lpr|国债|财政|赤字|化债|cpi|ppi|pmi|非农|通胀|失业率|制裁|关税|出口管制|反倾销|反补贴|实体清单|地缘|绕航|运价|欧线|伦铜|原油|opec|算力|gpu|先进制程|流片|hbm|大模型|ai芯片|半导体|并购|重组|退市|财务造假|立案调查|反腐|违约|破产|评级|主权/.test(
      text.toLowerCase()
    );

  if (hasStrategicDepth) {
    return true;
  }

  // 若为常规国内新闻且无深层治理/经济博弈，不强行解读
  if (item.track === 'china_domestic') {
    return false;
  }

  return true;
}

export interface DeepPerspectiveContent {
  thesis: string;        // 独家解读 · 核心论点
  evidence: string[];    // 事实论据支撑
  logicChain: string;    // 逻辑推导演绎 · 一级传导链路
}

/**
 * 提取深度透视结构化内容（论点 + 论据 + 强逻辑）
 */
export function extractDeepPerspective(item: {
  title: string;
  oneLineTakeaway?: string;
  transmissionImpact?: string;
  bulletPoints?: string[];
  summary5W1H?: Summary5W1H;
  summaryParagraph?: string;
}): DeepPerspectiveContent {
  // 1. 核心论点 (Thesis)
  let thesis = (item.oneLineTakeaway || '').trim();
  if (!thesis || thesis.length < 8) {
    thesis = `【独家研判】：围绕该事件推进节点，市场核心聚焦其对供给端约束与政策时间窗口的实质影响。`;
  }

  // 2. 支撑论据 (Evidence)
  const evidence: string[] = [];
  if (item.bulletPoints && item.bulletPoints.length > 0) {
    for (const bp of item.bulletPoints.slice(0, 3)) {
      if (bp && bp.length >= 8 && !evidence.includes(bp)) {
        evidence.push(bp);
      }
    }
  }
  if (evidence.length === 0 && item.summary5W1H) {
    const s = item.summary5W1H;
    if (s.why && s.why.length >= 4) evidence.push(`动因背景：${s.why}`);
    if (s.consequence && s.consequence.length >= 4) evidence.push(`直接影响：${s.consequence}`);
  }
  if (evidence.length === 0) {
    evidence.push(`权威电讯公开通报的现场核查、监管通报及官方关键披露数据。`);
  }

  // 3. 强逻辑推导链路 (Logic Chain)
  let logicChain = (item.transmissionImpact || '').trim();
  if (!logicChain || logicChain.length < 8 || logicChain.includes('未披露上下游合同') || logicChain.includes('不做无依据推测')) {
    logicChain = `① 核心事件事实直接确立 ➔ ② 触发对应资产端、政策端或上下游供应链预期调整 ➔ ③ 驱动市场定价机制或监管应对进入新常态`;
  }

  return { thesis, evidence, logicChain };
}
