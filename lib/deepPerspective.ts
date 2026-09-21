/**
 * 全球决策情报终端 · 独家深度透视与事实分类引擎 (Deep Perspective & Factual-Only Filter Engine)
 * 
 * 核心规范：
 * 1. 严格区分“事实通报”与“深度透视”：
 *    - 事实通报：专职介绍客观详情（经过、地点、数据、现场搜救与权威通报）；
 *    - 深度透视：独家解读，包含【核心论点】、【支撑论据】与【强逻辑推导链路】，绝不复读事实通报。
 * 2. 并非所有文章都需要解读，六大类新闻【仅需事实详情，严禁/免除深层独家解读】：
 *    - 类别一：突发灾难与公共安全险情（自然灾害、工矿安全、交通公共事故等）；
 *    - 类别二：司法治安警情与刑事个案通报（公安警情、逮捕判决、失联搜救等）；
 *    - 类别三：市政民生服务与常规行政通知（道路施工、气象预警、节假限流等）；
 *    - 类别四：文体娱乐、社会轶事与生卒讣告（体育赛果、影视动态、名人生卒等）；
 *    - 类别五：企业日常例行行政流水与程序性公告（地址变更、年检、常规专利、捐赠表彰等）；
 *    - 类别六：白噪声式的盘中行情分时微波（无驱动随机微幅波动、盘中分时流水等）。
 * 3. 只有具有宏观政策、地缘博弈、芯片先进制程、资本市场监管出清深层逻辑的新闻，才提供深度透视。
 */

import type { NewsItem, Summary5W1H } from './types';

// ============================================================================
// 六大“仅需事实详情，免除/严禁深度解读”专属正则特征库
// ============================================================================

/** 类别 1: 突发灾难与公共安全险情类 (Disasters & Public Safety) */
export const FACTUAL_DISASTER_ACCIDENT_REGEX =
  /泥石流|地震|山洪|滑坡|塌方|地质灾害|台风|暴雨|暴雪|降雪|雷暴|强对流|山火|火灾|爆炸|燃气爆炸|脚手架坍塌|厂房坍塌|透水|矿难|煤矿事故|客机迫降|客机坠毁|列车脱轨|追尾事故|特大车祸|连环相撞|客轮翻沉|渔船翻沉|落水|溺水|搜救|失联人员|遇难人员|死伤人员|人员伤亡|应急响应启动|防汛应急/;

/** 兼容旧版命名 */
export const PURE_FACTUAL_DISASTER_REGEX = FACTUAL_DISASTER_ACCIDENT_REGEX;

/** 类别 2: 司法治安警情与刑事个案通报 (Crime & Legal Enforcement Cases) */
export const FACTUAL_CRIME_LEGAL_REGEX =
  /公安通报|警方通报|派出所通报|公安局通报|打架斗殴|故意伤人|故意杀人|凶杀案|寻衅滋事|刑事拘留|执行逮捕|涉嫌诈骗|电诈窝点|抓获犯罪嫌疑人|抓捕归案|开庭审理|一审宣判|二审判决|维持原判|被判处有期徒刑|死刑缓期|走失儿童|驴友失联|打捞遗体/;

/** 类别 3: 市政民生服务与常规行政通知 (Civic & Municipal Affairs) */
export const FACTUAL_CIVIC_MUNICIPAL_REGEX =
  /道路封闭|施工封闭|交通管制|封路施工|桥梁维修改线|临时停运|公交线路调整|暴雨黄色预警|暴雨蓝色预警|大风预警|高温防暑|防暑降温提示|节假日高速免费|景区门票售罄|预约客满|限流分流|供暖打压试水|公积金结息|医保缴费截止|停水通知|停电检修/;

/** 类别 4: 文体娱乐、社会轶事与生卒讣告 (Culture, Sports & Human Interest) */
export const FACTUAL_CULTURE_SPORTS_REGEX =
  /夺冠|战胜|战平|惜败|晋级四强|入围名单|赛果|胜出|首映礼|票房破亿|演唱会官宣|巡演|因病逝世|享年|追悼会|生平回顾|讣告|遗体告别|珍稀保护动物|流星雨|极光|日食|月食/;

/** 类别 5: 企业日常例行行政流水与程序性公告 (Routine Corporate Filings) */
export const FACTUAL_CORPORATE_ROUTINE_REGEX =
  /变更注册地址|办公地址搬迁|住所变更|例行年检|续聘会计师事务所|召开年度股东大会|外观设计专利|包装盒专利|向灾区捐款|捐赠物资|获得表彰|优秀示范企业|先进单位称号/;

