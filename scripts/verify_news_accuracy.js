const fs = require('fs');
const path = require('path');

async function runNewsVerificationCheck() {
  console.log('====================================================');
  console.log('       [全球决策情报终端] 15分钟自动化新闻真实性与准确性巡检');
  console.log('====================================================');
  console.log('巡检执行时间:', new Date().toLocaleString('zh-CN', { hour12: false }));

  try {
    const res = await fetch('http://127.0.0.1:3000/api/verify?force=true');
    if (!res.ok) {
      throw new Error('HTTP 状态异常: ' + res.status);
    }
    const json = await res.json();
    const data = json.data;

    console.log('[核验结果] 状态:', data.overallStatus);
    console.log('[核验结果] 准确性得分:', data.accuracyScore + ' / 100');
    console.log('[核验结果] 合格率:', data.passRate);
    console.log('[核验结果] 检查要闻总数:', data.totalNewsChecked, '条');
    console.log('[核验结果] 合格条数:', data.passedCount, '条');
    console.log('[核验结果] 警告提示:', data.warningCount, '条');
    console.log('[核验结果] 失败条数:', data.failedCount, '条');
    console.log('----------------------------------------------------');
    console.log('关键资产行情交叉验证:');
    for (const q of (data.quoteChecks || []).slice(0, 5)) {
      console.log(' - ' + q.symbol + ': ' + q.price + (q.valid ? ' [有效]' : ' [异常]'));
    }
    console.log('====================================================');
    return data;
  } catch (err) {
    console.error('[FAIL] 15分钟自动化核验失败:', err.message);
  }
}

if (require.main === module) {
  runNewsVerificationCheck();
}

module.exports = { runNewsVerificationCheck };
