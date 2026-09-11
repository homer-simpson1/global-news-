import { FlashBrief, MarketQuote, NewsItem, TrackMetadata, DisasterTracker } from '@/lib/types';

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
  china_macro: {
    id: 'china_macro',
    title: '中国宏观数据与经济景气',
    tagline: 'CPI/PPI通胀 · PMI景气 · GDP增速 · 社会消费与工业产出',
    iconName: 'BarChart2',
    badgeColor: 'border-orange-500 text-orange-700 bg-orange-50',
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
  { symbol: '美债10年期', name: '美国10年期国债收益率', price: '4.9483%', change: '-0.37%', isUp: false, category: 'BOND_FX' },
  { symbol: '日经225', name: '日本日经225指数', price: '65,269.33', change: '-1.70%', isUp: false, category: 'ASIA' },
  { symbol: '恒生指数', name: '香港恒生指数', price: '25,413.12', change: '-0.93%', isUp: false, category: 'ASIA' },
  { symbol: 'WTI美油', name: 'WTI原油连续', price: '$101.31/桶', change: '-1.14%', isUp: false, category: 'BOND_FX' },
  { symbol: '布伦特原油', name: '布伦特原油连续', price: '$105.52/桶', change: '-1.80%', isUp: false, category: 'BOND_FX' },
  { symbol: '国际黄金', name: 'COMEX期金', price: '$4,450.80/盎司', change: '-0.49%', isUp: false, category: 'BOND_FX' },
  { symbol: '美元兑日元', name: '美元 / 日元', price: '154.23', change: '-0.08%', isUp: false, category: 'BOND_FX' },
  { symbol: '离岸人民币', name: '美元 / 离岸人民币', price: '7.2365', change: '-0.04%', isUp: false, category: 'BOND_FX' },
];

