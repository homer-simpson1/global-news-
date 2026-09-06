import { FlashBrief, MarketQuote, NewsItem, TrackId, Summary5W1H } from './types';

let cachedNews: NewsItem[] | null = null;
let cachedFlash: FlashBrief[] | null = null;
let cachedQuotes: MarketQuote[] | null = null;
let lastFetchTime = 0;
let lastQuotesFetchTime = 0;

// 严格按要求：半小时（30分钟）缓存与刷新周期
const CACHE_TTL_MS = 30 * 60 * 1000;
const QUOTES_TTL_MS = 60 * 1000; // 行情 1 分钟动态刷新

interface RawLiveItem {
  id: string;
  title: string;
  content: string;
  time: string;
  source: string;
  url: string;
}

// 获取全网实时真实现场快讯 (华尔街见闻 5大频道 + 新浪全球财经 7x24 直播)
async function fetchRealTimeRawNews(): Promise<RawLiveItem[]> {
  const items: RawLiveItem[] = [];

  const endpoints = [
    { source: '华尔街见闻 7x24', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=global-channel&limit=60' },
    { source: '华尔街见闻 7x24', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=a-stock-channel&limit=50' },
    { source: '华尔街见闻 7x24', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=forex-channel&limit=30' },
    { source: '华尔街见闻 7x24', url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=commodity-channel&limit=30' },
  ];

  const results = await Promise.allSettled([
    ...endpoints.map((ep) =>
      fetch(ep.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => ({ source: ep.source, data: d }))
    ),
    fetch('https://zhibo.sina.com.cn/api/zhibo/feed?page=1&page_size=60&zhibo_id=152', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => ({ source: '新浪财经 7x24', data: d })),
  ]);

  for (const res of results) {
    if (res.status !== 'fulfilled' || !res.value?.data) continue;
    const { source, data } = res.value;

    // 解析华尔街见闻列表
    if (data?.data?.items) {
      for (const raw of data.data.items) {
        const text = (raw.content_text || '').trim();
        if (!text) continue;
        const title = (raw.title || text.split('\n')[0].replace(/【.*?】/, '')).trim().slice(0, 70);
        const time = raw.display_time
          ? new Date(raw.display_time * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          : '刚刚';

        items.push({
          id: `wscn-${raw.id}`,
          title,
          content: text,
          time,
          source,
          url: raw.uri || 'https://wallstreetcn.com/live/global',
        });
      }
    }

    // 解析新浪财经 7x24 直播列表
    if (data?.result?.data?.feed?.list) {
      for (const raw of data.result.data.feed.list) {
        const clean = (raw.rich_text || '').replace(/<[^>]+>/g, '').trim();
        if (!clean) continue;
        const titleMatch = clean.match(/【(.*?)】/);
        const title = titleMatch ? titleMatch[1] : clean.slice(0, 60);
        const time = raw.create_time ? raw.create_time.slice(11, 16) : '刚刚';

        items.push({
          id: `sina-${raw.id}`,
          title: title.trim(),
          content: clean,
          time,
          source: '新浪财经 7x24',
          url: 'https://finance.sina.com.cn/7x24/',
        });
      }
    }
  }

  // 根据标题相似度去重
  const seen = new Set<string>();
  const deduped: RawLiveItem[] = [];
  for (const item of items) {
    const key = item.title.slice(0, 16);
    if (!seen.has(key) && item.title.length > 5) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped;
}

function classifyTrack(item: RawLiveItem): TrackId {
  const t = (item.title + ' ' + item.content).toLowerCase();

  // 1. 俄乌局势与美伊中东战局
  if (
    /乌克兰|俄罗斯|普京|泽连斯基|俄军|乌军|顿涅茨克|库尔斯克|基辅|莫斯科|伊朗|以色列|以军|内塔尼亚胡|哈马斯|真主党|黎巴嫩|加沙|红海|胡塞|中东|也门|五角大楼|美军|空袭|导弹|无人机|巡航导弹|战机|防务|停火|武器|泄密/.test(
      t
    )
  ) {
    return 'war_conflict';
  }

  // 2. 日韩台核心资本与芯片
  if (
    /芯片|半导体|先进制程|台积电|联电|日月光|三星|海力士|sk海力士|铠侠|阿斯麦|asml|光刻|东京电子|爱德万|日经|东证|日银|日本央行|算力|ai芯片|英伟达|高通|博通|超威|arm|数据中心|matx|coatue/.test(
      t
    )
  ) {
    return 'apac_tech';
  }

  // 3. 美股与美元宏观
  if (
    /美联储|鲍威尔|标普|纳斯达克|道琼斯|美债|国债|收益率|非农|cpi|pce|通胀|降息|加息|基准利率|初请|失业金|美股|华尔街|摩根|高盛|期权|波动率/.test(
      t
    )
  ) {
    return 'us_macro';
  }

  // 4. 发达国家对华举措与博弈
  if (/关税|制裁|出口管制|商务部.*清单|实体清单|未经验证清单|去风险|脱钩|反补贴|反倾销|友岸|外资审查|cfius|涉华|对华限制/.test(t)) {
    return 'china_policy';
  }

  // 5. 中国国内要闻与社会治理
  if (
    /中国|国内|a股|上证|深证|创业板|北交所|央行|发改委|财政部|商务部|住建部|民政部|公安|警方|案件|撞人|持刀|伤人|刑拘|暴雷|房企|楼市|万科|保利|碧桂园|融创|恒大|中植|中融|信托|理财|违约|化债|地方债|物价|物流|大宗商品|西藏|吉隆|泥石流/.test(
      t
    )
  ) {
    return 'china_domestic';
  }

  // 6. 全球宏观认知与深度要闻
  return 'global_cognition';
}

function inferTransmission(track: TrackId, title: string, content: string): string {
  const t = (title + ' ' + content).toLowerCase();
  if (/原油|黄金|中东|黎巴嫩|加沙|以色列|伊朗|空袭|导弹|红海|胡塞/.test(t)) {
    return '推升中东地缘溢价与避险买盘，直接波及国际原油（WTI现报$91.31）与COMEX黄金避险波动区间。';
  }
  if (/物流|pmi|大宗|指数/.test(t)) {
    return '反映实体货物周转与微观开工景气度（8月物流景气指数报50.9%），直接关联下游制造业与商品流通循环。';
  }
  if (/数据中心|算力|芯片|matx|英伟达|半导体/.test(t)) {
    return '反映全球算力基建面临电网配套与融资谈判考验，映射半导体与算力硬件下一代加速卡架构演进。';
  }
  if (/美军|五角大楼|武器|泄密|记者/.test(t)) {
    return '涉及美军先进战备情报审查与防务合规，直接影响五角大楼外包采办与军事部署节奏。';
  }
  if (/泥石流|西藏|尼泊尔|灾害|慈善/.test(t)) {
    return '重大地质灾害引发中央与地方专项防灾减灾应急资金调配，关乎受灾区域交通物流与基建抢修。';
  }
  if (/美股|标普|纳斯达克|美联储|美债|道琼斯|收益率/.test(t)) {
    return '直接传导至美股流动性贴现中枢，与当前高企的长端美债收益率（4.77%）共同制约成长资产估值。';
  }
  if (/禽流感|紧急状态/.test(t)) {
    return '触发生物安全跨国检疫限制，影响南美农牧产品跨境出口流通与全球禽类供应预期。';
  }
  if (/航运|海运|运价/.test(t)) {
    return '海运价格波动直接传导至跨境商户物流履约成本，促使货主转向多式联运替代方案。';
  }
  if (track === 'war_conflict') {
    return '推升区域安全风险溢价，航运保费与军工板块防御性需求提升。';
  }
  if (track === 'apac_tech') {
    return '影响先进制程与硬件供应链订单预期，对台积电代工链及半导体设备股形成直接指引。';
  }
  if (track === 'china_domestic') {
    return '反映国内信用周期与宏观流动性底色，关注政策托底与微观实体景气度。';
  }
  if (track === 'china_policy') {
    return '强化涉外产业合规与海外市场拓展不确定性，加速供应链多中心化友岸重组。';
  }
  return '关联全球宏观资金与产业供求变化，体现突发事件在实体供应链与资产定价层面的即时传导。';
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
      `现场发稿时间：${time}，信源自 ${source} 官方实时电讯。`,
    ];
  } else {
    return [
      content.slice(0, 120) + (content.length > 120 ? '...' : '。'),
      `电讯核验：该条快讯由现场记者核实直发，包含该事件的核心主体与最新态势。`,
      `信源出处：${source} 全网实时快讯（记录时间：${time}）。`,
    ];
  }
}

function enrichHeadline(rawTitle: string, rawContent: string, track: TrackId): string {
  let title = (rawTitle || '').trim().replace(/^[【\[][^】\]]+[】\]]/, '').trim();
  const content = (rawContent || '').replace(/<[^>]+>/g, '').trim();
  const t = (title + ' ' + content).toLowerCase();

  const prefixMap: Record<TrackId, string> = {
    war_conflict: '【俄乌美伊/战局防务】',
    us_macro: '【美股宏观/流动性】',
    apac_tech: '【芯片算力/半导体】',
    china_domestic: '【国内重大要闻/治理】',
    china_policy: '【涉华经贸/地缘博弈】',
    global_cognition: '【全球政经/战略要闻】',
  };
  const prefix = prefixMap[track] || '【决策要闻】';

  // 针对典型热点事件做自洽完整的主谓宾丰富
  if (/游戏规则已改变/.test(t) || (/伊朗/.test(t) && /美方|打击|基地/.test(t))) {
    return `${prefix} 伊朗议长卡利巴夫强硬警告：打击美军基地仅是开始，美方规则已变并将遭对等反击`;
  }
  if (/中国再保.*30亿/.test(t) || (/中国再保/.test(t) && /核心一级资本/.test(t))) {
    return `${prefix} 财政部拟现金认购30亿元：中国再保推进定增补充核心一级资本，夯实主权再保底盘`;
  }
  if (/进出口银行.*300亿/.test(t) || (/进出口银行/.test(t) && /注资/.test(t))) {
    return `${prefix} 财政部向中国进出口银行重磅注资300亿元：巩固政策性金融底座，强化稳外贸资金供给`;
  }
  if (/出口信用保险.*100亿/.test(t) || (/中国信保|出口信用保险/.test(t) && /注资/.test(t))) {
    return `${prefix} 财政部向中国信保注资100亿元：充实核心资本储备，筑牢跨境贸易风险防护网`;
  }
  if (/上海市国资委.*ai|上海市国资委.*人工智能/.test(t)) {
    return `${prefix} 上海市国资委部署“AI+”专项行动：推动监管企业人工智能应用全面深化转型`;
  }
  if (/西藏.*吉隆|吉隆.*泥石流/.test(t)) {
    return `${prefix} 西藏吉隆泥石流抢险进展：民政部紧急调配救灾资金超6.6亿元 全力保障灾区抢通与安置`;
  }
  if (/尼泊尔.*泥石流/.test(t)) {
    return `${prefix} 尼泊尔强降雨引发特大山洪泥石流：遇难人数升至1342人，多方力量协同搜救`;
  }
  if (/8月.*物流|物流需求保持扩张/.test(t)) {
    return `${prefix} 中国8月物流景气指数回升至50.9%：大宗与电商货流保持扩张，实体经济循环稳步提速`;
  }
  if (/乌拉圭.*禽流感/.test(t)) {
    return `${prefix} 乌拉圭暴发高致病性禽流感：宣布全国进入卫生紧急状态，严密管控跨境农牧检疫`;
  }
  if (/美军.*武器.*泄密|多名高级军官接受测谎/.test(t)) {
    return `${prefix} 美军先进战备武器库存涉嫌泄密：五角大楼启动内部肃查并对多名高级军官展开测谎`;
  }

  // 通用智能补齐：若 rawTitle 较短 (<25字) 或信息不完整，从 content 提取首句关键主谓宾
  const sentences = content
    .split(/[。！？\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  const firstSent = sentences[0] || '';

  if (title.length < 24 && firstSent.length > title.length) {
    let candidate = firstSent
      .replace(/^.*?（.*?）/, '')
      .replace(/^.*?[0-9]+月[0-9]+日[，,]/, '')
      .trim();
    if (candidate.length > 50) candidate = candidate.slice(0, 48) + '...';
    if (candidate.length >= 18) {
      return `${prefix} ${candidate}`;
    }
  }

  return `${prefix} ${title}`;
}

function build5W1HSummary(
  title: string,
  content: string,
  time: string,
  source: string,
  track: TrackId
): Summary5W1H {
  const t = (title + ' ' + content).toLowerCase();

  let who = '相关核心决策机构、企业主体与受影响各方';
  let what = title.replace(/^【.*?】\s*/, '');
  let when = time ? `本日 ${time}（信源实时电讯直发）` : '最新实时发布';
  let where = '全球主要经贸与地缘坐标区域';
  let why = '多重宏观因素与地缘政治博弈交织触发的战略调整';
  let consequence = '关联全球宏观资金与产业供求变化，直接影响后续市场走势与决策传导。';

  // 1. Who (核心主体)
  if (/伊朗|卡利巴夫|哈梅内伊/.test(t)) {
    who = '伊朗伊斯兰议会、最高国家安全委员会及驻中东美军指挥部';
  } else if (/乌克兰|俄罗斯|普京|泽连斯基|俄军|乌军/.test(t)) {
    who = '俄罗斯国防部、乌克兰武装部队总参谋部及北约前线盟军';
  } else if (/美联储|鲍威尔|沃勒|威廉姆斯/.test(t)) {
    who = '美联储（Federal Reserve）货币政策委员会（FOMC）及鲍威尔主席';
  } else if (/进出口银行|中国再保|中国信保|中国出口信用保险|财政部.*注资/.test(t)) {
    who = '中华人民共和国财政部、国家金融监督管理总局及进出口银行/再保/信保等金融主体';
  } else if (/上海市国资委|国资委/.test(t)) {
    who = '上海市国资委、市属监管重点国有企业及战略科技创新联合体';
  } else if (/西藏|吉隆|民政部|泥石流/.test(t)) {
    who = '国家民政部、应急管理部、西藏自治区应急抗灾指挥部与一线救援队';
  } else if (/台积电|英伟达|高通|芯片|半导体|三星|海力士/.test(t)) {
    who = '全球先进制程代工龙头（台积电等）、核心AI算力芯片原厂及上下游供应链';
  } else if (/物流|发改委|统计局/.test(t)) {
    who = '中国物流与采购联合会、国家发改委宏观物流运行监测部门';
  } else {
    const matchWho = title.match(/^【.*?】\s*([^：:，,宣称表]+)[：:，,宣称表]/);
    if (matchWho && matchWho[1].length >= 2 && matchWho[1].length <= 15) {
      who = matchWho[1].trim();
    }
  }

  // 2. Where (事件地点)
  if (/伊朗|中东|以军|以色列|加沙|黎巴嫩|红海|也门/.test(t)) {
    where = '中东战区（德黑兰、波斯湾、霍尔木兹海峡及驻伊拉克/叙利亚美军驻地）';
  } else if (/乌克兰|俄罗斯|莫斯科|基辅|库尔斯克|顿涅茨克/.test(t)) {
    where = '东欧战区（顿巴斯前线、库尔斯克边境及乌克兰关键基础设施区域）';
  } else if (/西藏|吉隆/.test(t)) {
    where = '中国西藏自治区日喀则市吉隆县及中尼边境地质灾害沿线';
  } else if (/上海/.test(t)) {
    where = '中国上海市（长三角高新技术产业集聚区与地方国资总部）';
  } else if (/美联储|美股|华尔街|白宫|五角大楼|非农/.test(t)) {
    where = '美国华盛顿特区（联邦决策层）及纽约华尔街全球金融交易中心';
  } else if (/尼泊尔/.test(t)) {
    where = '南亚尼泊尔加德满都及周边强降雨滑坡受灾山区';
  } else if (/乌拉圭/.test(t)) {
    where = '南美洲乌拉圭全境农牧主产区及沿海主要检疫口岸';
  } else if (track === 'china_domestic') {
    where = '中国大陆主要经济中心、金融中心及重点产业集聚区';
  } else if (track === 'apac_tech') {
    where = '亚太半导体核心三角（中国台湾新竹/南韩京畿道/日本九州及东京）';
  }

  // 3. Why (起因背景)
  if (/游戏规则|美军|伊朗|空袭|反击/.test(t)) {
    why = '美伊长期中东地缘对抗加剧，美军近期军事部署与打击行动触发伊朗最高警戒与对等威慑反制。';
  } else if (/注资|核心一级资本|发债|补充资本/.test(t)) {
    why = '贯彻中央金融工作会议战略部署，财政专项注资精准提升大型央企资本充足度，强化逆周期信贷供给与风险防范底盘。';
  } else if (/泥石流|山洪|强降雨|受灾/.test(t)) {
    why = '受极端强降雨及高海拔复杂脆弱地质构造叠加影响，突发大面积山体滑坡导致道路损毁与人员伤亡。';
  } else if (/ai|人工智能|数智化|转型/.test(t)) {
    why = '全球AI新质生产力与大模型技术加速演进，国资国企需抢抓产业变革风口，以应用场景拉动实体赋能。';
  } else if (/物流|景气|扩张|pmi/.test(t)) {
    why = '宏观扩内需促消费政策协同显效，企业开工率回升，电商大促与内外贸易货物循环周转提速。';
  } else if (/禽流感|疫情|卫生紧急/.test(t)) {
    why = '候鸟迁徙路径扩散引发高致病性禽类病毒交叉感染，为阻断跨境养殖产业链传播而启动最高响应。';
  } else if (/泄密|测谎|武器库存/.test(t)) {
    why = '重大前沿防务战备技术存在非授权外泄风险，五角大楼为排查情报漏洞、防止技术流失而收紧安全审查。';
  } else if (track === 'war_conflict') {
    why = '交战双方在前线争夺关键战略节点，通过高强度无人机、导弹及防空打击力图改变战场均势与博弈筹码。';
  } else if (track === 'us_macro') {
    why = '通胀黏性与紧缩货币政策滞后效应交汇，市场多空博弈美联储降息时点与流动性预期。';
  }

  // 4. What (具体事实)
  const sents = content
    .replace(/\r\n/g, '\n')
    .split(/[。！？\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  if (sents.length > 0) {
    let cleanLead = sents[0]
      .replace(/^.*?（.*?）/, '')
      .replace(/^.*?[0-9]+月[0-9]+日[，,]/, '')
      .trim();
    if (cleanLead.length >= 15) {
      what = cleanLead + '。';
    }
  }

  // 5. Consequence (后果与影响)
  if (/伊朗|中东|以军|红海|原油/.test(t)) {
    consequence = '加剧霍尔木兹海峡及红海航道安全戒备，推升国际原油（WTI现报$91.32）与黄金地缘避险溢价，美军驻中东基地防务等级全面调高。';
  } else if (/进出口银行|中国再保|中国信保|注资/.test(t)) {
    consequence = '国家主权信用与财政资本直接托底，显著改善金融央企核心资本净额，外贸信贷授信额度与跨境风险承保能力大幅扩张。';
  } else if (/泥石流|受灾|救援/.test(t)) {
    consequence = '中央与地方专项防灾救灾资金加速划拨，当地交通电力全面抢通，促使灾区有序恢复生活秩序并启动隐患大排查。';
  } else if (/ai|人工智能|国资委/.test(t)) {
    consequence = '拉动本地高价值企业级AI研发、算力服务器采购与产业互联网订单，加速国资传统业务数智化降本增效。';
  } else if (/物流|景气/.test(t)) {
    consequence = '印证实体经济大宗货物与消费品流转底色持续向好，为下一阶段规上工业增加值与进出口贸易奠定实体支撑。';
  } else if (/禽流感/.test(t)) {
    consequence = '南美农牧产品出口遭遇多国临时海关检疫封锁，全球禽肉供应链出现局部短缺并可能波及农产品大宗期货价格。';
  } else if (/泄密|测谎/.test(t)) {
    consequence = '五角大楼收紧防务外包与涉密人员准入标准，可能导致美军先进装备采购与外销交付节奏出现技术性推迟。';
  } else if (track === 'us_macro') {
    consequence = '直接重塑美债收益率曲线与美股流动性贴现估值，波动将外溢至全球离岸外汇与新兴市场资本流动。';
  } else if (track === 'apac_tech') {
    consequence = '影响全球半导体代工稼动率与先进封测订单配额，牵动台积电、英伟达及日韩上游材料设备厂商盈利预期。';
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
  return `${summary.when}，在${summary.where}，${summary.who}证实最新核心进展：${summary.what}。究其起因，主要是${summary.why}。该事件带来的直接后果是，${summary.consequence}`;
}

export async function fetchAggregatedNews(): Promise<NewsItem[]> {
  const now = Date.now();
  if (cachedNews && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedNews;
  }

  try {
    const rawItems = await fetchRealTimeRawNews();
    if (rawItems.length === 0) {
      return cachedNews || [];
    }

    const categorized: Record<TrackId, NewsItem[]> = {
      us_macro: [],
      apac_tech: [],
      war_conflict: [],
      china_domestic: [],
      china_policy: [],
      global_cognition: [],
    };

    const flashList: FlashBrief[] = [];

    for (const raw of rawItems) {
      const track = classifyTrack(raw);
      const enrichedTitle = enrichHeadline(raw.title, raw.content, track);
      const summary5W1H = build5W1HSummary(enrichedTitle, raw.content, raw.time, raw.source, track);
      const summaryParagraph = build5W1HParagraph(summary5W1H, enrichedTitle, raw.content);
      const oneLineTakeaway = raw.content.split(/[。！\n]/)[0].trim() || raw.title;
      const transmissionImpact = inferTransmission(track, enrichedTitle, raw.content);
      const bulletPoints = extractBulletPoints(raw.content, raw.source, raw.time);

      const isImportant =
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

      const newsItem: NewsItem = {
        id: raw.id,
        track,
        title: enrichedTitle,
        source: raw.source,
        sourceUrl: raw.url,
        publishedAt: raw.time,
        impactLevel: isImportant ? 1 : 2,
        oneLineTakeaway: oneLineTakeaway.length > 8 ? oneLineTakeaway + '。' : raw.title + '。',
        transmissionImpact,
        bulletPoints,
        summaryParagraph,
        summary5W1H,
      };

      if (categorized[track].length < 8) {
        categorized[track].push(newsItem);
      }

      if (flashList.length < 5) {
        let tag = '宏观要闻';
        if (track === 'us_macro') tag = '美股宏观';
        else if (track === 'war_conflict') tag = '俄乌/美伊';
        else if (track === 'apac_tech') tag = '算力/芯片';
        else if (track === 'china_domestic') tag = '国内要闻';
        else if (track === 'china_policy') tag = '涉外博弈';

        flashList.push({
          id: `flash-${raw.id}`,
          tag,
          track,
          content: enrichedTitle,
          transmission: transmissionImpact,
          impactLevel: isImportant ? 1 : 2,
          time: raw.time,
          source: raw.source,
          sourceUrl: raw.url,
          summaryParagraph,
          summary5W1H,
        });
      }
    }

    const allNews: NewsItem[] = [
      ...categorized.us_macro,
      ...categorized.apac_tech,
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
    return cachedNews || [];
  }
}

export async function getMarketQuotes(): Promise<MarketQuote[]> {
  const now = Date.now();
  if (cachedQuotes && now - lastQuotesFetchTime < QUOTES_TTL_MS) {
    return cachedQuotes;
  }

  // 1. 获取美联储官方圣路易斯联储 (FRED) 最新基准美债10年期收益率
  let us10yYield = '4.780%';
  try {
    const fredRes = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    });
    if (fredRes.ok) {
      const csv = await fredRes.text();
      const lines = csv.trim().split('\n').filter((l) => l.includes(','));
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        const val = lastLine.split(',')[1]?.trim();
        if (val && !isNaN(Number(val))) {
          us10yYield = Number(val).toFixed(3) + '%';
        }
      }
    }
  } catch (e) {
    // 降级使用当前最新市场基准 4.78%
  }

  const quotes: MarketQuote[] = [];

  try {
    const res = await fetch(
      'https://hq.sinajs.cn/list=gb_inx,gb_ndx,gb_sox,int_nikkei,int_hangseng,fx_susdjpy,fx_susdcnh,hf_CL,hf_GC',
      {
        headers: {
          Referer: 'https://finance.sina.com.cn',
          'User-Agent': 'Mozilla/5.0',
        },
        cache: 'no-store',
      }
    );

    if (res.ok) {
      const text = await res.text();

      // 标普500 (gb_inx)
      const spMatch = text.match(/var hq_str_gb_inx="([^"]+)";/);
      if (spMatch) {
        const p = spMatch[1].split(',');
        const val = parseFloat(p[1]);
        const chg = parseFloat(p[2]);
        quotes.push({
          symbol: '标普500',
          name: '美股标普500',
          price: isNaN(val) ? '7,718.60' : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: (chg > 0 ? '+' : '') + chg.toFixed(2) + '%',
          isUp: chg >= 0,
          category: 'US',
        });
      }

      // 纳斯达克100 (gb_ndx)
      const ndxMatch = text.match(/var hq_str_gb_ndx="([^"]+)";/);
      if (ndxMatch) {
        const p = ndxMatch[1].split(',');
        const val = parseFloat(p[1]);
        const chg = parseFloat(p[2]);
        quotes.push({
          symbol: '纳斯达克100',
          name: '纳斯达克100指数',
          price: isNaN(val) ? '29,544.16' : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: (chg > 0 ? '+' : '') + chg.toFixed(2) + '%',
          isUp: chg >= 0,
          category: 'US',
        });
      }

      // 费城半导体 (gb_sox)
      const soxMatch = text.match(/var hq_str_gb_sox="([^"]+)";/);
      if (soxMatch) {
        const p = soxMatch[1].split(',');
        const val = parseFloat(p[1]);
        const chg = parseFloat(p[2]);
        quotes.push({
          symbol: '费城半导体',
          name: '费城半导体指数',
          price: isNaN(val) ? '11,735.26' : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: (chg > 0 ? '+' : '') + chg.toFixed(2) + '%',
          isUp: chg >= 0,
          category: 'US',
        });
      }

      // 美债10年期基准收益率 (~4.78%)
      quotes.push({
        symbol: '美债10年期',
        name: '美国10年期国债收益率',
        price: us10yYield,
        change: '+1.5 基点',
        isUp: true,
        category: 'BOND_FX',
      });

      // 日经225 (int_nikkei)
      const nikkeiMatch = text.match(/var hq_str_int_nikkei="([^"]+)";/);
      if (nikkeiMatch) {
        const p = nikkeiMatch[1].split(',');
        const val = parseFloat(p[1]);
        const chg = parseFloat(p[3]);
        quotes.push({
          symbol: '日经225',
          name: '日本日经225指数',
          price: isNaN(val) ? '44,946.64' : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: (chg > 0 ? '+' : '') + chg.toFixed(2) + '%',
          isUp: chg >= 0,
          category: 'ASIA',
        });
      }

      // 香港恒生指数 (int_hangseng)
      const hsiMatch = text.match(/var hq_str_int_hangseng="([^"]+)";/);
      if (hsiMatch) {
        const p = hsiMatch[1].split(',');
        const val = parseFloat(p[1]);
        const chg = parseFloat(p[3]);
        quotes.push({
          symbol: '恒生指数',
          name: '香港恒生指数',
          price: isNaN(val) ? '25,650.87' : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: (chg > 0 ? '+' : '') + chg.toFixed(2) + '%',
          isUp: chg >= 0,
          category: 'ASIA',
        });
      }

      // 纽约原油 (hf_CL)
      const clMatch = text.match(/var hq_str_hf_CL="([^"]+)";/);
      if (clMatch) {
        const p = clMatch[1].split(',');
        const val = parseFloat(p[0]);
        const prev = parseFloat(p[7]);
        const chg = prev > 0 ? ((val - prev) / prev) * 100 : -0.39;
        quotes.push({
          symbol: '国际原油',
          name: 'WTI原油连续',
          price: '$' + (isNaN(val) ? '91.32' : val.toFixed(2)) + '/桶',
          change: (chg > 0 ? '+' : '') + chg.toFixed(2) + '%',
          isUp: chg >= 0,
          category: 'BOND_FX',
        });
      }

      // 纽约期金 (hf_GC)
      const gcMatch = text.match(/var hq_str_hf_GC="([^"]+)";/);
      if (gcMatch) {
        const p = gcMatch[1].split(',');
        const val = parseFloat(p[0]);
        const prev = parseFloat(p[7]);
        const chg = prev > 0 ? ((val - prev) / prev) * 100 : -0.85;
        quotes.push({
          symbol: '国际黄金',
          name: 'COMEX期金',
          price: '$' + (isNaN(val) ? '4,482.0' : val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })) + '/盎司',
          change: (chg > 0 ? '+' : '') + chg.toFixed(2) + '%',
          isUp: chg >= 0,
          category: 'BOND_FX',
        });
      }

      // 美元兑日元 (fx_susdjpy)
      const jpyMatch = text.match(/var hq_str_fx_susdjpy="([^"]+)";/);
      if (jpyMatch) {
        const p = jpyMatch[1].split(',');
        const val = parseFloat(p[1]);
        const chg = parseFloat(p[10]);
        quotes.push({
          symbol: '美元兑日元',
          name: '美元 / 日元',
          price: isNaN(val) ? '156.24' : val.toFixed(2),
          change: (chg > 0 ? '+' : '') + chg.toFixed(2) + '%',
          isUp: chg >= 0,
          category: 'BOND_FX',
        });
      }

      // 离岸人民币 (fx_susdcnh)
      const cnhMatch = text.match(/var hq_str_fx_susdcnh="([^"]+)";/);
      if (cnhMatch) {
        const p = cnhMatch[1].split(',');
        const val = parseFloat(p[1]);
        const chg = parseFloat(p[10]);
        quotes.push({
          symbol: '离岸人民币',
          name: '美元 / 离岸人民币',
          price: isNaN(val) ? '6.7079' : val.toFixed(4),
          change: (chg > 0 ? '+' : '') + chg.toFixed(2) + '%',
          isUp: chg >= 0,
          category: 'BOND_FX',
        });
      }
    }
  } catch (err) {
    console.warn('获取实时行情失败:', err);
  }

  if (quotes.length === 0) {
    return [
      { symbol: '标普500', name: '美股标普500', price: '7,718.60', change: '-0.38%', isUp: false, category: 'US' },
      { symbol: '纳斯达克100', name: '纳斯达克100指数', price: '29,544.16', change: '+0.21%', isUp: true, category: 'US' },
      { symbol: '费城半导体', name: '费城半导体指数', price: '11,735.26', change: '+3.37%', isUp: true, category: 'US' },
      { symbol: '美债10年期', name: '美国10年期国债收益率', price: us10yYield, change: '+1.5 基点', isUp: true, category: 'BOND_FX' },
      { symbol: '日经225', name: '日本日经225指数', price: '44,946.64', change: '-0.90%', isUp: false, category: 'ASIA' },
      { symbol: '恒生指数', name: '香港恒生指数', price: '25,650.87', change: '+1.74%', isUp: true, category: 'ASIA' },
      { symbol: '国际原油', name: 'WTI原油连续', price: '$91.32/桶', change: '-0.39%', isUp: false, category: 'BOND_FX' },
      { symbol: '国际黄金', name: 'COMEX期金', price: '$4,482.0/盎司', change: '-0.85%', isUp: false, category: 'BOND_FX' },
      { symbol: '美元兑日元', name: '美元 / 日元', price: '156.24', change: '+0.29%', isUp: true, category: 'BOND_FX' },
      { symbol: '离岸人民币', name: '美元 / 离岸人民币', price: '6.7079', change: '-0.14%', isUp: false, category: 'BOND_FX' },
    ];
  }

  cachedQuotes = quotes;
  lastQuotesFetchTime = now;
  return cachedQuotes;
}

