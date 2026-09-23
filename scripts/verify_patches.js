const fs = require('fs');
const log = fs.readFileSync('C:/Users/23972/.gemini/antigravity/brain/780434d3-dc6b-4d6c-90ed-3ebb045c7c20/.system_generated/tasks/task-1546.log', 'utf8');

console.log('=== PATCH VERIFICATION ===\n');

// Patch 4: 起因于受
console.log('P4 "起因于受/因/由于":', log.includes('起因于受') || log.includes('起因于因为') || log.includes('起因于由于') ? '❌ FAIL' : '✅ PASS');

// Patch 5: 双句号
console.log('P5 双句号 "。。":', log.includes('。。') ? '❌ FAIL' : '✅ PASS');

// Patch 2: 企业战略兜底
const corpCount = (log.match(/涉事主体稳步推进/g) || []).length;
console.log('P2 "涉事主体稳步推进" 剩余:', corpCount, '处', corpCount === 0 ? '✅' : '⚠️');

// Patch 3: 媒体信源泄漏到 who
const lines = log.split('\n');
const whoLines = lines.filter(l => l.includes('who='));
const mediaWhoLeaks = whoLines.filter(l => 
  l.includes('报道"') || l.includes('专线"') || l.includes('电讯"') ||
  l.includes('Zaobao报道') || l.includes('全球宏观专线报道') || l.includes('大宗商品航运报道')
);
console.log('P3 媒体信源who泄漏:', mediaWhoLeaks.length, '处', mediaWhoLeaks.length === 0 ? '✅' : '⚠️');
if (mediaWhoLeaks.length > 0) mediaWhoLeaks.forEach(l => console.log('  >> ', l.trim()));

// Patch 2: 反腐正确定性
const anticorr = lines.filter(l => l.includes('穿透治理与反腐'));
console.log('P2 反腐正确定性:', anticorr.length, '条', anticorr.length > 0 ? '✅' : '⚠️');

// Patch 1: A股开盘
const aShare = lines.filter(l => l.includes('A股盘面开盘'));
console.log('P1 A股开盘专属分支:', aShare.length, '条');

// New: 债券发行
const bond = lines.filter(l => l.includes('财政部门统筹发债'));
console.log('新增 债券发行分支:', bond.length, '条', bond.length > 0 ? '✅' : '⚠️');

// New: 汇率
const fx = lines.filter(l => l.includes('汇率制度稳定'));
console.log('新增 汇率分支:', fx.length, '条');

console.log('\n=== WHO FIELD SUMMARY ===');
whoLines.forEach(l => console.log(l.trim()));
