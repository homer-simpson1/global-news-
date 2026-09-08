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
    content: "美债收益率飙至4.37%，强劲非农把降息预期打回原形",
    oneLineTakeaway: "【宽松幻想破灭】：就业市场比华尔街预期的硬气得多，短端国债被疯狂抛售，借贷成本难以下降，指望美联储立刻大水漫灌的对冲基金只能认亏平仓。",
    transmission: "华尔街一级做市商与货币基金赚取无风险高息，重资产高杠杆中小企业背负沉重利息支出，避险资金持续从成长股倒流回短久期美债。",
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
    summaryParagraph: "据9月5日 09:45（权威电讯核验发布）消息，美联储货币政策追踪委员会及华尔街一级交易商在华盛顿与纽约金融中心传来实质动态：美国2年期国债收益率在非农数据发布后走高2.9个基点至4.37%，市场迅速削减年内激进降息押注。深层动因在于劳动力市场表现稳健打破了宽松预期，短久期国债抛压集中涌现，直接重估全市场借贷成本底座。",
    summary5W1H: {
      who: "美联储货币政策追踪委员会与华尔街一级交易商",
      what: "美国2年期国债收益率在非农数据发布后走高2.9个基点至4.37%，交易员削减激进降息押注。",
      when: "9月5日 09:45（权威电讯核验发布）",
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
    oneLineTakeaway: "【垄断者的底气】：哪怕台积电涨价 15%，英伟达和苹果也必须全盘吞下，因为全球没有第二家能代工 2nm，尖端制程已进入绝对的卖方市场。",
    transmission: "代工成本上涨不会压垮英伟达，反而会逼迫英伟达进一步调高 B200 整机售价，最终由下游自研大模型的云计算大厂买单。",
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
    summaryParagraph: "据9月7日 09:30（行业追踪快报）消息，台积电先进制程晶圆代工部门与英伟达供应链主管在亚太半导体核心三角传来实质动态：3nm及下一代2nm先进制程晶圆代工产能利用率连续两季度达到满负荷极限，主要算力原厂排单周期已延展至2026年第二季度，代工综合单价上浮15%。深层动因在于北美超大规模云厂商不计成本争抢先进制程，巩固了代工龙头的卖方市场地位。",
    summary5W1H: {
      who: "台积电先进制程业务部、英伟达及全球云服务超大规模算力采购商",
      what: "先进制程晶圆代工产能全线告急且代工综合单价上浮15%，主要算力芯片排单周期延至2026年中。",
      when: "9月7日 09:30（行业追踪快报）",
      where: "亚太半导体核心三角（中国台湾新竹科学园区、南韩京畿道及日本九州）",
      why: "超大规模云厂商密集上马生成式AI集群，引发前所未有的CoWoS先进封测与晶圆产能抢夺。",
      consequence: "代工成本上涨不会压垮英伟达，反而会逼迫英伟达调高整机售价并由下游云大厂买单。"
    }
  },
  {
    id: "flash-seed-commodities_shipping",
    tag: "大宗航运",
    track: "commodities_shipping",
    content: "多绕好望角两周吞掉一成运力，红海不停火集运船东继续数钱",
    oneLineTakeaway: "【航程拉长吞噬运力】：多绕行好望角 14 天，直接吃掉了全球十分之一的可用集装箱船；只要红海地缘不停火，船东就能继续躺着数钱。",
    transmission: "集运班轮巨头手握绝对订舱议价权大赚暴利，亚欧跨国出口外贸企业硬抗翻倍运费，货主资金正被高额订舱押金与滞港费深度占用。",
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
    summaryParagraph: "据9月7日 10:15（大宗市场权威追踪）消息，全球主流班轮公司与大宗商品交易商在欧洲鹿特丹港与红海航道传来实质动态：集装箱海运欧线即期运价在红海绕航常态化下大幅跳升，伦铜显性库存降至近三年低位。深层动因在于船舶绕行非洲好望角导致单程拉长两周，物理性吃掉了全球一成运力，船东议价权完全主导市场。",
    summary5W1H: {
      who: "马士基、达飞等全球班轮巨头与大宗商品现货交易商",
      what: "红海商船绕行好望角常态化，欧线集装箱海运即期运价持续大涨，可用运力吃紧。",
      when: "9月7日 10:15（大宗市场权威追踪）",
      where: "欧洲鹿特丹港、红海曼德海峡及伦敦金属交易中心",
      why: "地缘冲突迫使货轮绕行好望角消耗大量有效运力，叠加制造业旺季备料补库需求。",
      consequence: "船东凭借舱位优势大赚超额利润，外贸出口企业承担翻倍海运与物流成本。"
    }
  },
  {
    id: "flash-seed-war-conflict",
    tag: "战局防务",
    track: "war_conflict",
    content: "弹药库存涉嫌内部泄密！五角大楼急令数十名高级军官测谎",
    oneLineTakeaway: "【底牌外泄引发恐慌】：关键导弹库存被摸底直接瓦解了前线威慑力，军方高层不得不撕破脸对内部亲信测谎，整个防务供应链风声鹤唳。",
    transmission: "网络安全与保密合规承包商突击斩获紧急审查大单，传统军火外包商因权限冻结被迫停滞交付，军费预算加速流向涉密审计防线。",
    impactLevel: 1,
    time: "9月7日 08:54",
    source: "五角大楼官方通报 (DoD)",
    sourceUrl: "https://www.defense.gov",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 联合国安理会闭门磋商窗口及霍尔木兹海峡/红海商船通行量指数。",
    bullBearDivergence: {
      bullConsensus: "内部安全整肃将直接催生军工数据安全、保密通信与零信任防御系统的额外国防预算倾斜。",
      bearDivergence: "严格的合规审计与人事测谎可能导致部分关键战术导弹与无人系统的常规采购交付阶段性延宕。"
    },
    summaryParagraph: "据9月7日 08:54（军情核验播报）消息，美国国防部（五角大楼）反间谍部门在华盛顿总部及各战区联合作战司令部传来实质动态：五角大楼对美军战略武器库存与战备调配涉密数据外泄展开刑事调查，要求数十名关键指挥军官接受多导测谎。深层动因在于前沿防务战备技术底牌遭未授权外泄触及安全红线，导致五角大楼紧急冻结外部准入权限并彻查军工外包商。",
    summary5W1H: {
      who: "美国国防部（五角大楼）、联邦调查局（FBI）反间谍部门及涉及高级军官",
      what: "五角大楼对美军战略武器库存核心涉密数据外泄展开刑事调查，要求多名关键军官接受测谎。",
      when: "9月7日 08:54（军情核验播报）",
      where: "美国华盛顿五角大楼总部及驻外战区联合作战司令部",
      why: "重大前沿防务战备技术与战备库存数据存在非授权外泄风险，五角大楼紧急排查情报隐患。",
      consequence: "网络安全合规承包商斩获大额审计订单，部分常规武器外包交付面临流程性冻结。"
    }
  },
  {
    id: "flash-seed-china-domestic",
    tag: "国内治理",
    track: "china_domestic",
    content: "受贿逾九千万元！证监会原副主席王建军一审被判处无期徒刑",
    oneLineTakeaway: "【刮骨疗毒动真格】：司法惩治刺向资本市场发审与寻租深水区，任何指望靠特权变现的利益链被连根拔起，合规红线不再留任何法外死角。",
    transmission: "违法涉案人员与灰色寻租机构资产遭司法查封冻结，内控严谨的合规金融机构承接被挤出的优质客户，违规操纵热钱仓皇平仓离场。",
    impactLevel: 1,
    time: "9月7日 15:20",
    source: "财新网 (Caixin)",
    sourceUrl: "https://finance.caixin.com",
    sentiment: "BEARISH",
    spilloverCriterion: "监管铁拳与准入颠覆",
    nextWatchlist: "【后续观察哨】：锁定在 证监会发审流程追责细则发布与涉案上市中介机构合规核查进展。",
    bullBearDivergence: {
      bullConsensus: "强力刮骨疗毒彻底肃清资本市场制度寻租土壤，为中长期注册制走深走实筑牢公信力底座。",
      bearDivergence: "存量涉案企业和保荐机构面临穿透式追责，短期部分拟IPO项目申报与审核节奏可能收紧。"
    },
    summaryParagraph: "据9月7日 15:20（司法权威通报）消息，中国证监会原副主席王建军受贿案在山东省青岛市中级人民法院一审公开宣判，认定受贿金额高达9340万元，依法判处无期徒刑并剥夺政治权利终身。深层动因在于国家以零容忍态度穿透式打击金融监管腐败，清算滥用审批特权谋取私利的违法行径，重塑证券发行与监管红线。",
    summary5W1H: {
      who: "山东省青岛市中级人民法院与中国证监会原副主席王建军",
      what: "王建军因受贿9340万元一审被判处无期徒刑，剥夺政治权利终身并没收个人全部财产。",
      when: "9月7日 15:20（司法权威通报）",
      where: "中国山东省青岛市中级人民法院法庭",
      why: "利用在证券监管部门职权为多名不法中介与申报企业在股票发行审批、监管审查中谋利收受巨额贿赂。",
      consequence: "向资本市场传递穿透式严监管决绝信号，涉案灰色代理机构被全面清退并追责。"
    }
  },
  {
    id: "flash-seed-global-cognition",
    tag: "全球战略",
    track: "global_cognition",
    content: "禽流感逼近南美农牧圈！乌拉圭宣布紧急状态，多国拉响警报",
    oneLineTakeaway: "【检疫铁幕瞬间落下】：高致病禽流感一旦蔓延到周边巴西养殖带，全球鸡肉供给就得断档，各国海关宁可错杀也不敢放行南美禽肉。",
    transmission: "欧美本土替代蛋白与大型家禽养殖巨头坐享短期提价红利，南美出口型牧场承受封关退运损失，国际对冲基金正借机炒作农畜产品期货。",
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
    summaryParagraph: "据9月5日 09:22（电讯直报）消息，乌拉圭农牧渔业部与国家卫生防疫局在南美主要农牧产区传来实质动态：乌拉圭境内多处农场发现高致病性禽流感，政府签署紧急法令宣布全境进入卫生紧急状态。深层动因在于阻断候鸟迁徙引发的病毒向周边巴西养殖带渗透，邻国海关已紧急提升肉类检疫隔离等级，波及南美大宗农牧产品跨境出口。",
    summary5W1H: {
      who: "乌拉圭农牧渔业部、国家卫生防疫局及跨国海关检疫机构",
      what: "乌拉圭境内发现高致病性禽流感，政府签署法令宣布全国进入卫生紧急状态。",
      when: "9月5日 09:22（电讯直报）",
      where: "南美洲乌拉圭全境农牧主产区及沿海主要检疫口岸",
      why: "候鸟迁徙路径扩散引发高致病性禽类病毒交叉感染，为阻断跨境养殖产业链传播而启动最高响应。",
      consequence: "欧美替代养殖企业坐享提价红利，南美出口牧场承受退运损失，期货对冲基金顺势炒作。"
    }
  }
];


export { GYIRONG_PORT_DISASTER_TRACKER } from './disasterData';
export { SEED_NEWS_ITEMS } from './seedNews';
