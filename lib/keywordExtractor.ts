// 智能实体关键词提取器：提取 3~4 个核心实体词（例如：美债收益率 非农就业 降息预期 科技股）
// 既保证搜索引擎交叉查错精准度，又彻底防范泄露原始快讯标题

const CORE_ENTITIES_DICT = [
  // 宏观金融与货币政策
  '美债收益率', '美债', '国债收益率', '国债', '美联储', '鲍威尔', '非农就业', '非农', 'CPI通胀', '核心PCE', 'CPI', 'PCE',
  '降息预期', '降息', '加息周期', '加息', '缩表', '实际利率', '贴现率', '流动性', '美元指数', '离岸人民币', '汇率',
  '欧央行', '日本央行', '美国财政部', '耶伦', '美股期指', '三大期指', '期指', '标普500', '纳斯达克100', '纳指100',
  '纳斯达克', '费城半导体', '道琼斯', '恒生指数', '日经225',
  // 算力半导体与前沿大模型
  '台积电', '英伟达', '黄仁勋', 'ASML', '光刻机', '2nm制程', '先进制程', '先进封装', 'CoWoS', 'HBM内存', 'HBM',
  'GPU算力', '算力', 'OpenAI', 'GPT', 'Anthropic', 'Claude', 'Google', 'DeepMind', '大模型', 'LLM', 'Agent',
  '三星电子', 'SK海力士', '博通', '高通', '超微电脑', 'ARM', '算力集群', '代工报价',
  // 大宗商品与能源航运
  'WTI原油', '布伦特原油', '国际原油', '原油', '现货黄金', 'COMEX期金', '国际黄金', '黄金', '白银', 'LME铜', '伦铜', '铜价',
  '集运欧线', '运价指数', 'BDI指数', '波罗的海干散货', '红海断航', '红海', '霍尔木兹海峡', '马六甲海峡', '苏伊士运河', 'OPEC+',
  '天然气', 'TTF基准', '锂矿', '铁矿石',
  // 战局地缘与国家防务
  '俄乌冲突', '俄乌战局', '乌克兰', '俄罗斯', '库尔斯克', '扎波罗热', '顿巴斯', '黑海舰队', '五角大楼', '北约', '以军空袭',
  '也门胡塞武装', '胡塞武装', '伊朗核协议', '伊朗', '以色列', '加沙地带', '导弹袭击', '防空系统', '无人机',
  // 国内重大要闻与政策治理
  '中金公司', '信达证券', '东兴证券', '吸收合并', '股票停牌', '国常会', '央行降准', '专项债',
  '超长期特别国债', '特别国债', '商务部', '证监会', '公募基金', '首批主动ETF', '宁德时代', '泰金新能',
  '特斯拉FSD', '深水海纳', 'ST文峰', '特锐德'
];

// 智能实体关键词提取器：提取 2~3 个核心实体主语 + 1 个关键谓语动词
// 保证搜索引擎交叉查错精准度，彻底消除 "三大期指 期指" 等切词重复

const ACTION_VERBS = [
  '吸收合并', '加征关税', '突发泥石流', '紧急抢通',
  '飙升', '暴跌', '大涨', '大跌', '反弹', '走高', '跳水', '承压', '重挫',
  '加息', '降息', '降准', '缩表', '违约', '破产', '清盘',
  '空袭', '停电', '遭袭', '开火', '停火', '增兵', '撤军', '制裁',
  '交付', '量产', '涨价', '提价', '断航', '抢通', '塌方',
  '合并', '重组', '停牌', '复牌', '调查', '通报', '立案', '下达', '获批', '磋商'
];

export function extractSearchKeywords(rawTitle: string, source?: string): string {
  if (!rawTitle) return '全球宏观 核心指标 市场动向';

  // 1. 去除开头的【分类/标签】前缀
  let clean = rawTitle.replace(/^[【\[]([^】\]]+)[】\]]\s*/, '').trim();

  // 2. 去除日期、时间前缀与电讯套话
  clean = clean
    .replace(/^(?:本日|今日|\d{1,2}月\d{1,2}日)?\s*\d{1,2}:\d{2}(?:\s*（[^）]+）)?\s*，?\s*/, '')
    .replace(/^.*?讯\s*——\s*/, '')
    .replace(/（[^）]*?(?:快讯|直发|电讯|通报|原创)[^）]*?）/g, '')
    .trim();

  const foundEntities: string[] = [];

  // 安全实体添加器：深度执行子串与词根去重（若已有“三大期指”，自动抑制“期指”）
  const addEntity = (entity: string) => {
    if (!entity || entity.length < 2) return;
    // 如果已有词汇完全包含该候选词，则跳过更短的冗余子词
    if (foundEntities.some((e) => e.includes(entity))) return;
    // 如果该新候选词包含了已有较短词，则用更长更精准的词予以升级替换
    for (let i = foundEntities.length - 1; i >= 0; i--) {
      if (entity.includes(foundEntities[i])) {
        foundEntities.splice(i, 1);
      }
    }
    foundEntities.push(entity);
  };

  // 3. 字典优先匹配：按长度倒序排列，优先命中完整专业复合实体
  const sortedDict = [...CORE_ENTITIES_DICT].sort((a, b) => b.length - a.length);
  for (const entity of sortedDict) {
    if (clean.includes(entity)) {
      addEntity(entity);
      if (foundEntities.length >= 3) break;
    }
  }

  // 4. 提取书名号/双引号内的专有名词
  const quoteMatches = clean.match(/[「“『《]([^」”』》]+)[」”』》]/g);
  if (quoteMatches) {
    for (const q of quoteMatches) {
      const term = q.slice(1, -1).trim();
      if (term.length >= 2 && term.length <= 10) {
        addEntity(term);
        if (foundEntities.length >= 3) break;
      }
    }
  }

  // 5. 提取英文机构/资产代号 (如 CPI, TSMC, NVDA, Fed, OpenAI, ASML, WTI, Brent)
  const codeMatches = clean.match(/\b[A-Za-z]{2,8}\b/g);
  if (codeMatches) {
    for (const code of codeMatches) {
      if (!['and', 'the', 'for', 'with', 'from', 'this'].includes(code.toLowerCase())) {
        if (!foundEntities.some((e) => e.toLowerCase() === code.toLowerCase())) {
          addEntity(code);
          if (foundEntities.length >= 3) break;
        }
      }
    }
  }

  // 6. 优先提取核心动词/谓语（主语 + 动词模式，极大提升 Bing/Google 查错直达率）
  let foundAction = '';
  for (const verb of ACTION_VERBS) {
    if (clean.includes(verb) && !foundEntities.some((e) => e.includes(verb))) {
      foundAction = verb;
      break;
    }
  }

  // 7. 如果提取到的实体词少于2个，使用自然断句补充短语
  if (foundEntities.length < 2) {
    const segments = clean
      .split(/[:：,，。；;\s]+/)
      .filter((s) => s.length >= 2 && s.length <= 8)
      .filter((s) => !/^[0-9.%+-]+$/.test(s)) // 剔除纯数字百分比
      .filter((s) => !['表示', '指出', '认为', '强调', '宣布', '举行', '进行', '跌', '涨', '报', '点'].includes(s));

    for (const seg of segments) {
      addEntity(seg);
      if (foundEntities.length >= 2) break;
    }
  }

  // 拼接「核心主语实体 + 关键动作谓语」
  const finalParts = [...foundEntities.slice(0, 3)];
  if (foundAction && !finalParts.includes(foundAction)) {
    finalParts.push(foundAction);
  }

  return finalParts.join(' ') || '全球宏观 核心指标 市场动向';
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
