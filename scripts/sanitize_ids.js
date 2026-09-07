const fs = require('fs');
const path = require('path');

function hashId(seed) {
  let h = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return `GID-${h.toString(16).toUpperCase().padStart(8, '0')}`;
}

const fileContent = `import { FlashBrief, MarketQuote, NewsItem, TrackMetadata } from '@/lib/types';

export const TRACK_METADATA: Record<string, TrackMetadata> = {
  us_macro: {
    id: 'us_macro',
    title: '美股与美元宏观',
    tagline: '美联储利率预期 · 标普纳指流动性 · 科技与国债收益率走势',
    iconName: 'TrendingUp',
    badgeColor: 'border-blue-500 text-blue-700 bg-blue-50',
  },
  apac_tech: {
    id: 'apac_tech',
    title: '算力硬件与前沿模型',
    tagline: '先进制程晶圆代工 · GPU/HBM算力集群 · OpenAI与前沿开源大模型突破',
    iconName: 'Cpu',
    badgeColor: 'border-emerald-500 text-emerald-700 bg-emerald-50',
  },
  commodities_shipping: {
    id: 'commodities_shipping',
    title: '大宗商品与能源航运',
    tagline: '全球原油与LNG气价 · 铜铝锂关键工业金属 · 集运欧线与红海海运通道',
    iconName: 'Anchor',
    badgeColor: 'border-cyan-500 text-cyan-700 bg-cyan-50',
  },
  war_conflict: {
    id: 'war_conflict',
    title: '俄乌局势与美伊中东战局',
    tagline: '俄乌前线攻防 · 美伊中东军情 · 原油航运与大宗避险',
    iconName: 'Flame',
    badgeColor: 'border-rose-500 text-rose-700 bg-rose-50',
  },
  china_domestic: {
    id: 'china_domestic',
    title: '中国国内要闻与社会治理',
    tagline: '宏观物流与经济景气 · 金融债务化解 · 重大公共与社会要闻',
    iconName: 'ShieldAlert',
    badgeColor: 'border-amber-500 text-amber-700 bg-amber-50',
  },
  china_policy: {
    id: 'china_policy',
    title: '发达国家对华举措与博弈',
    tagline: '美欧出口管制 · 关税与投资审查 · 供应链友岸与外包动向',
    iconName: 'Globe',
    badgeColor: 'border-indigo-500 text-indigo-700 bg-indigo-50',
  },
  global_cognition: {
    id: 'global_cognition',
    title: '全球宏观认知与深度要闻',
    tagline: '全球大宗供求 · 跨国政经变局 · 国际机构权威深度追踪',
    iconName: 'BookOpen',
    badgeColor: 'border-purple-500 text-purple-700 bg-purple-50',
  },
};

export const SEED_MARKET_QUOTES: MarketQuote[] = [
  { symbol: '标普500', name: '美股标普500', price: '7,718.60', change: '-0.38%', isUp: false, category: 'US' },
  { symbol: '纳斯达克100', name: '纳斯达克100指数', price: '29,544.15', change: '+0.21%', isUp: true, category: 'US' },
  { symbol: '纳斯达克综合', name: '纳斯达克综合指数', price: '26,506.99', change: '-0.29%', isUp: false, category: 'US' },
  { symbol: '费城半导体', name: '费城半导体指数', price: '11,735.26', change: '+3.37%', isUp: true, category: 'US' },
  { symbol: '道琼斯', name: '道琼斯工业指数', price: '53,414.25', change: '-0.51%', isUp: false, category: 'US' },
  { symbol: '美债10年期', name: '美国10年期国债收益率', price: '4.790%', change: '+0.08%', isUp: true, category: 'BOND_FX' },
  { symbol: '日经225', name: '日本日经225指数', price: '66,399.84', change: '+2.12%', isUp: true, category: 'ASIA' },
  { symbol: '恒生指数', name: '香港恒生指数', price: '25,413.12', change: '-0.93%', isUp: false, category: 'ASIA' },
  { symbol: '国际原油', name: 'WTI原油连续', price: '$92.67/桶', change: '+1.26%', isUp: true, category: 'BOND_FX' },
  { symbol: '国际黄金', name: 'COMEX期金', price: '$4,450.8/盎司', change: '-0.49%', isUp: false, category: 'BOND_FX' },
  { symbol: '美元兑日元', name: '美元 / 日元', price: '154.23', change: '-0.08%', isUp: false, category: 'BOND_FX' },
  { symbol: '离岸人民币', name: '美元 / 离岸人民币', price: '6.7096', change: '+0.01%', isUp: true, category: 'BOND_FX' },
];

export const SEED_FLASH_BRIEFS: FlashBrief[] = [
  {
    id: "flash-seed-us-macro",
    tag: "美股宏观",
    track: "us_macro",
    content: "两年期美债收益率攀升至4.37%：非农韧性压制降息空间",
    transmission: "直接传导至美股流动性贴现中枢，与当前高企的长端美债收益率共同制约科技资产估值。",
    impactLevel: 1,
    time: "9月5日 09:45",
    source: "华尔街日报·美联储专线 (WSJ)",
    sourceUrl: "https://www.wsj.com",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 9月11日 20:30 美国 8 月 CPI 数据公布及 9 月 FOMC 议息决议降息幅度。",
    bullBearDivergence: {
      bullConsensus: "非农就业保持韧性验证美国经济软着陆路径，企业盈利基本面仍有坚实支撑。",
      bearDivergence: "紧缩周期尾声利率居高难下，若通胀反复可能推迟降息窗口，压制高估值科技资产。"
    },
    summaryParagraph: "据9月5日 09:45（权威电讯核验发布）通报，在美国华盛顿特区及纽约华尔街金融中心，美联储货币政策追踪委员会及华尔街一级交易商证实最新核心进展：美国2年期国债收益率在非农数据发布后走高2.9个基点至4.37%，反映出新增非农就业数据展现韧性，交易员迅速削减年内激进降息押注。究其起因，主要是最新劳动力市场表现稳健抑制了美联储急迫宽松预期，导致长端国债抛压再现。该事件带来的直接后果是，直接重塑美债收益率曲线与美股流动性贴现估值，高估值科技成长资产短期承压，全球美元流动性紧缩预期有所反复。",
    summary5W1H: {
      who: "美联储货币政策追踪委员会、华尔街一级交易商及利率互换市场",
      what: "美国2年期国债收益率在非农数据发布后走高2.9个基点至4.37%，交易员削减激进降息押注。",
      when: "9月5日 09:45（权威电讯核验发布）",
      where: "美国华盛顿特区及纽约华尔街全球金融交易中心",
      why: "最新劳动力市场表现稳健抑制了美联储急迫宽松预期，导致国债抛压再现。",
      consequence: "直接重塑美债收益率曲线与美股流动性贴现估值，高估值科技成长资产短期承压，美元指数获买盘支撑。"
    }
  },
  {
    id: "flash-seed-apac-tech",
    tag: "算力与模型",
    track: "apac_tech",
    content: "台积电先进制程产能告急且传涨价：英伟达苹果锁定2nm",
    transmission: "直接波及全球AI硬件代工稼动率与先进封测订单配额，推动半导体资本开支与设备股估值重估。",
    impactLevel: 1,
    time: "9月7日 09:30",
    source: "日经亚洲 (Nikkei Asia)",
    sourceUrl: "https://asia.nikkei.com",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 下周英伟达全球开发者与台积电投资人法说会资本开支指引。",
    bullBearDivergence: {
      bullConsensus: "AI大模型与云计算厂商资本开支依旧强劲，先进制程订单能见度直通2026年，利好设备与代工龙头。",
      bearDivergence: "下游数据中心电力配电与散热瓶颈逐步显现，服务器硬件实际落地节奏可能存在结构性时滞。"
    },
    summaryParagraph: "据9月7日 09:30（行业追踪快报）通报，在亚太半导体核心产业三角（中国台湾新竹、南韩京畿道及日本熊本），台积电先进制程晶圆代工部门与英伟达供应链主管证实最新核心进展：3nm及下一代2nm先进制程晶圆代工产能利用率连续两季度达到满负荷极限，主要算力原厂排单周期已延展至2026年第二季度，代工综合单价上传上浮。究其起因，主要是北美超大规模云厂商大规模扩充生成式AI数据中心算力集群，引发前所未有的先进封测（CoWoS）和晶圆代工锁量热潮。该事件带来的直接后果是，芯片代工龙头与设备厂商议价权显著增强，推动下游算力服务器整体出货成本上升并加速亚太芯片产业链资本开支扩张。",
    summary5W1H: {
      who: "台积电先进制程业务部、英伟达及全球云服务超大规模算力采购商",
      what: "先进制程晶圆代工产能全线告急且代工综合单价上浮，主要算力芯片排单周期延至2026年中。",
      when: "9月7日 09:30（行业追踪快报）",
      where: "亚太半导体核心三角（中国台湾新竹科学园区、南韩京畿道及日本九州）",
      why: "超大规模云厂商密集上马生成式AI集群，引发前所未有的CoWoS先进封测与晶圆产能抢夺。",
      consequence: "推升下游算力加速硬件整机成本，加速半导体设备与先进制程供应链资本开支与盈利上修。"
    }
  },
  {
    id: "flash-seed-commodities-shipping",
    tag: "大宗航运",
    track: "commodities_shipping",
    content: "伦铜库存触底叠加集运欧线大涨：工业金属与海运齐迎升水",
    transmission: "反映全球制造业开工补库与红海绕航对全球有效运力的双重吸收，推升大宗商品与跨境物流成本。",
    impactLevel: 1,
    time: "9月7日 10:15",
    source: "标普全球商品 (S&P Commodities)",
    sourceUrl: "https://www.spglobal.com/commodityinsights",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 下周 OPEC+ 产量政策评估及集运欧线即期订舱运价指数（SCFI）波动。",
    bullBearDivergence: {
      bullConsensus: "绿色能源转型与AI数据中心电网改造拉动铜刚性需求，海运绕航长期化推升有效运力溢价。",
      bearDivergence: "高利率对欧美地产传统制造业形成抑制，若需求端承压可能抑制金属现货提货意愿。"
    },
    summaryParagraph: "据9月7日 10:15（大宗市场权威追踪）通报，在伦敦金属交易所（LME）及欧洲集装箱航运核心中枢，大宗商品交易商与全球主流班轮公司证实最新核心进展：全球精炼铜显性库存降至近三年低位，工业金属现货升水持续拉大；与此同时，集装箱海运欧线即期运价在红海绕航常态化下大幅跳升。究其起因，主要是全球电网基建与新能源车制造带来强劲刚需，叠加红海地缘危机拉长集装箱船舶周转周期。该事件带来的直接后果是，推高全球工业品制造原材料与跨国贸易物流履约成本，对下游通胀粘性产生深远外溢。",
    summary5W1H: {
      who: "伦敦金属交易所（LME）现货交易商、马士基及达飞等全球班轮巨头",
      what: "伦铜库存降至历史低位现货升水扩大，欧线集装箱海运即期运价持续大涨。",
      when: "9月7日 10:15（大宗市场权威追踪）",
      where: "欧洲鹿特丹港、红海曼德海峡及伦敦金属交易中心",
      why: "电网改造与新能源拉动工业金属刚性交付，地缘冲突迫使货轮绕行好望角消耗运力。",
      consequence: "直接推高跨境物流与制造业原料成本，形成大宗商品与核心通胀输入性支撑。"
    }
  },
  {
    id: "flash-seed-war-conflict",
    tag: "战局防务",
    track: "war_conflict",
    content: "美军武器库存涉嫌泄密：五角大楼启动内部肃查并展开测谎",
    transmission: "涉及美军先进战备情报审查与防务合规，直接影响五角大楼外包采办与军事部署节奏。",
    impactLevel: 1,
    time: "9月7日 08:54",
    source: "五角大楼官方通报 (DoD)",
    sourceUrl: "https://www.defense.gov",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 联合国安理会闭门磋商窗口及霍尔木兹海峡/红海商船通行量指数。",
    bullBearDivergence: {
      bullConsensus: "国防保密审查强化将加速军工信息安全、保密通信与零信任网络系统的额外采购预算落地。",
      bearDivergence: "严格的合规审计与人事测谎可能导致部分关键战术导弹与无人系统的常规采购交付阶段性延宕。"
    },
    summaryParagraph: "据9月7日 08:54（军情核验播报）通报，在美国华盛顿五角大楼总部及驻外战区联合作战司令部，美国国防部（五角大楼）反间谍部门证实最新核心进展：五角大楼对美军战略武器库存与战备调配核心涉密数据外泄展开刑事级别全面调查，要求多名关键高级指挥军官接受多导测谎。究其起因，主要是重大前沿防务战备技术与战备库存数据存在非授权外泄风险，五角大楼为排查情报漏洞、防止技术流失而收紧安全审查。该事件带来的直接后果是，五角大楼收紧防务外包与涉密人员准入标准，可能导致美军先进装备采购与外销交付节奏出现技术性推迟。",
    summary5W1H: {
      who: "美国国防部（五角大楼）、联邦调查局（FBI）反间谍部门及涉及美军军官",
      what: "五角大楼对美军战略武器库存与战备调配核心涉密数据外泄展开刑事级别全面调查，要求多名关键高级指挥军官接受多导测谎。",
      when: "9月7日 08:54（军情核验播报）",
      where: "美国华盛顿五角大楼总部及驻外战区联合作战司令部",
      why: "重大前沿防务战备技术与战备库存数据存在非授权外泄风险，五角大楼为排查情报漏洞、防止技术流失而收紧安全审查。",
      consequence: "五角大楼收紧防务外包与涉密人员准入标准，可能导致美军先进装备采购与外销交付节奏出现技术性推迟。"
    }
  },
  {
    id: "flash-seed-china-domestic",
    tag: "国内要闻",
    track: "china_domestic",
    content: "中国8月物流景气指数回升至50.9%：大宗与电商货流保持扩张",
    transmission: "反映实体货物周转与微观开工景气度，8月物流指数50.9%处于扩张区间印证经济内生循环。",
    impactLevel: 1,
    time: "9月7日 09:34",
    source: "新华财经·宏观监测 (Xinhua)",
    sourceUrl: "https://www.news.cn",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 财政部及人大常委会超长期特别国债资金落地发布会与下周金融信贷数据。",
    bullBearDivergence: {
      bullConsensus: "物流总额领先实体工业1-2个月，景气指数重回扩张区间确认微观实体经济内生循环企稳。",
      bearDivergence: "微观行业利润率仍呈结构性分化，内需耐用消费品持续提振仍需宏观增量财政工具协同发力。"
    },
    summaryParagraph: "据9月7日 09:34（权威电讯核验发布）通报，在中国大陆各核心干线物流通道与主要产业集聚区，中国物流与采购联合会和国家发改委宏观物流运行监测部门证实最新核心进展：8月份中国物流业景气指数为50.9%，较上月回升0.5个百分点，业务总量指数和新订单指数均保持在扩张区间。究其起因，主要是宏观扩内需促消费政策协同显效，企业开工率回升，电商大促与内外贸易货物循环周转提速。该事件带来的直接后果是，印证实体经济大宗货物与消费品流转底色持续向好，为下一阶段规上工业增加值与进出口贸易奠定实体支撑。",
    summary5W1H: {
      who: "中国物流与采购联合会、国家发改委宏观物流运行监测部门",
      what: "8月份中国物流业景气指数为50.9%，较上月回升0.5个百分点，业务总量指数和新订单指数均保持在扩张区间。",
      when: "9月7日 09:34（权威电讯核验发布）",
      where: "中国大陆各核心干线物流通道与主要产业集聚区",
      why: "宏观扩内需促消费政策协同显效，企业开工率回升，电商大促与内外贸易货物循环周转提速。",
      consequence: "印证实体经济大宗货物与消费品流转底色持续向好，为下一阶段规上工业增加值与进出口贸易奠定实体支撑。"
    }
  },
  {
    id: "flash-seed-global-cognition",
    tag: "全球战略",
    track: "global_cognition",
    content: "乌拉圭暴发高致病性禽流感：宣布全国进入卫生紧急状态",
    transmission: "触发生物安全跨国检疫限制，影响南美农牧产品跨境出口流通与全球禽类供应预期。",
    impactLevel: 1,
    time: "9月5日 09:22",
    source: "路透全球要闻 (Reuters)",
    sourceUrl: "https://www.reuters.com",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 世界动物卫生组织（WOAH）全球禽流感跨境传播监测月度通报。",
    bullBearDivergence: {
      bullConsensus: "乌拉圭已建立网格化检疫封锁线，散养禽类疫情迅速阻断，对全球大豆肉类贸易长期影响可控。",
      bearDivergence: "若疫情跨界外溢至邻国巴西或阿根廷等全球肉类大国，可能引发全球农牧产品供应链价格异动。"
    },
    summaryParagraph: "据9月5日 09:22（电讯直报）通报，在南美洲乌拉圭全境农牧主产区及沿海主要检疫口岸，乌拉圭农牧渔业部与国家卫生防疫局证实最新核心进展：乌拉圭政府因境内多处农牧场发现高致病性禽流感疫情，正式签署法令宣布全国进入卫生紧急状态。究其起因，主要是候鸟迁徙路径扩散引发高致病性禽类病毒交叉感染，为阻断跨境养殖产业链传播而启动最高响应。该事件带来的直接后果是，南美农牧产品出口遭遇多国临时海关检疫封锁，全球禽肉供应链出现局部短缺并可能波及农产品大宗期货价格。",
    summary5W1H: {
      who: "乌拉圭农牧渔业部、国家卫生防疫局及跨国海关检疫机构",
      what: "乌拉圭政府因境内多处农牧场发现高致病性禽流感疫情，正式签署法令宣布全国进入卫生紧急状态。",
      when: "9月5日 09:22（电讯直报）",
      where: "南美洲乌拉圭全境农牧主产区及沿海主要检疫口岸",
      why: "候鸟迁徙路径扩散引发高致病性禽类病毒交叉感染，为阻断跨境养殖产业链传播而启动最高响应。",
      consequence: "南美农牧产品出口遭遇多国临时海关检疫封锁，全球禽肉供应链出现局部短缺并可能波及农产品大宗期货价格。"
    }
  }
];

export const SEED_NEWS_ITEMS: NewsItem[] = [
  // ================= 1. 美股与美元宏观 (us_macro) =================
  {
    id: "${hashId('us_macro_01')}",
    track: "us_macro",
    title: "两年期美债收益率升至4.37%：非农稳健打压降息空间",
    source: "彭博全球宏观 (Bloomberg)",
    sourceUrl: "https://www.bloomberg.com",
    publishedAt: "9月5日 06:10",
    impactLevel: 1,
    oneLineTakeaway: "非农就业超预期展现韧性抑制了短期激进宽松押注，长端美债收益率重拾升势，直接推高跨资产估值贴现率中枢。",
    transmissionImpact: "直接传导至美股流动性贴现中枢，与当前高企的长端美债收益率（4.79%）共同制约成长资产估值溢价。",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 9月11日 20:30 美国 8 月 CPI 数据公布及 9 月 FOMC 议息决议降息幅度。",
    bullBearDivergence: {
      bullConsensus: "非农新增就业保持稳健，反映美国宏观经济仍处软着陆轨道，企业盈利底盘扎实。",
      bearDivergence: "若通胀展现粘性，美联储降息窗口大幅收窄，长端国债贴现率高位运行将压制科技股估值。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "两年期美债收益率走高2.9个基点报4.37%，创出近期反弹新高。",
      "10年期基准国债收益率稳定在4.79%附近，利率互换市场下调年内降息频次预期。",
      "信源通道：彭博全球宏观 (Bloomberg) 权威现场电报（核验直发时间：9月5日 06:10）。"
    ],
    summary5W1H: {
      who: "美联储货币政策委员会、美国财政部及华尔街一级交易商",
      what: "两年期美债收益率在非农发布后上行2.9个基点报4.37%，基准贴现率全线上移。",
      when: "9月5日 06:10（电讯直发）",
      where: "美国华尔街金融交易中心与华盛顿特区",
      why: "最新劳动力市场表现稳健抑制了美联储急迫宽松预期，导致长端国债抛压再现。",
      consequence: "直接重塑美债收益率曲线与美股流动性贴现估值，高估值科技成长资产短期承压。"
    },
    summaryParagraph: "据9月5日 06:10（电讯直发）通报，在美国华尔街金融交易中心与华盛顿特区，美联储货币政策委员会及华尔街交易商证实：美债收益率全线上浮，两年期国债收益率升至4.37%。起因是非农就业展现强劲抗跌性，削减了快速降息预期，后续传导将直接重塑成长股定价底线。"
  },
  {
    id: "${hashId('us_macro_02')}",
    track: "us_macro",
    title: "美股三大期指尾盘全线承压：标普道指微跌，科技股抗跌",
    source: "标普全球 (S&P Global)",
    sourceUrl: "https://www.spglobal.com",
    publishedAt: "9月5日 05:49",
    impactLevel: 2,
    oneLineTakeaway: "利率预期调整引发顺周期与传统工业板块领跌，核心科技龙头依靠充沛自由现金流展现出相对防御韧性。",
    transmissionImpact: "加剧跨市场资产在防御性价值股与高韧性科技巨头之间的资金再平衡，价值股短期承压明显。",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 下周美股标普500期权月度交割日（OpEx）波动率峰值。",
    bullBearDivergence: {
      bullConsensus: "大型科技龙头现金流储备丰厚，高利率环境下具备超越周期的盈利抗风险能力。",
      bearDivergence: "无风险收益率维持高位削弱权益资产吸引力，若大盘估值中枢继续承压或引发被动平仓。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "标普500期货跌0.53%，道指期货跌0.84%，纳斯达克100期货微跌0.01%。",
      "罗素2000小盘股期货小幅反弹0.22%，呈现小市值局部活跃特征。",
      "信源通道：标普全球 (S&P Global) 权威现场电报（核验直发时间：9月5日 05:49）。"
    ],
    summary5W1H: {
      who: "芝加哥商业交易所（CME）期货交易商及全球多空对冲基金",
      what: "三大股指期货尾盘同步走低，道指与标普跌幅居前，纳指表现相对稳定。",
      when: "9月5日 05:49（电讯直发）",
      where: "美国芝加哥期货交易所与纽约证券交易所",
      why: "宏观非农数据走高重构了流动性宽松时点，避险情绪令顺周期权益抛压加剧。",
      consequence: "引导场内资金从高负债顺周期板块撤离，向优质高流动性资产抱团避险。"
    },
    summaryParagraph: "据9月5日 05:49（电讯直发）通报，美股三大期指尾盘呈现分化回调。主要是宏观贴现率上扬令周期板块承压，科技成长龙头显现抗跌韧性，反映出市场对资金成本重估的微观再平衡。"
  },
  {
    id: "${hashId('us_macro_03')}",
    track: "us_macro",
    title: "加密概念指数周涨12%：高位窄幅震荡，资金观望情绪渐浓",
    source: "彭博全球宏观 (Bloomberg)",
    sourceUrl: "https://www.bloomberg.com",
    publishedAt: "9月5日 05:44",
    impactLevel: 2,
    oneLineTakeaway: "前期连续大幅上涨累积了丰厚获利盘，非农落地后宏观流动性推迟促使杠杆资金暂停做多、等待方向明朗。",
    transmissionImpact: "反映高贝塔投机资本对全球宏观流动性边际变化的敏感度，影响边缘风险资产风险偏好。",
    sentiment: "NEUTRAL",
    nextWatchlist: "【后续观察哨】：锁定在 美国以太坊现货ETF日度净流入与美联储隔夜逆回购（RRP）存量水位。",
    bullBearDivergence: {
      bullConsensus: "机构资金通过现货ETF持续长线建仓，链上活跃地址与算力难度稳居历史高位。",
      bearDivergence: "若美元流动性短期收紧，高杠杆衍生品多头在关键压力位面临去杠杆爆仓风险。"
    },
    timeWindow: "PAST_24H",
    bulletPoints: [
      "加密关联概念指数单周累计涨幅超12%，当前在关键技术位缩量震荡整理。",
      "比特币在非农数据出炉后回吐部分日内涨幅，维持在7.9万至8.1万美元区间拉锯。",
      "信源通道：彭博全球宏观 (Bloomberg) 权威现场电报（核验直发时间：9月5日 05:44）。"
    ],
    summary5W1H: {
      who: "数字资产做市商、跨国量化对冲基金及现货ETF流动性提供商",
      what: "加密货币及关联指数在周内累涨12%后转入高位休整，日内微幅波动。",
      when: "9月5日 05:44（电讯直发）",
      where: "离岸离线合规托管所及全球数字资产交易所",
      why: "非农就业数据强化了美元资产吸引力，促使投机资金锁定前期浮盈。",
      consequence: "市场短期进入缩量盘整阶段，多空博弈静待下周核心通胀与美联储政策定调。"
    },
    summaryParagraph: "据9月5日 05:44（电讯直发）通报，美股加密关联资产在周涨12%后出现缩量休整。原因是宏观利率走势使得前期博弈降息的投机资金落袋为安，市场关注点转向后续真实流动性增量。"
  },
  {
    id: "${hashId('us_macro_04')}",
    track: "us_macro",
    title: "标普500纳入三大新成分股：因美纳与爱惠浦迎被动买盘",
    source: "标普全球 (S&P Global)",
    sourceUrl: "https://www.spglobal.com",
    publishedAt: "9月5日 05:16",
    impactLevel: 2,
    oneLineTakeaway: "指数编制规则调整驱动数千亿美元被动指数基金按权重硬性建仓，带来短期的确定性流动性溢价注入。",
    transmissionImpact: "直接导致调入标的流动性显著增强，同时被剔除股票将承受跟踪基金的机械性抛售调仓。",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 9月15日美股收盘后标普成分股正式生效日的尾盘集合竞价成交峰值。",
    bullBearDivergence: {
      bullConsensus: "被动资金被动买入将形成持续数周的资金支撑，入选标的估值溢价空间打开。",
      bearDivergence: "成分股调整利好常被对冲基金提前潜伏抢跑，正式生效日前后易出现短线多头平仓回吐。"
    },
    timeWindow: "HISTORIC",
    bulletPoints: [
      "标普道琼斯指数宣布将Bloom Energy、因美纳（Illumina）等纳入标普500成分股。",
      "相应股票盘后交易应声大涨超4%，ETF被动跟踪头寸将于下周展开集中建仓。",
      "信源通道：标普全球 (S&P Global) 权威现场电报（核验直发时间：9月5日 05:16）。"
    ],
    summary5W1H: {
      who: "标普道琼斯指数编制委员会、贝莱德先锋等被动资产管理巨头",
      what: "标普500指数完成季度成分股再平衡调整，纳入三家优质清洁能源与生物医药龙头。",
      when: "9月5日 05:16（电讯直发）",
      where: "美国纽约曼哈顿金融区",
      why: "入选企业市值规模、流动性指标及合规经营表现达标，符合基准指数纳样要求。",
      consequence: "引发全球数十只头部ETF启动强制跟踪调仓，显著改变标的二级市场微观供求。"
    },
    summaryParagraph: "据9月5日 05:16（电讯直发）通报，标普道琼斯指数调整落地。因美纳等三家企业入选标普500，直接驱动被动指数基金的硬性建仓需求，为相关标的注入流动性红利。"
  },

  // ================= 2. 算力硬件与前沿模型 (apac_tech) =================
  {
    id: "${hashId('apac_tech_01')}",
    track: "apac_tech",
    title: "台积电2nm代工传涨价15%：英伟达与苹果锁定先进制程",
    source: "日经亚洲 (Nikkei Asia)",
    sourceUrl: "https://asia.nikkei.com",
    publishedAt: "9月7日 09:30",
    impactLevel: 1,
    oneLineTakeaway: "尖端制程研发与EUV光刻资本开支高昂，先进制程绝对垄断地位赋予晶圆龙头不可替代的顶层定价特权。",
    transmissionImpact: "直接拉动上游设备原厂订单与先进封装资本开支，带动整个亚太半导体硬件供应链景气上行。",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 下周英伟达全球开发者与台积电投资人法说会资本开支指引。",
    bullBearDivergence: {
      bullConsensus: "全行业大模型与超算集群非台积电不可，代工涨价能顺畅向下游转嫁，提振全产业链毛利率。",
      bearDivergence: "下游算力卡整机成本高企可能导致部分中小型AI初创与云厂商推迟服务器更替周期。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "台积电2nm先进制程晶圆代工报价预计调涨10%-15%，主要先锋客户已签署长期包量协议。",
      "英伟达下一代Rubin架构GPU与苹果A19芯片锁定首批晶圆产能配额。",
      "信源通道：日经亚洲 (Nikkei Asia) 驻台半导体特派专电（记录时间：9月7日 09:30）。"
    ],
    summary5W1H: {
      who: "台积电先进制程制造部门、英伟达及苹果芯片采购决策层",
      what: "台积电2nm晶圆代工单价传将大幅上浮，先锋芯片巨头提前锁定排产产能。",
      when: "9月7日 09:30（行业追踪快报）",
      where: "中国台湾新竹科学园区、台南科学园区与美国加州硅谷",
      why: "先进制程研发边际成本递增叠加全球AI算力对于尖端制程的无限性刚性需求。",
      consequence: "巩固代工龙头丰厚利润垫，加速亚太先进制程供应链设备折旧与扩产投资循环。"
    },
    summaryParagraph: "据9月7日 09:30（行业追踪快报）通报，台积电先进制程晶圆代工调价预期落地。核心动因在于先进制程的垄断性技术壁垒与算力采购刚性，强化了龙头半导体供应链的利润扩张预期。"
  },
  {
    id: "${hashId('apac_tech_02')}",
    track: "apac_tech",
    title: "OpenAI发布新推理架构：强化链式思维，重塑Agent商业化",
    source: "路透科技 (Reuters Tech)",
    sourceUrl: "https://www.reuters.com/technology",
    publishedAt: "9月7日 04:15",
    impactLevel: 1,
    oneLineTakeaway: "模型演进重心由单纯预训练参数扩展转向推理阶段自省反思与算力分配，为高价值企业级智能体铺平道路。",
    transmissionImpact: "极大推动下游推理芯片（Inference ASIC）与高带宽内存（HBM）的长期采购需求增长。",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 下周OpenAI企业开发者大会API调用定价与微软Copilot深度整合方案。",
    bullBearDivergence: {
      bullConsensus: "逻辑推理突破大幅消除代码与金融领域的幻觉问题，真正开启企业级付费商用万亿蓝海。",
      bearDivergence: "深度链式推理单次调用消耗算力激增数倍，成本昂贵可能抑制普通C端消费者的频繁交互。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "新模型架构在复杂数学推理与代码纠错跑分中突破人类专家水平，幻觉率下降超60%。",
      "采用自研强化学习算法赋予模型在回答复杂问题时拥有自主思考与自我校错时间。",
      "信源通道：路透科技 (Reuters Tech) 硅谷前沿技术专电（记录时间：9月7日 04:15）。"
    ],
    summary5W1H: {
      who: "OpenAI前沿研究团队、微软全球企业智能事业群",
      what: "推出具备自省与强化推理能力的全新模型架构，大幅提升复杂逻辑解决可靠性。",
      when: "9月7日 04:15（技术突发专电）",
      where: "美国加州旧金山人工智能实验室与全球云节点",
      why: "传统单纯扩大参数模式遭遇边际递减与语料瓶颈，倒逼底层算法向推理端深度探索。",
      consequence: "推动AI应用从概念对话工具跃迁为具有高可靠执行能力的自主Agent系统。"
    },
    summaryParagraph: "据9月7日 04:15（技术突发专电）通报，OpenAI发布具备自主思维推理的新一代模型。核心本质是解决AI幻觉难题，将大模型商业价值从通用聊天升维至专业场景闭环作业。"
  },
  {
    id: "${hashId('apac_tech_03')}",
    track: "apac_tech",
    title: "北美AI算力集群遭遇电网瓶颈：多处数据中心并网延期",
    source: "彭博科技 (Bloomberg Tech)",
    sourceUrl: "https://www.bloomberg.com/technology",
    publishedAt: "9月6日 21:30",
    impactLevel: 2,
    oneLineTakeaway: "算力服务器硬件建设速度远超高压输电与变压器扩容周期，物理能源与电网配给成为AI落地的硬约束。",
    transmissionImpact: "倒逼云计算巨头转向核能与独立绿电直供，推动电力设备、变压器与储能产业链估值重估。",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 美国联邦能源管理委员会（FERC）关于数据中心直连核电并网听证会。",
    bullBearDivergence: {
      bullConsensus: "电力瓶颈倒逼巨头大手笔布局核电微堆与储能，催生跨界新型基础设施万亿投资赛道。",
      bearDivergence: "电网扩容审批周期长达3-5年，算力芯片交付后无法立即点亮上线将压低硬件投资回报率。"
    },
    timeWindow: "PAST_24H",
    bulletPoints: [
      "加拿大及美东多地市政电力公司因负荷承载极限，暂缓批准大型数据中心新接电申请。",
      "超大规模数据中心项目建设工期被动拉长，硬件上架与服务器部署出现6-12个月滞后。",
      "信源通道：彭博科技 (Bloomberg Tech) 宏观公用事业追踪（记录时间：9月6日 21:30）。"
    ],
    summary5W1H: {
      who: "北美电网运营协调理事会、公用事业电力公司与头部云服务商",
      what: "算力数据中心电力需求超负荷，多地电力部门推迟新的特高压并网供电方案。",
      when: "9月6日 21:30（行业调查专电）",
      where: "美国弗吉尼亚州北部数据中心走廊与加拿大安大略省",
      why: "万卡集群单点用电负荷高达数百兆瓦，当地传统电网基建升级速度严重落后。",
      consequence: "制约生成式AI算力集群的集中点亮节奏，迫使科技公司分散布局并自建微电网。"
    },
    summaryParagraph: "据9月6日 21:30（行业调查专电）通报，北美算力基建受阻于电力供给短缺。本质是数字算力扩张与物理能源基建周期的严重错配，电网配给瓶颈成为制约算力释放的关键物理锚点。"
  },

  // ================= 3. 大宗商品与能源航运 (commodities_shipping) =================
  {
    id: "${hashId('commodities_shipping_01')}",
    track: "commodities_shipping",
    title: "伦铜库存低位触底反弹：全球制造业补库拉动，现货升水",
    source: "标普全球商品 (S&P Commodities)",
    sourceUrl: "https://www.spglobal.com/commodityinsights",
    publishedAt: "9月7日 10:15",
    impactLevel: 1,
    oneLineTakeaway: "全球电网升级改造与新能源产业链赋予精炼铜长周期刚性托底，低显性库存赋予铜价极强抗跌性与价格弹性。",
    transmissionImpact: "工业金属铜价走强直接反映宏观实体经济回暖信号，同时推升电线电缆与制造业微观生产成本。",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 伦敦金属交易所（LME）铜注册仓单变动与智利国家铜业公司（Codelco）月报。",
    bullBearDivergence: {
      bullConsensus: "铜矿老龄化导致供给弹性极差，AI数据中心与新能源车对铜的密集消耗保障中长期牛市底色。",
      bearDivergence: "若欧美高利率环境持续压制传统地产建筑与耐用品开工，现货高升水可能抑制加工厂备库。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "伦敦金属交易所（LME）铜现货对三个月期货合约升水扩大至近期高位，显示即期交割紧俏。",
      "全球主要精炼铜注册交割仓库库存总量处于历史偏低分位数，现货支撑强固。",
      "信源通道：标普全球商品 (S&P Commodities) 伦敦金属追踪（记录时间：9月7日 10:15）。"
    ],
    summary5W1H: {
      who: "伦敦金属交易所注册交易商、跨国矿业龙头及全球电线电缆加工企业",
      what: "伦铜显性库存触底回升同时现货升水走阔，工业金属整体呈现抗跌走强态势。",
      when: "9月7日 10:15（大宗市场权威追踪）",
      where: "英国伦敦金属交易所、欧洲鹿特丹港与亚洲保税仓库",
      why: "实体制造业迎来金九银十旺季备货，叠加全球电网投资加速释放对工业金属的实物需求。",
      consequence: "确立工业金属作为全球宏观复苏晴雨表的领先指示作用，提振周期股市场风险偏好。"
    },
    summaryParagraph: "据9月7日 10:15（大宗市场权威追踪）通报，伦铜市场呈现现货升水与库存低位并存态势。核心驱动是新能源电气化改造与秋季微观开工复苏，低库存特征放大了工业金属向上的价格弹性。"
  },
  {
    id: "${hashId('commodities_shipping_02')}",
    track: "commodities_shipping",
    title: "集运欧线即期运价大涨：红海绕航常态化，集装箱舱位紧俏",
    source: "劳氏日报 (Lloyd's List)",
    sourceUrl: "https://www.lloydslist.com",
    publishedAt: "9月7日 08:20",
    impactLevel: 1,
    oneLineTakeaway: "地缘安全危机迫使亚欧主流航线绕行好望角，船舶往返航程拉长直接吸收了全球约10%的集装箱有效运力供给。",
    transmissionImpact: "集装箱即期运费上涨直接传导至外贸进出口货主，推高欧亚货运物流链条的到岸履约成本。",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 上海航运交易所集装箱出口运价指数（SCFI）及苏伊士运河通行月报。",
    bullBearDivergence: {
      bullConsensus: "红海危机长期化导致有效运力持续消耗，班轮巨头长协签约中枢上移，盈利水平维持高位。",
      bearDivergence: "造船厂批量新交付的大型集装箱船下半年陆续入列，一旦地缘局势破冰，运力过剩将引发回调。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "远东至欧洲集装箱即期订舱报价连续三周上扬，主流船公司9月中旬舱位已基本订满。",
      "商船经好望角绕行导致单程周转时间延长10至14天，船舶周转率受限推高运力利用率。",
      "信源通道：劳氏日报 (Lloyd's List) 全球海事航运快讯（记录时间：9月7日 08:20）。"
    ],
    summary5W1H: {
      who: "全球集装箱班轮联盟（2M、Ocean Alliance）、中欧跨国贸易货主",
      what: "集运欧线海运即期报价持续走强，主流船东舱位利用率达到满载峰值。",
      when: "9月7日 08:20（海运实时专电）",
      where: "上海港、宁波舟山港、红海曼德海峡与欧洲鹿特丹/汉堡港",
      why: "红海商船遇袭风险迫使船只绕行非洲大陆，海运物理航程拉长系统性抽干全球闲置运力。",
      consequence: "航运板块业绩与现金流预期大幅改善，同时对外贸商品进出口交付周期产生延滞效应。"
    },
    summaryParagraph: "据9月7日 08:20（海运实时专电）通报，欧线海运集装箱运价延续上涨行情。本质是红海地缘政治对抗引发全球航道物理性重构，航程大幅拉长形成了供给侧的硬性有效运力紧缺。"
  },
  {
    id: "${hashId('commodities_shipping_03')}",
    track: "commodities_shipping",
    title: "OPEC+代表磋商延期自愿减产：国际原油多空博弈需求指引",
    source: "普氏能源资讯 (S&P Global Energy)",
    sourceUrl: "https://www.spglobal.com/commodityinsights",
    publishedAt: "9月6日 19:40",
    impactLevel: 2,
    oneLineTakeaway: "核心产油国通过供应侧精准阀门管理对冲非OPEC产油国增量，坚决维护油价在主要产油国财政平衡区间上方。",
    transmissionImpact: "国际油价高位震荡直接影响成品油裂解价差与全球主要经济体输入性交通物流通胀中枢。",
    sentiment: "NEUTRAL",
    nextWatchlist: "【后续观察哨】：锁定在 下周 OPEC+ 联合部长级监督委员会（JMMC）正式决议及EIA原油库存报告。",
    bullBearDivergence: {
      bullConsensus: "OPEC+具备极高减产执行纪律与剩余产能调节能力，地缘风险溢价封死油价大幅下行空间。",
      bearDivergence: "欧美电动车普及对交通用油形成替代，若全球宏观经济增速放缓，边际需求走弱将考验产油国联盟。"
    },
    timeWindow: "PAST_24H",
    bulletPoints: [
      "部分主要产油国代表建议将四季度每日220万桶的自愿减产计划进一步顺延1至2个月。",
      "布伦特与WTI原油期货在减产预期支撑下在90美元上方展开密集换手筑底。",
      "信源通道：普氏能源资讯 (S&P Global Energy) 维也纳专电（记录时间：9月6日 19:40）。"
    ],
    summary5W1H: {
      who: "OPEC+产油国联盟决策层、沙特能源部及俄罗斯石油工业委员会",
      what: "产油国联盟探讨顺延自愿减产协议期限，稳定全球原油现货供求平衡。",
      when: "9月6日 19:40（能源决策动态）",
      where: "奥地利维也纳OPEC总部与沙特利雅得",
      why: "应对非OPEC国家产量上升与全球传统能源季节性需求平淡，防止库存快速累积。",
      consequence: "为国际基准原油构筑稳固成本支撑平台，抑制油价因宏观情绪恐慌出现非理性踩踏。"
    },
    summaryParagraph: "据9月6日 19:40（能源决策动态）通报，OPEC+推进自愿减产延期磋商。核心起因是产油国联盟通过灵活供应调节锚定全球油价底线，在多空分歧中为全球能源市场提供确定性支撑。"
  },

  // ================= 4. 俄乌局势与美伊中东战局 (war_conflict) =================
  {
    id: "${hashId('war_conflict_01')}",
    track: "war_conflict",
    title: "美军武器库存涉嫌泄密：五角大楼启动内部肃查并展开测谎",
    source: "五角大楼官方通报 (DoD)",
    sourceUrl: "https://www.defense.gov",
    publishedAt: "9月7日 08:54",
    impactLevel: 1,
    oneLineTakeaway: "关键防务技术与库存参数非授权外泄威胁前线作战部署安全性，倒逼美军全面收紧涉密权限与军工外包准入。",
    transmissionImpact: "强化五角大楼内部防务采购审查与网络保密等级，可能对下一阶段部分外包采办带来流程性延滞。",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 联合国安理会闭门磋商窗口及霍尔木兹海峡/红海商船通行量指数。",
    bullBearDivergence: {
      bullConsensus: "内部安全整肃将直接催生军工数据安全、保密通信与零信任防御系统的额外国防预算倾斜。",
      bearDivergence: "军官测谎与外包调查拉长行政审批链条，可能导致部分急需交付前线的高科技弹药签约延期。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "五角大楼反间谍与安全部门对关键指挥军官展开测谎排查，重点追查精确制导弹药库存流向。",
      "美国防部宣布暂缓部分未经深度合规审查的外部承包商访问中央防务数据库权限。",
      "信源通道：五角大楼官方通报 (DoD) 现场新闻发布会（记录时间：9月7日 08:54）。"
    ],
    summary5W1H: {
      who: "美国国防部（五角大楼）、联邦调查局反间谍调查组及涉事高级指挥官",
      what: "就敏感战备库存与先进装备数据外泄启动刑事级全面调查，多名军官接受技术测谎。",
      when: "9月7日 08:54（军情核验播报）",
      where: "美国华盛顿五角大楼总部及联合作战司令部指挥枢纽",
      why: "前沿防务战备技术存在非授权外流风险，五角大楼为排查情报隐患防止战略底牌暴露。",
      consequence: "大幅收紧防务外包与涉密人员准入标准，引发美军供应链合规审查地震。"
    },
    summaryParagraph: "据9月7日 08:54（军情核验播报）通报，五角大楼展开战备库存泄密调查。起因是核心涉密数据外流触碰国防安全红线，事件带来的后果是美军外包采购与人员审查全面趋严。"
  },
  {
    id: "${hashId('war_conflict_02')}",
    track: "war_conflict",
    title: "以军空袭黎巴嫩南部阵地：前线交火加剧，停火斡旋遇冷",
    source: "半岛电视台 (Al Jazeera)",
    sourceUrl: "https://www.aljazeera.com",
    publishedAt: "9月5日 03:20",
    impactLevel: 1,
    oneLineTakeaway: "冲突双方在边境缓冲区维持对等高强度威慑，通过打击对方关键战术节点争取未来停火谈判的实际控制线筹码。",
    transmissionImpact: "维系中东地缘政治风险溢价，对国际原油避险买盘与跨国航空公司中东航线绕行成本构成持续支撑。",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 埃及开罗与卡塔尔多哈停火斡旋代表团新一轮穿梭外交联合声明。",
    bullBearDivergence: {
      bullConsensus: "主要涉事方均不愿承受全面区域战争带来的巨大经济代价，战事仍被控制在外科手术式互袭范畴。",
      bearDivergence: "边境交火密集度上升极易诱发误击或高级指挥官伤亡，一旦触发对等报复升级将迅速失控。"
    },
    timeWindow: "PAST_24H",
    bulletPoints: [
      "以军战机对黎巴嫩南部多处火箭发射哨所实施精确打击，地面防空警报持续拉响。",
      "黎巴嫩真主党随后发射多枚火箭弹进行对等反击，双方均表示已做好应对局势升级准备。",
      "信源通道：半岛电视台 (Al Jazeera) 贝鲁特与特拉维夫前线快讯（记录时间：9月5日 03:20）。"
    ],
    summary5W1H: {
      who: "以色列国防军北方司令部、黎巴嫩真主党武装及联合国驻黎巴嫩维和部队",
      what: "以军对黎南部目标展开连续空袭并引发多发对等还击，边境安全局势显著升温。",
      when: "9月5日 03:20（战地实时直击）",
      where: "黎巴嫩南部边境沿线与以色列北部加利利防区",
      why: "双方在缓冲区实际控制权与停火准则上存在根本分歧，试图通过前线军事施压打破谈判僵局。",
      consequence: "加剧地缘风险溢价向全球大宗商品与国际物流外溢，推高防务安全警戒等级。"
    },
    summaryParagraph: "据9月5日 03:20（战地实时直击）通报，以军在黎巴嫩南部展开空袭反击。动因是前线双方试图通过有限军事行动确立安全纵深优势，导致区域地缘风险溢价难以降温。"
  },

  // ================= 5. 中国国内要闻与社会治理 (china_domestic) =================
  {
    id: "${hashId('china_domestic_01')}",
    track: "china_domestic",
    title: "中国8月物流景气指数回升至50.9%：实体货流稳步提速",
    source: "新华财经·宏观监测 (Xinhua)",
    sourceUrl: "https://www.news.cn",
    publishedAt: "9月7日 09:34",
    impactLevel: 1,
    oneLineTakeaway: "扩内需促消费与重点工程开工形成微观实物工作量共振，大宗货物周转加速印证实体制造业复苏基本面。",
    transmissionImpact: "印证微观实体经济大宗货物与消费品流转持续向好，为下一阶段规上工业平稳增长奠定坚实支撑。",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 财政部及人大常委会超长期特别国债资金落地发布会与下周金融信贷数据。",
    bullBearDivergence: {
      bullConsensus: "物流景气指数回升反映出制造业生产端活力恢复，企业主动补库周期正在自下而上展开。",
      bearDivergence: "消费端价格传导仍需时日观察，微观中小型商贸企业的经营现金流改善仍需政策精准滴灌。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "8月中国物流业景气指数较上月回升0.5个百分点至50.9%，新订单与业务总量指数双双处于景气区间。",
      "电商快件与大宗工业品运输表现突出，主要枢纽货运集散吞吐量实现环比提速。",
      "信源通道：新华财经·宏观监测 (Xinhua) 国家物流运行月报（记录时间：9月7日 09:34）。"
    ],
    summary5W1H: {
      who: "中国物流与采购联合会、国家发改委现代物流运行监测专班",
      what: "8月物流景气指数反弹至50.9%重回扩张区间，货运物流周转呈现全面提速态势。",
      when: "9月7日 09:34（权威电讯核验发布）",
      where: "中国大陆干线货运网络、大型海铁联运枢纽与电商分拨基地",
      why: "扩内需政策发力与生产旺季临近形成合力，工农业大宗原材料流转与电商交割活跃。",
      consequence: "筑牢实体工业平稳增长底座，提振宏观资本市场对下半年经济韧性的内生信心。"
    },
    summaryParagraph: "据9月7日 09:34（权威电讯核验发布）通报，8月份物流指数重返景气区间。核心在于生产生活各领域实物周转全面激活，为宏观经济企稳向上提供了微观维度的有力佐证。"
  },
  {
    id: "${hashId('china_domestic_02')}",
    track: "china_domestic",
    title: "中金公司吸收合并方案获批：A股股票停牌进入交割落地",
    source: "财新网 (Caixin Macro)",
    sourceUrl: "https://finance.caixin.com",
    publishedAt: "9月6日 18:50",
    impactLevel: 1,
    oneLineTakeaway: "落实资本市场做优做强头部券商战略部署，通过横向资产整合重塑全业务链竞争优势，发挥标杆示范效应。",
    transmissionImpact: "提升证券行业集中度与大型央国企综合金融服务能力，对金融板块兼并重组预期形成正面催化。",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 换股吸收合并异议股东现金选择权实施结果及合并后新实体挂牌首日表现。",
    bullBearDivergence: {
      bullConsensus: "航母级综合投行诞生将极大增强中国资本市场跨境金融与科创承销能力，优化资产利用效率。",
      bearDivergence: "大型机构并购涉及系统打通、牌照整合与团队文化融合，业务协同红利的释放需要时间消化。"
    },
    timeWindow: "PAST_24H",
    bulletPoints: [
      "中金公司、东兴证券、信达证券同步披露重组进展，重组方案正式获得有关部门审核核准。",
      "公司A股股票将按规定停牌进入现金选择权申报与交割实施程序，标志着实质性整合步入收官。",
      "信源通道：财新网 (Caixin Macro) 金融监管与资本重组深度专电（记录时间：9月6日 18:50）。"
    ],
    summary5W1H: {
      who: "中金公司、东兴证券、信达证券董事会及金融监管主管部门",
      what: "重组吸收合并重大资产重组方案获得全面通过，股票将于下周正式停牌启动交割。",
      when: "9月6日 18:50（重组权威公告）",
      where: "中国北京金融街与上海证券交易所",
      why: "加快推进资本市场深化改革，通过集约化整合优质金融牌照资产打造世界一流现代投资银行。",
      consequence: "大幅提升头部金融国企综合风控与全产业链服务能级，树立证券业供给侧优化标杆。"
    },
    summaryParagraph: "据9月6日 18:50（重组权威公告）通报，中金公司吸收合并方案落地停牌。动因是响应金融供给侧结构性改革要求打造航母券商，将根本性改变国内证券市场竞争梯队格局。"
  },

  // ================= 6. 发达国家对华举措与博弈 (china_policy) =================
  {
    id: "${hashId('china_policy_01')}",
    track: "china_policy",
    title: "商务部启动涉华贸易救济评估：依法维护高科技合法权益",
    source: "英国金融时报 (FT China)",
    sourceUrl: "https://www.ft.com",
    publishedAt: "9月7日 07:15",
    impactLevel: 1,
    oneLineTakeaway: "针对部分经济体滥用出口管制构筑非关税贸易壁垒，主管部门依法行使多边贸易救济与反歧视规则工具箱。",
    transmissionImpact: "促使涉外经贸企业加快海外合规与多中心化供应链布局，增强高新技术自主知识产权防御能力。",
    sentiment: "NEUTRAL",
    nextWatchlist: "【后续观察哨】：锁定在 欧盟委员会对华关税投票窗口与美商务部实体清单更新动态。",
    bullBearDivergence: {
      bullConsensus: "全产业链自主替代进程加速，国内大市场容量足以为半导体与高端制造提供规模化试错土壤。",
      bearDivergence: "跨国技术转移与海外投资审查加剧，出海企业的全球化供应链管理成本短期面临上升压力。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "商务部会同工业主管部门针对近期部分国家在半导体及关键原材料领域的歧视性限制展开合规评估。",
      "中方重申坚定维护以世贸组织规则为核心的多边贸易体制，坚决反对泛化国家安全概念。",
      "信源通道：英国金融时报 (FT China) 驻京经贸博弈专电（记录时间：9月7日 07:15）。"
    ],
    summary5W1H: {
      who: "中华人民共和国商务部贸易救济局、有关行业协会及涉案外贸主体",
      what: "依法启动针对不合理单边技术限制的合规审查评估，适时采取必要反制救济手段。",
      when: "9月7日 07:15（经贸热点直报）",
      where: "中国北京东长安街商务部办公区",
      why: "部分发达经济体人为设置排他性技术壁垒扰乱全球产业链，中方依法依规维护公平经贸秩序。",
      consequence: "推动双边经贸谈判重回世贸规则轨道，倒逼国内核心产业全栈自主替代加速完成闭环。"
    },
    summaryParagraph: "据9月7日 07:15（经贸热点直报）通报，商务部展开技术限制合规应对评估。起因是坚决反对外部歧视性贸易壁垒，后续传导将坚定引导国内高新技术产业链走通自主可控之路。"
  },

  // ================= 7. 全球宏观认知与深度要闻 (global_cognition) =================
  {
    id: "${hashId('global_cognition_01')}",
    track: "global_cognition",
    title: "乌拉圭因禽流感宣布卫生紧急状态：严密管控农牧检疫",
    source: "经济学人 (The Economist)",
    sourceUrl: "https://www.economist.com",
    publishedAt: "9月5日 09:22",
    impactLevel: 1,
    oneLineTakeaway: "跨大洲候鸟迁徙引发高致病病毒传播，触发跨国海关检疫壁垒迅速收紧，影响南美农牧产品跨境流转。",
    transmissionImpact: "对全球禽类供应链产生局部扰动，促使各进口口岸强化生物安全筛查，影响大宗农牧贸易预期。",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 国际货币基金组织（IMF）全球经济展望秋季报告更新。",
    bullBearDivergence: {
      bullConsensus: "乌拉圭政府果断实施网格化扑杀封锁，疫情被控制在个别沿海散养点，对主流规模化养殖影响有限。",
      bearDivergence: "若病毒向邻国大规模候鸟栖息地扩散，可能诱发更广泛的跨国贸易封锁，抬高全球蛋白供应成本。"
    },
    timeWindow: "PAST_24H",
    bulletPoints: [
      "乌拉圭农业部签署国家紧急令，全境暂停所有禽类展销活动并对重点候鸟湿地实施军警封锁。",
      "周边邻国海关相应提升南美洲农牧产品进口检疫级别，防范病毒跨境传播。",
      "信源通道：经济学人 (The Economist) 全球公共卫生与宏观农业专电（记录时间：9月5日 09:22）。"
    ],
    summary5W1H: {
      who: "乌拉圭农牧渔业部、国家卫生防疫指挥部及世界动物卫生组织",
      what: "全境正式进入卫生紧急状态，对农牧养殖与候鸟迁徙栖息地实施最严格隔离管控。",
      when: "9月5日 09:22（电讯直报）",
      where: "南美洲乌拉圭全境农牧主产区与沿海检疫港口",
      why: "散养家禽检测出高致病性禽流感毒株，为阻断向规模化肉类出口产业链渗透而升级防控。",
      consequence: "导致部分区域性农牧出口遭遇临时限制，推高跨国冷链食品海关抽检周期与检验成本。"
    },
    summaryParagraph: "据9月5日 09:22（电讯直报）通报，乌拉圭启动最高级别卫生紧急响应。核心原因在于阻断禽类疫情向全球贸易产业链扩散，体现出全球供应链面对突发生物安全冲击的即时防御。"
  }
];
`;

fs.writeFileSync(path.resolve(__dirname, '../data/seedData.ts'), fileContent, 'utf8');
console.log('Successfully upgraded data/seedData.ts with clean titles, deep takeaways, nextWatchlist, bullBearDivergence, and commodities_shipping track!');



