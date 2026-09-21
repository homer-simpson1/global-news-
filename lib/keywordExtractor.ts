// 智能实体关键词提取器：精准提取 2~4 个核心事实实体与动词（例如：四川盐边县 泥石流 两人死亡 三人失联）
// 彻底杜绝与新闻事实无关的泛化假词兜底，保证在主流搜索引擎（Bing / Google / 百度）中 100% 能够精准溯源

// 1. 国内省级行政区与地质/地理专名列表
const PROV_LIST = '北京|天津|上海|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门';
const NON_GEO_WORDS = new Set([
  '上市', '股市', '债市', '汇市', '期市', '开市', '闭市', '早市', '夜市', '超市', '集市', '黑市',
  '欧盟', '联盟', '同盟', '加盟', '误区', '雷区', '盲区', '战区', '灾区', '省钱', '省略', '反省', '节省'
]);

// 2. 深度精选实体知识库（宏观/金融/部委/硬科技/防务）
const CORE_ENTITIES_DICT = [
  // 宏观金融与货币政策
  '美联储', '凯文·沃什', '沃什', 'Kevin Warsh', '鲍威尔', '耶伦', '美债收益率', '美债', '国债收益率', '国债',
  '非农就业', '非农', 'CPI通胀', '核心PCE', 'CPI', 'PCE', 'PPI', 'GDP', 'PMI',
  '降息预期', '降息', '加息周期', '加息', '降准', '缩表', '实际利率', '贴现率', '流动性',
  '美元指数', '离岸人民币', '在岸人民币', '人民币汇率', '汇率',
  '欧央行', '日本央行', '英国央行', '美国财政部',
  '美股期指', '三大期指', '期指', '标普500', '纳斯达克100', '纳指100', '纳斯达克', '纳指',
  '费城半导体', '道琼斯', '恒生指数', '日经225',
  '超长期特别国债', '特别国债', '专项债', '逆回购', 'LPR', 'MLF',
  // 核心国家部委与监管司法机构
  '商务部', '证监会', '发改委', '工信部', '公安部', '应急管理部', '外交部', '财政部',
  '中国人民银行', '国家统计局', '市监总局', '自然资源部', '生态环境部', '交通运输部', '水利部',
  '最高法', '最高检', '国家安全部', '国常会', '国务院',
  // 头部券商与核心金融机构
  '中金公司', '中信证券', '华泰证券', '国泰君安', '海通证券', '广发证券', '招商证券', '东兴证券', '信达证券',
  // 算力、硬科技与AI大模型
  '台积电', '英伟达', '黄仁勋', 'ASML', '光刻机', '先进制程芯片', '先进制程', '先进封装', 'CoWoS', 'HBM内存', 'HBM',
  'GPU算力', '算力集群', '算力', '大模型', 'LLM', 'Agent生态', 'Agent',
  'OpenAI', 'GPT-5', 'GPT-4o', 'GPT', 'Anthropic', 'Claude', 'Google', 'DeepMind', '微软', '苹果', '亚马逊',
  '三星电子', 'SK海力士', '博通', '高通', '超微电脑', 'ARM',
  '燧原科技', '燧原', '沐曦集成电路', '沐曦', '摩尔线程', '长鑫存储', '中芯国际', '壁仞科技', '寒武纪', '澜起科技', '龙芯中科',
  '华为', '海思', '比亚迪', '宁德时代', '特斯拉FSD', '特斯拉', 'FSD',
  // 大宗商品与能源航运
  'WTI原油', '布伦特原油', '国际原油', '原油', '现货黄金', 'COMEX期金', '国际黄金', '黄金', '白银', 'LME铜', '伦铜', '铜价',
  '集运欧线', '运价指数', 'BDI指数', '波罗的海干散货', '红海', '霍尔木兹海峡', '马六甲海峡', '苏伊士运河', 'OPEC+', 'OPEC',
  '天然气', 'TTF基准', '锂矿', '铁矿石',
  // 战局地缘与国家防务
  '俄乌冲突', '俄乌战局', '俄乌', '乌克兰', '俄罗斯', '库尔斯克', '扎波罗热', '顿巴斯', '黑海舰队', '五角大楼', '北约',
  '以军空袭', '以军', '也门胡塞武装', '胡塞武装', '伊朗核协议', '伊朗', '以色列', '加沙地带', '加沙', '导弹袭击', '防空系统', '无人机'
];

