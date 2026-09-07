// 智能新闻关键词提取器，用于一键交叉搜索核验查错

export function extractSearchKeywords(rawTitle: string, source?: string): string {
  if (!rawTitle) return '';

  // 1. 去除开头的【分类/标签】前缀
  let clean = rawTitle.replace(/^[【\[]([^】\]]+)[】\]]\s*/, '').trim();

  // 2. 去除琐碎时间前缀与电讯格式套话
  clean = clean
    .replace(/^本日\s*\d{1,2}:\d{2}\s*（[^）]+）\s*，?\s*/, '')
    .replace(/^.*?讯\s*——\s*/, '')
    .replace(/（[^）]*?(?:快讯|直发|电讯|通报|原创)[^）]*?）/g, '')
    .trim();

  // 3. 提取核心专有名词（优先抓取书名号、引号、关键指标数值）
  const quotedTerms: string[] = [];
  const quoteMatches = clean.match(/[「“『《]([^」”』》]+)[」”』》]/g);
  if (quoteMatches) {
    quoteMatches.forEach(q => {
      const term = q.slice(1, -1).trim();
      if (term.length >= 2 && term.length <= 15) {
        quotedTerms.push(term);
      }
    });
  }

  // 4. 清理标点符号，提取主干
  let coreText = clean
    .replace(/[「“『《」”』》]/g, ' ')
    .replace(/[，,。；;！!？?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 5. 如果有冒号，通常前半部分是主体机构/人物，后半部分是核心事件
  const colonParts = coreText.split(/[:：]/);
  if (colonParts.length >= 2) {
    const subject = colonParts[0].trim();
    const event = colonParts[1].trim();
    const eventSnippet = event.slice(0, 25).trim();
    coreText = `${subject} ${eventSnippet}`;
  } else {
    coreText = coreText.slice(0, 35).trim();
  }

  // 6. 如果提取到了特定的专有名词且尚未包含在内，追加在前面
  for (const term of quotedTerms) {
    if (!coreText.includes(term)) {
      coreText = `${term} ${coreText}`;
    }
  }

  // 7. 去除常见连接停用词
  const stopWords = ['表示', '指出', '认为', '强调', '宣布', '召开', '举行', '进行', '迎来', '成为', '正在'];
  for (const sw of stopWords) {
    coreText = coreText.replace(new RegExp(`\\b${sw}\\b`, 'g'), ' ');
  }

  const finalKeywords = coreText.replace(/\s+/g, ' ').trim();
  return finalKeywords || clean.slice(0, 30);
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
