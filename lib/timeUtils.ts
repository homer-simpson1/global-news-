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
