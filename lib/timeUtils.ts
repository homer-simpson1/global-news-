/**
 * 时间差计算与时效性辅助工具
 * 用于动态判断电讯是 24 小时内的“一手速递”还是处于后续发酵期的“重点追踪/持续发酵”
 */

export function getTimeDiffHours(dateStr: string): number {
  if (!dateStr) return 999;
  const str = dateStr.trim();

  // 1. 相对时间处理
  if (str.includes('刚刚') || str.includes('秒前') || str.includes('分钟前')) {
    return 0.5;
  }
  const hourMatch = str.match(/(\d+)\s*小时前/);
  if (hourMatch) {
    return parseFloat(hourMatch[1]);
  }
  const dayMatch = str.match(/(\d+)\s*天前/);
  if (dayMatch) {
    return parseFloat(dayMatch[1]) * 24;
  }

  // 2. 基准当前时间 (2026年9月8日)
  const now = new Date();

  // 3. 中文格式解析：例如 "9月8日 11:30" 或 "2026年9月8日 11:30"
  const cnMatch = str.match(/(?:(\d{4})年)?\s*(\d{1,2})月(\d{1,2})日\s*(\d{1,2}):(\d{1,2})/);
  if (cnMatch) {
    const year = cnMatch[1] ? parseInt(cnMatch[1], 10) : now.getFullYear();
    const month = parseInt(cnMatch[2], 10) - 1;
    const day = parseInt(cnMatch[3], 10);
    const hour = parseInt(cnMatch[4], 10);
    const minute = parseInt(cnMatch[5], 10);
    const targetDate = new Date(year, month, day, hour, minute);
    const diffHours = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60);
    return isNaN(diffHours) ? 999 : diffHours;
  }

  // 4. 标准 ISO / RFC 字符串解析
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const diffHours = (now.getTime() - parsed) / (1000 * 60 * 60);
    return isNaN(diffHours) ? 999 : diffHours;
  }

  return 999;
}

/**
 * 判断事件是否在 24 小时发布窗口内
 */
export function isWithin24Hours(dateStr: string, timeWindow?: string): boolean {
  if (timeWindow === 'HISTORIC') return false;
  const diff = getTimeDiffHours(dateStr);
  if (diff >= 0 && diff <= 24) return true;
  if (diff < 0) return true; // 时钟轻微漂移视为最新
  return false;
}

/**
 * 动态计算特大灾害持续追踪天数（基于始发日期与当前自然日历差动态递增，彻底告别写死静态天数不更新的缺陷）
 * 例如：始发于 2026年8月26日，截至 2026年9月11日，动态返回 17 天（进入第 17 天）
 */
export function calculateTrackedDays(startDateStr?: string): number {
  if (!startDateStr) return 1;
  const now = new Date();
  let startYear = now.getFullYear();
  let startMonth = 8;
  let startDay = 26;

  const cnMatch = startDateStr.match(/(?:(\d{4})年)?\s*(\d{1,2})月(\d{1,2})日/);
  if (cnMatch) {
    startYear = cnMatch[1] ? parseInt(cnMatch[1], 10) : now.getFullYear();
    startMonth = parseInt(cnMatch[2], 10);
    startDay = parseInt(cnMatch[3], 10);
  } else {
    const isoMatch = startDateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      startYear = parseInt(isoMatch[1], 10);
      startMonth = parseInt(isoMatch[2], 10);
      startDay = parseInt(isoMatch[3], 10);
    }
  }

  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const diffCalendarDays = Math.round((todayUtc - startUtc) / (1000 * 60 * 60 * 24));
  // 始发当日即为第 1 天；随着每一天午夜跨过，天数自动 +1
  return Math.max(1, diffCalendarDays + 1);
}

