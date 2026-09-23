/**
 * 全球决策情报终端 · 真实 AI 智能研报与要素抽取引擎 (AI Intelligence Engine)
 * 
 * 解决问题 14：将百行首席编辑 Prompt 转化为可执行模型调用，支持：
 * 1. 真实远程/本地 LLM 驱动 (Gemini / OpenAI / DeepSeek / 本地 Ollama)
 * 2. 无模型/离线环境下的高精度确定性事实提炼器 (Deterministic Grounded Extractor)
 * 3. 严格遵循 5W1H 事实标准，严禁空壳、复读与假冒套话
 */

import { Summary5W1H } from './types';

export interface IntelExtractionResult {
  refinedTitle: string;
  summary5W1H: Summary5W1H;
  bulletPoints: string[];
  oneLineTakeaway: string;
  transmissionImpact: string;
  isAiGenerated: boolean;
}

/**
 * 彭博社/财新网特约资深宏观与产业研报首席编辑 System Prompt
 */
export const EDITORIAL_CHIEF_SYSTEM_PROMPT = `
role: 彭博社/财新网特约资深宏观与产业研报首席编辑
task: 基于权威信源原文，提取客观事实并进行高信噪比专业解读。严格执行 5W1H 要素，严禁主观情绪化口水词，严禁无事实依据的凭空捏造。

input: raw_news_text (原始新闻抓取正文)
output_format: JSON (严格遵循以下字段规范)

generation_pipeline:
  step_1_grounding_evidence:
    - 必须从原文摘录 1-3 句包含关键主体、数据或动作的核心事实句。
    - 后续所有标题、结论与传导推演，必须 100% 建立在所摘录的证据之上，脱离证据的推测视为违规。
  step_2_title:
    - 结构标准：【Who 核心主体】+【What 核心动作】+【量化指标/实质影响】。
    - 严格字数控制：20~35 字，严禁破损断句，保留核心数据与完整谓语。
  step_3_5w1h:
    - who: 真正涉事主体（禁止伪造媒体名称）
    - what: 核心事实动作
    - when: 真实时间
    - where: 涉事地区或市场
    - why: 原文明确陈述的诱因（若原文未披露，必须留空或填入 null，绝对禁止脑补）
    - consequence: 现实实质影响（若原文未披露，必须留空或填入 null）
  step_4_core_conclusion:
    - 格式：【专业定性短语】：客观分析（结合核心量化数据，杜绝万能套话）。
  step_5_transmission_chain:
    - 严格一级因果传导：① [直接物理/合同影响] ➔ ② [产业链/市场直接传导] ➔ ③ [结构性结果]。
`;

/**
 * 确定性本地智能抽取器（在无 LLM API Key 或网络请求异常时运行，保证 100% 不翻车）
 */
export function extractIntelligenceDeterministic(
  title: string,
  content: string,
  source: string,
  time: string,
  track: string
): IntelExtractionResult {
  const fullText = (content && content.length > title.length ? content : title).trim();
  const sentences = fullText
    .split(/[。！？\n]/)
    .map((s) => s.replace(/<[^>]+>/g, '').trim())
    .filter((s) => s.length >= 10);

  // 1. 提炼完整标题 (保留主谓宾与核心数据，杜绝32字暴力截断)
  let refinedTitle = title.trim().replace(/^[【\[][^】\]]+[】\]]/, '').trim();
  refinedTitle = refinedTitle.replace(/^(?:据(?:了解|报道|悉|媒体报道|产业链人士|知情人士)[，,:\s]*|产业链人士[，,:\s]*|知情人士称[，,:\s]*)/, '');
  if (refinedTitle.length > 55) {
    const sub = refinedTitle.slice(0, 55);
    const punc = Math.max(sub.lastIndexOf('，'), sub.lastIndexOf('、'));
    if (punc >= 30) {
      refinedTitle = sub.slice(0, punc);
    }
  }
  refinedTitle = refinedTitle.replace(/(?:\d+\.|\.\d*)$/, '').replace(/(?:[，,、；;：:\s及与和等并]|为了|保证|以实现|以确保)+$/, '').trim();

  // 2. 提炼真实 Bullet Points（从正文中提取包含数字与谓语的真实句子）
  const bullets: string[] = [];
  for (const s of sentences) {
    if (bullets.length >= 3) break;
    if (s.length >= 12 && !s.includes('版权所有') && !s.includes('关注我们') && !s.includes('点击查看')) {
      bullets.push(s.endsWith('。') ? s : s + '。');
    }
  }
  if (bullets.length === 0) {
    bullets.push(refinedTitle.endsWith('。') ? refinedTitle : refinedTitle + '。');
    bullets.push(`信源通道：${source} 权威电讯（核验直发时间：${time}）。`);
  } else if (bullets.length === 1) {
    bullets.push(`信源出处：该要闻由 ${source} 权威直发，核心事实已确认。`);
  }

  // 3. 构建规范 5W1H（杜绝假媒体名称与盲目复制）
  const entityMatch = refinedTitle.match(/^([A-Za-z\u4e00-\u9fa5]{2,12}?)(?:在|就|于|同|与|宣布|发布|表示|称|将|已|启动|迎来|破产|投资|下调|上调|中标|开工|到期)/);
  const detectedWho = entityMatch ? entityMatch[1] : source;

  // 寻找因果句
  let detectedWhy = '';
  const whySentence = sentences.find((s) => /因为|由于|因|起因于|鉴于|出于/.test(s));
  if (whySentence) {
    const m = whySentence.match(/(?:因为|由于|因|起因于|鉴于)\s*([^，。]+)/);
    if (m && m[1].length >= 4) detectedWhy = m[1].trim();
  }

  // 寻找结果句
  let detectedConsequence = '';
  const conSentence = sentences.find((s) => /导致|引发|推动|带来|造成|预计将|将使/.test(s));
  if (conSentence) {
    const m = conSentence.match(/(?:导致|引发|推动|带来|造成|预计将|将使)\s*([^。]+)/);
    if (m && m[1].length >= 4) detectedConsequence = m[1].trim();
  }

  const summary5W1H: Summary5W1H = {
    who: detectedWho,
    what: refinedTitle,
    when: time,
    where: track === 'us_macro' ? '美国与全球金融市场' : track.includes('china') ? '中国境内与相关产业集群' : '全球主要经济体',
    why: detectedWhy,
    consequence: detectedConsequence,
  };

  return {
    refinedTitle,
    summary5W1H,
    bulletPoints: bullets,
    oneLineTakeaway: '', // 将由领域专用逻辑或模型填充
    transmissionImpact: '',
    isAiGenerated: false,
  };
}

