import { FlashBrief, MarketQuote, NewsItem, TrackMetadata } from '@/lib/types';

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

export const SEED_NEWS_ITEMS: NewsItem[] = [
  // ================= 1. 美股与美元宏观 (us_macro) =================
  {
    id: "GID-446F5FD5",
    track: "us_macro",
    title: "美债收益率飙至4.37%，强劲非农把降息预期打回原形",
    source: "彭博全球宏观 (Bloomberg)",
    sourceUrl: "https://www.bloomberg.com",
    publishedAt: "9月5日 06:10",
    impactLevel: 1,
    oneLineTakeaway: "【宽松幻想破灭】：就业市场比华尔街预期的硬气得多，短端国债被疯狂抛售，借贷成本难以下降，指望美联储立刻大水漫灌的对冲基金只能认亏平仓。",
    transmissionImpact: "华尔街一级做市商与货币基金赚取无风险高息，重资产高杠杆中小企业背负沉重利息支出，避险资金持续从成长股倒流回短久期美债。",
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
      what: "两年期美债收益率在非农发布后上行2.9个基点报4.37%，基准借贷利率全线上移。",
      when: "9月5日 06:10（电讯直发）",
      where: "美国华尔街金融交易中心与华盛顿特区",
      why: "最新劳动力市场表现稳健抑制了美联储急迫宽松预期，导致长端国债抛压再现。",
      consequence: "重塑美债收益率曲线与全市场借贷成本底座，避险资金流向短久期国债。"
    },
    summaryParagraph: "据9月5日 06:10（电讯直发）消息，美联储货币政策委员会及华尔街交易商证实：美债收益率全线上浮，两年期国债收益率升至4.37%。起因是非农就业展现强劲抗跌性，削减了快速降息预期，后续传导将直接重塑成长股借贷成本底线。"
  },
  {
    id: "GID-446F5FD6",
    track: "us_macro",
    title: "美股三大期指尾盘全线下挫，道指大跌但科技巨头扛住跌幅",
    source: "标普全球 (S&P Global)",
    sourceUrl: "https://www.spglobal.com",
    publishedAt: "9月5日 05:49",
    impactLevel: 2,
    oneLineTakeaway: "【抱团巨头取暖】：高利率打趴了依赖银行贷款的传统制造业，但手握千亿现金的科技巨头靠吃高额利息就能活得很滋润，资金只能死抱大厂避险。",
    transmissionImpact: "高负债周期股与区域性商业银行承担资金抽血阵痛，苹果英伟达等现金奶牛龙头被动承接避险买盘，杠杆多头正在加速撤离周期板块。",
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
    summaryParagraph: "据9月5日 05:49（电讯直发）消息，美股三大期指尾盘呈现分化回调。主要是宏观资金借贷成本上扬令周期板块承压，科技成长龙头显现抗跌韧性，反映出市场对资金成本重估的微观再平衡。"
  },
  {
    id: "GID-446F5FD7",
    track: "us_macro",
    title: "加密股周涨12%后突然哑火，高位获利盘抢跑引发主力观望",
    source: "彭博全球宏观 (Bloomberg)",
    sourceUrl: "https://www.bloomberg.com",
    publishedAt: "9月5日 05:44",
    impactLevel: 2,
    oneLineTakeaway: "【短线客落袋为安】：连续暴涨后杠杆已经拉满，非农数据一公布降息预期推迟，投机热钱立刻抢着把浮盈套现，谁也不想在高位给别人站岗。",
    transmissionImpact: "早期低成本埋伏的海外量化大户大举出货锁定暴利，后知后觉追高的高杠杆散户惨遭流动性锁死，增量热钱全在场外观望不敢轻易接盘。",
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
    summaryParagraph: "据9月5日 05:44（电讯直发）消息，美股加密关联资产在周涨12%后出现缩量休整。原因是宏观利率走势使得前期博弈降息的投机资金落袋为安，市场关注点转向后续真实流动性增量。"
  },
  {
    id: "GID-446F5FD8",
    track: "us_macro",
    title: "标普500纳入三家新贵，数千亿被动ETF被迫市价扫货",
    source: "标普全球 (S&P Global)",
    sourceUrl: "https://www.spglobal.com",
    publishedAt: "9月5日 05:16",
    impactLevel: 2,
    oneLineTakeaway: "【机械规则送钱】：被动指数基金没有选股自由，只要名单公布就必须无脑买入，入选新贵哪怕基本面一般也能平白无故吃下一大波流动性红利。",
    transmissionImpact: "提前潜伏调仓名单的跨国对冲基金坐收抬轿暴利，被剔除的失势老股惨遭被动基金无情砸盘，散户跟风买入则极易在生效日高位接盘。",
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
    summaryParagraph: "据9月5日 05:16（电讯直发）消息，标普道琼斯指数调整落地。因美纳等三家企业入选标普500，直接驱动被动指数基金的硬性建仓需求，为相关标的注入流动性红利。"
  },

  // ================= 2. 算力硬件与前沿模型 (apac_tech) =================
  {
    id: "GID-2B88669C",
    track: "apac_tech",
    title: "台积电2nm传涨价15%，苹果英伟达排队抢单锁产能",
    source: "日经亚洲 (Nikkei Asia)",
    sourceUrl: "https://asia.nikkei.com",
    publishedAt: "9月7日 09:30",
    impactLevel: 1,
    oneLineTakeaway: "【垄断者的底气】：哪怕台积电涨价 15%，英伟达和苹果也必须全盘吞下，因为全球没有第二家能代工 2nm，尖端制程已进入绝对的卖方市场。",
    transmissionImpact: "代工成本上涨不会压垮英伟达，反而会逼迫英伟达进一步调高 B200 整机售价，最终由下游自研大模型的云计算大厂买单。",
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
      consequence: "代工成本上涨不会压垮英伟达，反而会逼迫英伟达调高整机售价并由下游云大厂买单。"
    },
    summaryParagraph: "据9月7日 09:30（行业追踪快报）消息，台积电先进制程晶圆代工调价预期落地。核心动因在于先进制程的垄断性技术壁垒与算力采购刚性，强化了龙头半导体供应链的利润扩张预期。"
  },
  {
    id: "GID-2B88669D",
    track: "apac_tech",
    title: "大模型学会做题前先打草稿！OpenAI新架构纠错干翻人类",
    source: "路透科技 (Reuters Tech)",
    sourceUrl: "https://www.reuters.com/technology",
    publishedAt: "9月7日 04:15",
    impactLevel: 1,
    oneLineTakeaway: "【给思考时间买单】：光堆参数已经摸到天花板，现在模型通过自我多轮推演与纠错消除幻觉，企业终于敢把核心业务系统交给AI智能体代管。",
    transmissionImpact: "掌握最强推理算法的闭源大厂开始向企业收取高昂API溢价，缺乏自研能力的包装型套壳软件加速死掉，算力采购全面倾斜向推理加速卡。",
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
    summaryParagraph: "据9月7日 04:15（技术突发专电）消息，OpenAI发布具备自主思维推理的新一代模型。核心本质是解决AI幻觉难题，将大模型商业价值从通用聊天升维至专业场景闭环作业。"
  },
  {
    id: "GID-2B88669E",
    track: "apac_tech",
    title: "买显卡通不上电！变压器排队3年，北美AI机房卡在电网",
    source: "彭博科技 (Bloomberg Tech)",
    sourceUrl: "https://www.bloomberg.com/technology",
    publishedAt: "9月6日 21:30",
    impactLevel: 2,
    oneLineTakeaway: "【机房被电网卡脖子】：芯片几个月就能装满机柜，但高压变压器订货要等整整三年，谁能拿到电厂直供专线，谁才能真正把万卡算力点亮变现。",
    transmissionImpact: "重型变压器厂商和独立核电运营商成了最大赢家、订单排到十年后，买了昂贵GPU却通不上电的初创算力公司在白白空转烧钱。",
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
    summaryParagraph: "据9月6日 21:30（行业调查专电）消息，北美算力基建受阻于电力供给短缺。本质是数字算力扩张与物理能源基建周期的严重错配，电网配给瓶颈成为制约算力释放的关键物理锚点。"
  },

  // ================= 3. 大宗商品与能源航运 (commodities_shipping) =================
  {
    id: "GID-7C683C7E",
    track: "commodities_shipping",
    title: "仓库见底还要加价提货！伦铜现货大幅升水，电网抢光库存",
    source: "标普全球商品 (S&P Commodities)",
    sourceUrl: "https://www.spglobal.com/commodityinsights",
    publishedAt: "9月7日 10:15",
    impactLevel: 1,
    oneLineTakeaway: "【一铜难求现形记】：全球电网翻新加上新能源车抢铜，仓库里的精炼铜库存已经被掏空，下游加工厂就算明知涨价也只能硬着头皮加价现款提货。",
    transmissionImpact: "拥有优质铜矿资源的跨国矿业巨头大发横财，毫无议价权的下游中小线缆加工厂被原料暴涨挤压到濒临亏损，产业资金加速囤货惜售。",
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
    summaryParagraph: "据9月7日 10:15（大宗市场权威追踪）消息，伦铜市场呈现现货升水与库存低位并存态势。核心驱动是新能源电气化改造与秋季微观开工复苏，低库存特征放大了工业金属向上的价格弹性。"
  },
  {
    id: "GID-7C683C7F",
    track: "commodities_shipping",
    title: "多绕好望角两周吞掉一成运力，红海不停火集运船东继续数钱",
    source: "劳氏日报 (Lloyd's List)",
    sourceUrl: "https://www.lloydslist.com",
    publishedAt: "9月7日 08:20",
    impactLevel: 1,
    oneLineTakeaway: "【航程拉长吞噬运力】：多绕行好望角 14 天，直接吃掉了全球十分之一的可用集装箱船；只要红海地缘不停火，船东就能继续躺着数钱。",
    transmissionImpact: "集运班轮巨头手握绝对订舱议价权大赚暴利，亚欧跨国出口外贸企业硬抗翻倍运费，货主资金正被高额订舱押金与滞港费深度占用。",
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
    summaryParagraph: "据9月7日 08:20（海运实时专电）消息，欧线海运集装箱运价延续上涨行情。本质是红海地缘政治对抗引发全球航道物理性重构，航程大幅拉长形成了供给侧的硬性有效运力紧缺。"
  },
  {
    id: "GID-7C683C80",
    track: "commodities_shipping",
    title: "谁也别想多卖油！OPEC+继续减产，死守90美元油价钱袋",
    source: "普氏能源资讯 (S&P Global Energy)",
    sourceUrl: "https://www.spglobal.com/commodityinsights",
    publishedAt: "9月6日 19:40",
    impactLevel: 2,
    oneLineTakeaway: "【掐死龙头保高价】：面对欧美疲软需求和美国页岩油增产，中东产油国坚决不降价甩卖，宁可把产量龙头拧紧也要保住国内财政预算的平衡线。",
    transmissionImpact: "沙特等低开采成本产油国继续靠高油价支撑国内超级工程，欧美炼油厂与航空公司承担昂贵航煤成本，游资正在期货盘面上反复围剿做空力量。",
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
    summaryParagraph: "据9月6日 19:40（能源决策动态）消息，OPEC+推进自愿减产延期磋商。核心起因是产油国联盟通过灵活供应调节锚定全球油价底线，在多空分歧中为全球能源市场提供确定性支撑。"
  },

  // ================= 4. 俄乌局势与美伊中东战局 (war_conflict) =================
  {
    id: "GID-0EACE2B7",
    track: "war_conflict",
    title: "弹药库存涉嫌内部泄密！五角大楼急令数十名高级军官测谎",
    source: "五角大楼官方通报 (DoD)",
    sourceUrl: "https://www.defense.gov",
    publishedAt: "9月7日 08:54",
    impactLevel: 1,
    oneLineTakeaway: "【底牌外泄引发恐慌】：关键导弹库存被摸底直接瓦解了前线威慑力，军方高层不得不撕破脸对内部亲信测谎，整个防务供应链风声鹤唳。",
    transmissionImpact: "网络安全与保密合规承包商突击斩获紧急审查大单，传统军火外包商因权限冻结被迫停滞交付，军费预算加速流向涉密审计防线。",
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
    summaryParagraph: "据9月7日 08:54（军情核验播报）消息，五角大楼展开战备库存泄密调查。起因是核心涉密数据外流触碰国防安全红线，事件带来的后果是美军外包采购与人员审查全面趋严。"
  },
  {
    id: "GID-0EACE2B8",
    track: "war_conflict",
    title: "战机呼啸导弹对轰！以军猛烈空袭黎南，中东停火谈判谈崩",
    source: "半岛电视台 (Al Jazeera)",
    sourceUrl: "https://www.aljazeera.com",
    publishedAt: "9月5日 03:20",
    impactLevel: 1,
    oneLineTakeaway: "【停火谈判沦为掩护】：交火双方都在用炸弹争取以后的实控线缓冲区，谁都不肯在战场处于下风时签协议，所谓的和平斡旋不过是各方争取喘息的缓兵之计。",
    transmissionImpact: "跨国军工复合体订单爆满股价逆市冲高，地中海东岸商业航运保费翻倍飙升，大量国际中东避险资金弃股买金、推升现货黄金避险溢价。",
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
    summaryParagraph: "据9月5日 03:20（战地实时直击）消息，以军在黎巴嫩南部展开空袭反击。动因是前线双方试图通过有限军事行动确立安全纵深优势，导致区域地缘风险溢价难以降温。"
  },

  // ================= 5. 中国国内要闻与社会治理 (china_domestic) =================
  {
    id: "GID-394CB5DA",
    track: "china_domestic",
    title: "受贿逾九千万元！证监会原副主席王建军一审被判处无期徒刑",
    source: "财新网 (Caixin)",
    sourceUrl: "https://finance.caixin.com",
    publishedAt: "9月7日 15:20",
    impactLevel: 1,
    spilloverCriterion: "监管铁拳与准入颠覆",
    oneLineTakeaway: "【刮骨疗毒动真格】：司法惩治刺向资本市场发审与寻租深水区，任何指望靠特权变现的利益链被连根拔起，合规红线不再留任何法外死角。",
    transmissionImpact: "违法涉案人员与灰色寻租机构资产遭司法查封冻结，内控严谨的合规金融机构承接被挤出的优质客户，违规操纵热钱仓皇平仓离场。",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 证监会发审流程追责细则发布与涉案上市中介机构合规核查进展。",
    bullBearDivergence: {
      bullConsensus: "强力刮骨疗毒彻底肃清资本市场制度寻租土壤，为中长期注册制走深走实筑牢公信力底座。",
      bearDivergence: "存量涉案企业和保荐机构面临穿透式追责，短期部分拟IPO项目申报与审核节奏可能收紧。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "山东青岛中院认定王建军受贿金额达9340万元，依法判处无期徒刑并没收个人全部财产。",
      "司法通报查明其在股票发行审批、行业牌照核准等环节直接插手干预并大肆收受贿赂。",
      "信源通道：财新网 (Caixin) 司法反腐深度专电（记录时间：9月7日 15:20）。"
    ],
    summary5W1H: {
      who: "青岛市中级人民法院与证监会原副主席王建军",
      what: "王建军受贿9340万元一审被判处无期徒刑，剥夺政治权利终身并追缴全部违法所得。",
      when: "9月7日 15:20（司法权威通报）",
      where: "中国山东省青岛市中级人民法院",
      why: "长期在证券发行审查和资本市场监管中利用职权为不法民企突击入股和违规审批输送利益。",
      consequence: "穿透式震慑资本市场发审腐败，倒逼所有券商保荐承销机构全面自查整改。"
    },
    summaryParagraph: "据9月7日 15:20（司法权威通报）消息，青岛中院依法对证监会原副主席王建军受贿案宣判无期徒刑。深层本质是国家对金融审批寻租实施零容忍清洗，为资本市场平稳健康运行划定带电的高压红线。"
  },
  {
    id: "GID-394CB5DB",
    track: "china_domestic",
    title: "超两千亿特别国债注资银行，农行工行夯实资本阻断踩踏",
    source: "财新网 (Caixin)",
    sourceUrl: "https://finance.caixin.com",
    publishedAt: "9月6日 18:50",
    impactLevel: 1,
    spilloverCriterion: "系统性责任事故与地方大震荡",
    oneLineTakeaway: "【中央信用硬核托底】：与其坐视地方金融机构缩表承压，国家直接用特别国债真金白银注资夯实资本金，筑牢阻断跨市场债务踩踏的堤坝。",
    transmissionImpact: "国有大行与重点险企资本充足率得到硬核夯实、信贷投放能力激活，高负债主体获得低成本债务置换空间，避险资金持续涌入主权国债。",
    sentiment: "BULLISH",
    nextWatchlist: "【后续观察哨】：锁定在 财政部特别国债续发日程及大行核心一级资本充足率季报更新。",
    bullBearDivergence: {
      bullConsensus: "中央财政主权信用注资直接打破地方债务化解瓶颈，彻底封死系统性金融风险外溢可能。",
      bearDivergence: "特别国债扩容增大长期国债供给体量，市场关注后续中长端国债二级市场消化节奏。"
    },
    timeWindow: "PAST_24H",
    bulletPoints: [
      "财政部第二批特别国债注资方案落地，农行、工行与进出口行合计获得2300亿元核心资本补充。",
      "专项注资全部用于补充大型金融机构核心一级资本，大幅提升抗周期信贷投放与风险吸纳能力。",
      "信源通道：财新网 (Caixin) 财政货币政策权威调查（记录时间：9月6日 18:50）。"
    ],
    summary5W1H: {
      who: "中华人民共和国财政部与工行、农行、进出口银行管理层",
      what: "第二批2300亿元特别国债注资大行方案正式执行，资金专项定向用于补充核心资本金。",
      when: "9月6日 18:50（财政货币政策调查）",
      where: "中国北京金融街与银行总行核心决策区",
      why: "应对地方化债攻坚期金融机构资产负债表防守压力，强化国有主力银行信贷托底稳固性。",
      consequence: "大幅提升金融体系风险加权承载力，确保实体经济重点项目信贷链条不断不乱。"
    },
    summaryParagraph: "据9月6日 18:50（财政货币政策调查）消息，财政部2300亿元特别国债注资银行正式执行。核心起因是主权财政协同发力筑牢金融安全底座，阻断地方化债期间可能诱发的信用紧缩循环。"
  },
  {
    id: "GID-394CB5DC",
    track: "china_domestic",
    title: "内蒙古两车相撞致五人死亡，多部门倒查责任严防道路涉险",
    source: "联合早报 (Zaobao)",
    sourceUrl: "https://www.zaobao.com.sg",
    publishedAt: "9月8日 08:30",
    impactLevel: 1,
    spilloverCriterion: "系统性责任事故与地方大震荡",
    oneLineTakeaway: "【安全红线一票否决】：致命安全事故击穿了基层合规防线，涉事企业被停业倒查整顿，全行业拉响隐患排查战备警报，安全成本被强制置顶。",
    transmissionImpact: "涉事责任主体面临顶格行政索赔与资质注销，同区域同行业全面停产整顿隐患，具备成熟安全体系的龙头企业承接外溢订单。",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 交通应急管理部门关于涉事重型营运车辆动态监控溯源报告。",
    bullBearDivergence: {
      bullConsensus: "多部门联合下沉一线排查整治重载干线，将倒逼公路长途客货运加快淘汰违规疲劳驾驶。",
      bearDivergence: "区域干线严格限速与高密度设卡临检，短期对大宗货物跨省公路物流运输时效带来轻微延滞。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "内蒙古阿拉善盟境内两车发生剧烈碰撞，造成五人不幸遇难，现场救援与勘验迅速封闭处置。",
      "地方应急与交通主管部门成立事故联合调查组，对涉事车辆营运资质及动态监管全面倒查。",
      "信源通道：联合早报 (Zaobao) 突发安全事故专电（记录时间：9月8日 08:30）。"
    ],
    summary5W1H: {
      who: "内蒙古阿拉善盟应急管理局、交警支队及涉事车辆责任方",
      what: "两辆大型车辆发生严重相撞交通事故造成五人死亡，调查组进驻涉事运输单位开展全链倒查。",
      when: "9月8日 08:30（突发安全事故专电）",
      where: "中国内蒙古阿拉善左旗核心干线公路路段",
      why: "恶劣路况下车辆涉嫌超限运行与视距盲区处置不当，暴露出基层运输安全生产履职漏洞。",
      consequence: "严厉启动事故问责程序，并在全省范围拉网式严查高危货运交通安全隐患。"
    },
    summaryParagraph: "据9月8日 08:30（突发安全事故专电）消息，内蒙古阿拉善发生五人遇难重大交通事故。本质是重特大安全生产事故触碰法律底线，监管部门迅速启动严苛倒查追责，严厉遏制重大伤亡外溢。"
  },
  {
    id: "GID-JILONG-PORT-DISASTER",
    track: "china_domestic",
    title: "吉隆口岸遭跨境泥石流冲击，陆路抢通推进搜救与选址论证",
    source: "国家应急管理部通报",
    sourceUrl: "https://www.mem.gov.cn",
    publishedAt: "9月8日 11:30",
    impactLevel: 1,
    spilloverCriterion: "系统性责任事故与地方大震荡",
    oneLineTakeaway: "【跨国地质灾害击穿通关咽喉】：尼泊尔冰崩引发的泥石流直接冲垮了中尼最重要的陆路物流命脉，不仅考验跨境应急搜救，更迫使口岸重建必须重新评估地质选址与防灾冗余。",
    transmissionImpact: "中尼跨境公路货运被迫大范围分流绕行樟木口岸或转走海运，口岸重建基建与高山边坡治理防灾工程紧急立项，边贸进出口企业正承受单证延误与滞港成本。",
    sentiment: "BEARISH",
    nextWatchlist: "【后续观察哨】：锁定在 应急管理部关于失联人员搜救阶段性通报及国家口岸办关于吉隆口岸原址抗灾评估结论。",
    bullBearDivergence: {
      bullConsensus: "陆路抢险通道抢通打通了大型救援装备进场生命线，为口岸综合防灾重构与科学选址奠定基础。",
      bearDivergence: "喜马拉雅冰川融化加剧高位冰崩频次，高危峡谷口岸若需迁建或大规模工程防护，工期与投资成本巨大。"
    },
    timeWindow: "TODAY",
    bulletPoints: [
      "受尼泊尔境内雪山冰崩影响，跨境特大泥石流严重冲击西藏吉隆口岸，造成口岸基础设施损毁并致人员伤亡失联。",
      "武警工兵与交通应急抢险力量经连续爆破作业打通陆路抢险便道，重型机械挺进核心区全面展开排险搜救。",
      "信源通道：国家应急管理部通报（灾情突发于8月26日，9月持续抢通救援与选址论证）。"
    ],
    summary5W1H: {
      who: "国家应急管理部、西藏自治区应急指挥部、武警工兵与中尼联合搜救队伍",
      what: "吉隆口岸遭境外冰崩诱发特大泥石流严重冲击损毁，抢险力量打通陆路通道深入搜救并启动功能恢复论证。",
      when: "8月26日发生灾情，9月抢险通道打通持续推进搜救与论证",
      where: "中国西藏自治区日喀则市吉隆口岸热索中尼边境峡谷段",
      why: "尼泊尔境内朗当雪山北坡突发大规模冰岩崩，剧烈势能带动高位冰碛物转化为泥石流越境冲击河谷口岸设施。",
      consequence: "口岸暂停通关并论证选址防灾，跨境实物货运转向樟木口岸分流，中尼冰川地质灾害预警协同紧急升级。"
    },
    summaryParagraph: "据8月26日发生灾情，9月抢险通道打通持续推进搜救与论证消息，国家应急管理部与西藏地方指挥部在中尼边境传来实质动态：境外雪山冰崩引发的跨境特大泥石流严重损毁吉隆口岸核心设施，救援队伍经过连续爆破已打通陆路抢险通道，正深入核心区排险搜救并启动口岸功能恢复与选址论证。深层动因在于气候变化加剧高位冰川失稳形成跨界链生灾害，直接破坏边境物流动脉。这一动向迅速引发连锁反应，中尼陆路货运紧急转向樟木口岸分流，边境防灾与工程加固全面提速。"
  },

  // ================= 6. 发达国家对华举措与博弈 (china_policy) =================
  {
    id: "GID-287BCF46",
    track: "china_policy",
    title: "滥用管制必遭反制！商务部重磅亮剑，启动反歧视救济评估",
    source: "路透中文网 (Reuters)",
    sourceUrl: "https://www.reuters.com",
    spilloverCriterion: "地缘与涉外高危擦枪",
    publishedAt: "9月7日 07:15",
    impactLevel: 1,
    oneLineTakeaway: "【亮出家底以战止戈】：单方面限制只会逼得国内全产业链加快自主造血，商务部拿出多边反歧视工具箱，直接把贸易摩擦摆在阳光下对等算账。",
    transmissionImpact: "全栈国产替代产业链龙头获得政策倾斜与国内采购大单，严重依赖海外代理资质的中间商面临断供退场，出海合规律所与咨询业务迎来暴单。",
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
    summaryParagraph: "据9月7日 07:15（经贸热点直报）消息，商务部展开技术限制合规应对评估。起因是坚决反对外部歧视性贸易壁垒，后续传导将坚定引导国内高新技术产业链走通自主可控之路。"
  },

  // ================= 7. 全球宏观认知与深度要闻 (global_cognition) =================
  {
    id: "GID-2DE608F2",
    track: "global_cognition",
    title: "禽流感逼近南美农牧圈！乌拉圭宣布紧急状态，多国拉响警报",
    source: "经济学人 (The Economist)",
    sourceUrl: "https://www.economist.com",
    publishedAt: "9月5日 09:22",
    impactLevel: 1,
    oneLineTakeaway: "【检疫铁幕瞬间落下】：高致病禽流感一旦蔓延到周边巴西养殖带，全球鸡肉供给就得断档，各国海关宁可错杀也不敢放行南美禽肉。",
    transmissionImpact: "欧美本土替代蛋白与大型家禽养殖巨头坐享短期提价红利，南美出口型牧场承受封关退运损失，国际对冲基金正借机炒作农畜产品期货。",
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
    summaryParagraph: "据9月5日 09:22（电讯直报）消息，乌拉圭启动最高级别卫生紧急响应。核心原因在于阻断禽类疫情向全球贸易产业链扩散，体现出全球供应链面对突发生物安全冲击的即时防御。"
  }
];