export const SEED_FLASH_BRIEFS: FlashBrief[] = [
  {
    id: "flash-seed-us-macro",
    tag: "美联储降息",
    track: "us_macro",
    content: "美债收益率攀升至4.37%，强劲非农推迟美联储降息时间表",
    oneLineTakeaway: "【降息预期时点后移】：8月非农就业展现抗跌韧性，短久期美债遭遇承压抛售，借贷成本高位运行，对冲基金逐步收窄激进宽松押注。",
    transmission: "① 强劲非农数据推迟降息时点预期，两年期美债收益率反弹至4.37% ➔ ② 一级交易商与货币市场基金收益底座抬高，高杠杆企业利息负担加重 ➔ ③ 跨资产配置资金自高估值成长股流向短久期国债。",
    impactLevel: 1,
    time: "9月9日 09:45",
    source: "彭博全球宏观 (Bloomberg)",
    sourceUrl: "https://www.bloomberg.com",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 9月11日 20:30 美国 8 月 CPI 数据公布及 9 月 FOMC 议息决议降息幅度。",
    bullBearDivergence: {
      bullConsensus: "非农就业保持韧性验证美国经济软着陆路径，企业盈利基本面仍有坚实支撑。",
      bearDivergence: "紧缩周期尾声利率居高难下，若通胀反复可能推迟降息窗口，压制高估值科技资产。"
    },
    summaryParagraph: "据9月9日 09:45彭博全球宏观报道，美国2年期国债收益率在非农数据发布后走高2.9个基点至4.37%。信源表明，该事项起因于8月非农新增就业保持稳健抑制了美联储急迫降息预期。直接影响方面，重塑全市场借贷成本底座。",
    summary5W1H: {
      who: "美联储货币政策追踪委员会与华尔街一级交易商",
      what: "美国2年期国债收益率在非农数据发布后走高2.9个基点至4.37%，交易员削减激进降息押注。",
      when: "9月9日 09:45（权威电讯核验发布）",
      where: "美国华盛顿特区及纽约华尔街全球金融交易中心",
      why: "最新劳动力市场表现稳健抑制了美联储急迫宽松预期，导致国债抛压再现。",
      consequence: "重构美债收益率曲线与全市场借贷成本底座，避险资金流向短久期国债。"
    }
  },
  {
    id: "flash-seed-apac-tech",
    tag: "算力与模型",
    track: "apac_tech",
    content: "台积电2nm传涨价15%，苹果英伟达排队抢单锁产能",
    oneLineTakeaway: "【先进制程定价权确认】：供应链消息显示台积电拟针对2nm先进制程代工报价上调10%~15%，苹果与英伟达为锁定首批排产份额已全额锁定产能配额。",
    transmission: "① 先进制程晶圆代工报价上调直接抬高先锋芯片设计商制造成本 ➔ ② 核心芯片原厂通过提高次世代整机与服务器售价将成本向下游转嫁 ➔ ③ 云计算服务商资本支出承压并加速论证自研芯片替代节点。",
    impactLevel: 1,
    time: "9月9日 09:30",
    source: "日经亚洲 (Nikkei Asia)",
    sourceUrl: "https://asia.nikkei.com",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 下周英伟达全球开发者与台积电投资人法说会资本开支指引。",
    bullBearDivergence: {
      bullConsensus: "AI大模型与云计算厂商资本开支依旧强劲，先进制程订单能见度直通2026年，利好设备与代工龙头。",
      bearDivergence: "下游数据中心电力配电与散热瓶颈逐步显现，服务器硬件实际落地节奏可能存在结构性时滞。"
    },
    summaryParagraph: "据9月9日 09:30日经亚洲报道，台积电3nm及下一代2nm先进制程晶圆代工产能利用率达满负荷极限，代工综合单价传上浮15%。信源表明，该事项起因于北美头部云厂商密集采购生成式AI算力芯片。直接影响方面，推升次世代AI服务器整机物料成本。",
    summary5W1H: {
      who: "台积电先进制程业务部、英伟达及全球云服务超大规模算力采购商",
      what: "先进制程晶圆代工产能全线告急且代工综合单价上浮15%，主要算力芯片排单周期延至2026年中。",
      when: "9月9日 09:30（行业追踪快报）",
      where: "亚太半导体核心三角（中国台湾新竹科学园区、南韩京畿道及日本九州）",
      why: "超大规模云厂商密集上马生成式AI集群，引发前所未有的CoWoS先进封测与晶圆产能抢夺。",
      consequence: "代工成本上涨推高次世代服务器整机售价，下游云计算大厂承担增量采购物料成本。"
    }
  },
  {
    id: "flash-seed-commodities_shipping",
    tag: "大宗航运",
    track: "commodities_shipping",
    content: "好望角绕航使航期延长约两周，集运有效运力供给持续受约束",
    oneLineTakeaway: "【航程拉长约束有效运力供给】：商船绕行非洲好望角使亚欧航线单程航期延长10至14天，有效消耗全球活跃集装箱船队可用运力，对即期运价形成底部支撑。",
    transmission: "① 绕航耗时延长直接吸收集装箱船队富余运力 ➔ ② 班轮航运公司维持欧线即期运价与燃油绕航附加费水平 ➔ ③ 跨国进出口货主承受供应链周转周期拉长与物流履约成本。",
    impactLevel: 1,
    time: "9月9日 10:15",
    source: "标普全球商品 (S&P Commodities)",
    sourceUrl: "https://www.spglobal.com/commodityinsights",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 下周 OPEC+ 产量政策评估及集运欧线即期订舱运价指数（SCFI）波动。",
    bullBearDivergence: {
      bullConsensus: "绿色能源转型与AI数据中心电网改造拉动铜刚性需求，海运绕航长期化推升有效运力溢价。",
      bearDivergence: "高利率对欧美地产传统制造业形成抑制，若需求端承压可能抑制金属现货提货意愿。"
    },
    summaryParagraph: "据9月9日 10:15标普全球商品报道，商船绕行非洲好望角使亚欧航线单程航期延长约两周，欧线集装箱海运即期运价维持高位。信源表明，该事项起因于红海地缘风险致使船舶改道消耗可用运力。直接影响方面，跨国进出口企业承担周转周期拉长与运费上涨成本。",
    summary5W1H: {
      who: "马士基、达飞等全球班轮巨头与大宗商品现货交易商",
      what: "红海商船绕行好望角常态化，欧线集装箱海运即期运价持续大涨，可用运力吃紧。",
      when: "9月9日 10:15（大宗市场权威追踪）",
      where: "欧洲鹿特丹港、红海曼德海峡及伦敦金属交易中心",
      why: "地缘冲突迫使货轮绕行好望角消耗大量有效运力，叠加制造业旺季备料补库需求。",
      consequence: "班轮公司维持即期运价溢价，外贸出口企业承担物流周转周期拉长成本。"
    }
  },
  {
    id: "flash-seed-war-conflict",
    tag: "战局防务",
    track: "war_conflict",
    content: "涉密关键信息外溢调查展开，防务机构启动高等级内部安全审计",
    oneLineTakeaway: "【涉密安全审计与供应链合规】：涉密关键信息外溢促使防务机构启动最高等级内部安全审查，涉密合规与信息安全采购优先级提升。",
    transmission: "① 涉密信息外泄直接触发防务机构反间谍测谎与权限冻结 ➔ ② 涉密网络安全与供应链合规服务商紧急承接审计排查大单 ➔ ③ 外部防务承包商资质审核周期延长，高精尖采购交付流程趋严。",
    impactLevel: 1,
    time: "9月9日 08:54",
    source: "五角大楼官方通报 (DoD)",
    sourceUrl: "https://www.defense.gov",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 联合国安理会闭门磋商窗口及霍尔木兹海峡/红海商船通行量指数。",
    bullBearDivergence: {
      bullConsensus: "内部安全整肃将直接催生军工数据安全、保密通信与零信任防御系统的额外国防预算倾斜。",
      bearDivergence: "严格的合规审计与人事测谎可能导致部分关键战术导弹与无人系统的常规采购交付阶段性延宕。"
    },
    summaryParagraph: "据9月9日 08:54五角大楼官方通报，美防务机构就敏感战备库存与装备数据外泄启动反间谍调查，多名指挥军官接受技术测谎。信源表明，该事项起因于关键涉密战备技术存在未授权外流隐患。直接影响方面，外部防务外包与人员准入审查全面收紧。",
    summary5W1H: {
      who: "美国国防部（五角大楼）、联邦调查局（FBI）反间谍部门及涉及高级军官",
      what: "五角大楼对美军战略武器库存核心涉密数据外泄展开刑事调查，要求多名关键军官接受测谎。",
      when: "9月9日 08:54（军情核验播报）",
      where: "美国华盛顿五角大楼总部及驻外战区联合作战司令部",
      why: "重大前沿防务战备技术与战备库存数据存在非授权外泄风险，五角大楼紧急排查情报隐患。",
      consequence: "网络安全合规承包商斩获大额审计订单，部分常规武器外包交付面临流程性冻结。"
    }
  },
  {
    id: "flash-seed-china-domestic",
    tag: "国内治理",
    track: "china_domestic",
    content: "证监会原副主席王建军受贿逾九千万元，一审被判处无期徒刑",
    oneLineTakeaway: "【司法惩处与监管法治化底盘夯实】：司法机关依法严厉惩处证券发行监管寻租腐败行为，体现资本市场从严监管与消除制度寻租空间的法治决心。",
    transmission: "① 司法严惩对资本市场发审违规寻租行为形成强大制度震慑 ➔ ② 金融机构自查自纠并提升发行承销与合规保荐内控标准 ➔ ③ 市场公信力与投资者对于公平透明制度环境的长期信心得到修复。",
    impactLevel: 1,
    time: "9月9日 15:20",
    source: "财新网 (Caixin)",
    sourceUrl: "https://finance.caixin.com",
    sentiment: "BEARISH",
    spilloverCriterion: "监管铁拳与准入颠覆",
    nextWatchlist: "【后续观察哨】：锁定在 证监会发审流程追责细则发布与涉案上市中介机构合规核查进展。",
    bullBearDivergence: {
      bullConsensus: "强力司法惩治彻底肃清资本市场制度寻租土壤，为中长期注册制走深走实筑牢公信力底座。",
      bearDivergence: "存量涉案企业和保荐机构面临穿透式追责，短期部分拟IPO项目申报与审核节奏可能收紧。"
    },
    summaryParagraph: "据9月9日 15:20司法通报，中国证监会原副主席王建军受贿案在青岛市中级人民法院一审公开宣判，认定受贿金额9340万元，依法判处无期徒刑。信源表明，该事项起因于依法惩治利用发行监管职权寻租腐败行为。直接影响方面，从制度层面压实保荐机构看门人责任。",
    summary5W1H: {
      who: "山东省青岛市中级人民法院与中国证监会原副主席王建军",
      what: "王建军因受贿9340万元一审被判处无期徒刑，剥夺政治权利终身并没收个人全部财产。",
      when: "9月9日 15:20（司法权威通报）",
      where: "中国山东省青岛市中级人民法院法庭",
      why: "利用在证券监管部门职权为多名不法中介与申报企业在股票发行审批、监管审查中谋利收受巨额贿赂。",
      consequence: "向资本市场传递穿透式严监管决绝信号，涉案灰色代理机构被全面清退并追责。"
    }
  },
  {
    id: "flash-seed-global-cognition",
    tag: "全球战略",
    track: "global_cognition",
    content: "禽流感逼近南美农牧产业带，乌拉圭进入国家卫生紧急状态且邻国收紧检疫",
    oneLineTakeaway: "【农业生物安全防控与检疫拦截收紧】：乌拉圭因高致病性禽流感疫情启动国家卫生紧急状态，南美主要农牧出口国升级边境检疫，防止疫情扩散波及核心养殖带。",
    transmission: "① 疫情通报直接引发涉事国禽肉出口临时封关与边境检疫拦截 ➔ ② 具备生物安全隔离认证的非疫区规模养殖企业承接替代性供应配额 ➔ ③ 终端消费端蛋白原料采购成本阶段性上行。",
    impactLevel: 1,
    time: "9月9日 09:22",
    source: "路透全球要闻 (Reuters)",
    sourceUrl: "https://www.reuters.com",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 世界动物卫生组织（WOAH）全球禽流感跨境传播监测月度通报。",
    bullBearDivergence: {
      bullConsensus: "乌拉圭已建立网格化检疫封锁线，散养禽类疫情迅速阻断，对全球大豆肉类贸易长期影响可控。",
      bearDivergence: "若疫情跨界外溢至邻国巴西或阿根廷等全球肉类大国，可能引发全球农牧产品供应链价格异动。"
    },
    summaryParagraph: "据9月9日 09:22路透全球要闻报道，乌拉圭境内散养禽类发现高致病性禽流感，政府签署紧急法令宣布全境进入卫生紧急状态。信源表明，该事项起因于防范病毒向周边南美规模化农牧养殖带扩散。直接影响方面，引发部分区域性农产品临时封关检验。",
    summary5W1H: {
      who: "乌拉圭农牧渔业部、国家卫生防疫局及跨国海关检疫机构",
      what: "乌拉圭境内发现高致病性禽流感，政府签署法令宣布全国进入卫生紧急状态。",
      when: "9月9日 09:22（电讯直报）",
      where: "南美洲乌拉圭全境农牧主产区及沿海主要检疫口岸",
      why: "候鸟迁徙路径扩散引发高致病性禽类病毒交叉感染，为阻断跨境养殖产业链传播而启动最高响应。",
      consequence: "欧美替代养殖企业坐享提价红利，南美出口牧场承受退运损失，期货对冲基金顺势炒作。"
    }
  }
];


export { GYIRONG_PORT_DISASTER_TRACKER } from './disasterData';
export { SEED_NEWS_ITEMS } from './seedNews';