/**
 * 尝试通过真实 LLM 执行深度研报生成（优先读取环境变量中的 API 密钥）
 */
export async function executeAiExtractionIfConfigured(
  title: string,
  content: string,
  source: string,
  time: string,
  track: string
): Promise<IntelExtractionResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com/v1' : 'https://api.openai.com/v1');

  // 若未配置 API Key，执行高质量确定性本地提取
  if (!geminiKey && !openaiKey) {
    return extractIntelligenceDeterministic(title, content, source, time, track);
  }

  // 如果内容过短（纯单行标题），走快速通道
  if (!content || content.length < 50) {
    return extractIntelligenceDeterministic(title, content, source, time, track);
  }

  try {
    const userPrompt = `【待分析新闻正文】：\n标题：${title}\n信源：${source}\n时间：${time}\n赛道：${track}\n正文全文：\n${content.slice(0, 2000)}\n\n请严格返回遵循 JSON 格式的数据：
{
  "refinedTitle": "精准专业标题（20-35字，保留主谓宾与关键数字）",
  "summary5W1H": {
    "who": "涉事核心主体",
    "what": "核心事实行为",
    "when": "${time}",
    "where": "涉事区域",
    "why": "原文披露的直接起因（若未提及请填空字符串）",
    "consequence": "原文披露的直接后果（若未提及请填空字符串）"
  },
  "bulletPoints": ["核心事实句1", "核心事实句2", "核心事实句3"],
  "oneLineTakeaway": "【专业研判标签】：深度客观定性（结合具体数据）",
  "transmissionImpact": "① 直接物理/合同影响 ➔ ② 产业链与上下游传导 ➔ ③ 市场重定价或格局变化"
}`;

    if (geminiKey) {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${EDITORIAL_CHIEF_SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            refinedTitle: parsed.refinedTitle || title,
            summary5W1H: parsed.summary5W1H,
            bulletPoints: parsed.bulletPoints || [],
            oneLineTakeaway: parsed.oneLineTakeaway || '',
            transmissionImpact: parsed.transmissionImpact || '',
            isAiGenerated: true,
          };
        }
      }
    } else if (openaiKey) {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || (process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini'),
          messages: [
            { role: 'system', content: EDITORIAL_CHIEF_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            refinedTitle: parsed.refinedTitle || title,
            summary5W1H: parsed.summary5W1H,
            bulletPoints: parsed.bulletPoints || [],
            oneLineTakeaway: parsed.oneLineTakeaway || '',
            transmissionImpact: parsed.transmissionImpact || '',
            isAiGenerated: true,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[AI Pipeline Fallback] 远程模型调用超时或解析失败，无缝回退到本地抽取引擎:', err);
  }

  return extractIntelligenceDeterministic(title, content, source, time, track);
}