/** 类别 6: 白噪声式的盘中行情分时微波 (Raw Market Ticker & Snapshot Quotes) */
export const FACTUAL_TICKER_NOISE_REGEX =
  /短线拉升\s*\d+|短线跳水\s*\d+|盘中拉升\s*\d+|分时微跌|分时微涨|窄幅震荡\s*\d+点|波动\s*\d+个基点|离岸人民币日内微调/;

/** 六大类聚合正则匹配池 */
export const PURE_FACTUAL_ONLY_REGEX = new RegExp(
  [
    FACTUAL_DISASTER_ACCIDENT_REGEX.source,
    FACTUAL_CRIME_LEGAL_REGEX.source,
    FACTUAL_CIVIC_MUNICIPAL_REGEX.source,
    FACTUAL_CULTURE_SPORTS_REGEX.source,
    FACTUAL_CORPORATE_ROUTINE_REGEX.source,
    FACTUAL_TICKER_NOISE_REGEX.source,
  ].join('|')
);

/**
 * 战略深度硬核豁免关键词：
 * 一旦事件涉及以下关键国家战略、宏观货币转向、硬核半导体突破或制度退市出清，则仍允许深度透视
 */
export const STRATEGIC_DEPTH_OVERRIDE_REGEX =
  /央行|美联储|降息|加息|利率|货币政策|pboc|lpr|特别国债|国债|财政赤字|化债|cpi|ppi|pmi|非农|通胀|失业率|制裁|关税|出口管制|反倾销|反补贴|实体清单|地缘|绕航|运价|欧线|伦铜|战略储备|原油|opec|算力|gpu|先进制程|流片|hbm|大模型|ai芯片|半导体|重大重组|借壳上市|强制退市|退市出清|财务造假|立案调查|反垄断|金融反腐|主权评级/;

export type FactualOnlyCategory =
  | 'DISASTER_PUBLIC_SAFETY' // 突发灾难与公共安全险情
  | 'CRIME_LEGAL_CASE'       // 司法治安警情与刑事个案
  | 'CIVIC_MUNICIPAL'        // 市政民生服务与常规行政通知
  | 'CULTURE_SPORTS_HUMAN'   // 文体娱乐、社会轶事与生卒讣告
  | 'CORPORATE_ROUTINE'      // 企业日常例行行政流水与程序性公告
  | 'TICKER_NOISE';          // 盘中行情分时微波白噪声

/**
 * 获取文章命中的纯事实分类标签（若未命中返回 null）
 */
export function getFactualOnlyCategory(text: string): FactualOnlyCategory | null {
  if (FACTUAL_DISASTER_ACCIDENT_REGEX.test(text)) return 'DISASTER_PUBLIC_SAFETY';
  if (FACTUAL_CRIME_LEGAL_REGEX.test(text)) return 'CRIME_LEGAL_CASE';
  if (FACTUAL_CIVIC_MUNICIPAL_REGEX.test(text)) return 'CIVIC_MUNICIPAL';
  if (FACTUAL_CULTURE_SPORTS_REGEX.test(text)) return 'CULTURE_SPORTS_HUMAN';
  if (FACTUAL_CORPORATE_ROUTINE_REGEX.test(text)) return 'CORPORATE_ROUTINE';
  if (FACTUAL_TICKER_NOISE_REGEX.test(text)) return 'TICKER_NOISE';
  return null;
}

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

  // 1. 如果已挂载核心条款清单、宏观分项穿透，天然属于深度研判事件
  if (item.macroInflationBreakdown || item.eventKeyProvisions) {
    return true;
  }

  // 2. 六大纯事实详情通报类别识别：若命中且未被国家战略深度豁免覆盖，严禁假解读与过度推演
  const factualCategory = getFactualOnlyCategory(text);
  const isStrategicOverride = STRATEGIC_DEPTH_OVERRIDE_REGEX.test(text);

  if (factualCategory && !isStrategicOverride) {
    return false;
  }

  // 3. 具备宏观政策、地缘博弈、产业架构或金融治理深层逻辑的新闻才需要深度透视
  const hasStrategicDepth = STRATEGIC_DEPTH_OVERRIDE_REGEX.test(text.toLowerCase());
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