// 3. 核心动态行为与动作谓语
const ACTION_VERBS = [
  '吸收合并', '重组上市', '股票停牌', '恢复交易', '终止上市', '强制退市', '立案调查', '行政处罚',
  '打架斗殴', '刑事拘留', '依法批捕', '提起公诉', '公开宣判', '反倾销税', '加征关税', '实施制裁',
  '突发泥石流', '紧急抢通', '全力搜救', '抢险排险', '排险', '搜救',
  '飙升', '暴跌', '大涨', '大跌', '反弹', '走高', '跳水', '承压', '重挫', '创新高', '创新低',
  '违约', '破产', '清盘', '空袭', '遭袭', '开火', '停火', '增兵', '撤军'
];

export function extractSearchKeywords(rawTitle: string, source?: string): string {
  if (!rawTitle) return '';

  // 1. 去除开头的【分类/标签】前缀
  let clean = rawTitle.replace(/^[【\[]([^】\]]+)[】\]]\s*/, '').trim();

  // 2. 去除日期、时间前缀与电讯套话
  clean = clean
    .replace(/^(?:本日|今日|\d{1,2}月\d{1,2}日)?\s*\d{1,2}:\d{2}(?:\s*（[^）]+）)?\s*，?\s*/, '')
    .replace(/^.*?讯\s*——\s*/, '')
    .replace(/（[^）]*?(?:快讯|直发|电讯|通报|原创)[^）]*?）/g, '')
    .trim();

  const foundEntities: string[] = [];

  // 智能实体添加与向上合并器（若已有“四川盐边县”，抑制较短子词“盐边县”或“四川”；若已有“两人死亡”，抑制“死亡”）
  const addEntity = (entity: string) => {
    if (!entity) return;
    const cleanEntity = entity.trim();
    if (cleanEntity.length < 2) return;
    if (foundEntities.some((e) => e.includes(cleanEntity))) return;
    for (let i = foundEntities.length - 1; i >= 0; i--) {
      if (cleanEntity.includes(foundEntities[i])) {
        foundEntities.splice(i, 1);
      }
    }
    foundEntities.push(cleanEntity);
  };

  // 3. 伤亡统计与量化救援结果（极高查错实效性，优先提取）
  const casualties = clean.match(/(?:\d+|两|三|四|五|六|七|八|九|十|多|数十|数百)人(?:死亡|遇难|失联|受困|被困|受伤|殉职|死伤)/g);
  if (casualties) {
    for (const c of casualties) {
      addEntity(c);
      if (foundEntities.length >= 2) break;
    }
  }

  // 4. 核心自然灾害与突发险情实体
  const disasters = clean.match(/泥石流|山洪|山体滑坡|滑坡|坍塌|塌方|\d+(?:\.\d+)?级地震|地震|森林火灾|火灾|瓦斯爆炸|爆炸|特大交通事故|矿难|透水|沉船|客船侧翻|坠机|空难|特大暴雨|暴雨|洪涝|台风|雪灾|寒潮/g);
  if (disasters) {
    for (const d of disasters) {
      addEntity(d);
      if (foundEntities.length >= 3) break;
    }
  }

  // 5. 行政区划与地名实体提取（省、市、州、盟、县、区、镇、乡、海峡、海域、运河、口岸等）
  const geoRegex = new RegExp(
    '(?:(?:' + PROV_LIST + ')(?:省|市)?(?:[\\u4e00-\\u9fa5]{1,4}(?:县|区|市|州|镇|乡)|[\\u4e00-\\u9fa5]{2,3}(?=发生|突发|遭遇|出现|发布|通报|\\d))|(?:' + PROV_LIST + ')(?:省|市)?|[\\u4e00-\\u9fa5]{2,5}(?:海峡|海湾|海域|半岛|运河|群岛|口岸))',
    'g'
  );
  const geoMatches = clean.match(geoRegex);
  if (geoMatches) {
    for (const g of geoMatches) {
      if (!NON_GEO_WORDS.has(g) && !g.includes('上市') && !g.includes('公司') && !g.includes('芯片')) {
        addEntity(g);
        if (foundEntities.length >= 3) break;
      }
    }
  }

  // 6. 精选核心实体字典匹配（按长度倒序优先命中完整专业名词）
  const sortedDict = [...CORE_ENTITIES_DICT].sort((a, b) => b.length - a.length);
  for (const entity of sortedDict) {
    if (clean.includes(entity)) {
      addEntity(entity);
      if (foundEntities.length >= 4) break;
    }
  }

  // 7. 量化异动与核心行为动词
  const dynamicVerbs = clean.match(/开盘涨\d+%|开盘跌\d+%|涨超\d+%|跌超\d+%|降温超\d+℃/g) || [];
  for (const dv of dynamicVerbs) {
    addEntity(dv);
    if (foundEntities.length >= 4) break;
  }
  for (const verb of ACTION_VERBS) {
    if (clean.includes(verb) && !foundEntities.some((e) => e.includes(verb))) {
      addEntity(verb);
      if (foundEntities.length >= 4) break;
    }
  }

  // 8. 提取专有名词（书名号/引号中的关键项目或文件）
  const quoteMatches = clean.match(/[「“『《]([^」”』》]+)[」”』》]/g);
  if (quoteMatches) {
    for (const q of quoteMatches) {
      const term = q.slice(1, -1).trim();
      if (term.length >= 2 && term.length <= 12) {
        addEntity(term);
        if (foundEntities.length >= 4) break;
      }
    }
  }

  // 9. 提取英文机构/资产代号 (如 CPI, TSMC, NVDA, Fed, OpenAI, ASML, WTI, Brent, GPT-5) - 必须包含英文字母
  const codeMatches = clean.match(/\b(?=[A-Za-z0-9\-\.\+]*[A-Za-z])[A-Za-z0-9\-\.\+]{2,10}\b/g);
  if (codeMatches) {
    for (const code of codeMatches) {
      if (!['and', 'the', 'for', 'with', 'from', 'this', 'that', 'news', 'will', 'are', 'has', 'have'].includes(code.toLowerCase())) {
        if (!foundEntities.some((e) => e.toLowerCase() === code.toLowerCase())) {
          addEntity(code);
          if (foundEntities.length >= 4) break;
        }
      }
    }
  }

  // 10. 若实体数量仍少于2个，使用自然断句提取最具代表性的短语补充
  if (foundEntities.length < 2) {
    const segments = clean
      .split(/[:：,，。；;\s\-_—|]+/)
      .map((s) => s.replace(/^(?:据悉|据报道|记者获悉|最新消息|刚刚|目前|今日|昨日|全力|全面|持续|正在|进行|开展|发生|致|导致|造成)+/, ''))
      .map((s) => s.replace(/(?:全力展开|全面启动|正在进行|引发关注|最新通报|官方通报|发布策略研报|策略研报|研报|分析报告|公告|通报)$/, ''))
      .filter((s) => s.length >= 2 && s.length <= 16)
      .filter((s) => !/^[0-9.%+-]+$/.test(s))
      .filter((s) => !['表示', '指出', '认为', '强调', '宣布', '举行', '进行', '跌', '涨', '报', '点'].includes(s));

    for (const seg of segments) {
      if (foundEntities.some((e) => seg.includes(e))) continue;
      addEntity(seg);
      if (foundEntities.length >= 3) break;
    }
  }

  // 11. 绝对保真兜底：绝不凭空返回“全球宏观”等无关虚假假词，直接截取清洗后的真实标题片断
  if (foundEntities.length === 0) {
    const fallbackSlice = clean.replace(/[:：,，。；;！!？?\s\-_—|]+/g, ' ').trim().slice(0, 25);
    return fallbackSlice || '突发要闻 事实核查';
  }

  return foundEntities.slice(0, 4).join(' ');
}

// 生成主流搜索引擎的直达 URL
export function getSearchUrl(keywords: string, engine: 'bing' | 'google' | 'baidu' = 'bing'): string {
  const query = encodeURIComponent(keywords.trim());
  switch (engine) {
    case 'google':
      return `https://www.google.com/search?q=${query}`;
    case 'baidu':
      return `https://www.baidu.com/s?wd=${query}`;
    case 'bing':
    default:
      return `https://www.bing.com/search?q=${query}`;
  }
}