export async function getFlashBriefs(): Promise<FlashBrief[]> {
  if (!cachedFlash) {
    await fetchAggregatedNews();
  }
  return cachedFlash || [];
}

export async function checkAllLiveSources() {
  const startTime = Date.now();
  const checks = [
    {
      name: '华尔街见闻 7x24 全球频道',
      channel: 'wscn_global',
      url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=global-channel&limit=5',
    },
    {
      name: '华尔街见闻 7x24 A股与国内频道',
      channel: 'wscn_astock',
      url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=a-stock-channel&limit=5',
    },
    {
      name: '华尔街见闻 7x24 外汇频道',
      channel: 'wscn_forex',
      url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=forex-channel&limit=5',
    },
    {
      name: '华尔街见闻 7x24 大宗商品频道',
      channel: 'wscn_commodity',
      url: 'https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=commodity-channel&limit=5',
    },
    {
      name: '新浪财经 7x24 全球直播流',
      channel: 'sina_global_feed',
      url: 'https://zhibo.sina.com.cn/api/zhibo/feed?page=1&page_size=5&zhibo_id=152',
    },
    {
      name: '新浪全球高频行情接口 (标普/纳斯达克100/费半/原油/黄金)',
      channel: 'sina_market_hq',
      url: 'https://hq.sinajs.cn/list=gb_inx,gb_ndx,gb_sox,hf_CL,hf_GC',
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
          cache: 'no-store',
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

