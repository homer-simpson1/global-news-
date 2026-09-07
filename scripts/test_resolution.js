const fs = require('fs');
const { execFileSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = 'C:/Users/23972/.gemini/antigravity/scratch/global-intelligence-terminal/public/morning_paper.html';
const outImgPath = 'C:/Users/23972/.gemini/antigravity/scratch/global-intelligence-terminal/public/test_res.png';

execFileSync(chromePath, [
  '--headless',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1200,1190',
  '--force-device-scale-factor=2',
  `--screenshot=${outImgPath}`,
  `file:///${htmlPath}`
]);

const buf = fs.readFileSync(outImgPath);
console.log('Resulting Dims:', buf.readUInt32BE(16), 'x', buf.readUInt32BE(20));
console.log('File size:', buf.length, 'bytes');
