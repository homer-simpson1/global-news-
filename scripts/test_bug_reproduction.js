const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (req, p, m, o) {
  if (req.startsWith('@/')) req = path.join(ROOT, req.slice(2));
  return origResolve.call(this, req, p, m, o);
};
require.extensions['.ts'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  module._compile(compiled.outputText, filename);
};

const { classifyTrack } = require('../lib/rssFetcher.ts');
const { autoCorrectTrack } = require('../lib/selfHealingEngine.ts');

const item1 = {
  title: '“券商一哥”掌门将换人，邹迎光接棒张佑君',
  content: '华尔街见闻多方求证获悉，9月22日，中信证券内部已就相关人事调整作出安排，张佑君将退休，现任总经理邹迎光接棒。'
};

const item2 = {
  title: '伊朗称通过卡塔尔与美国会谈是为了转达诉求',
  content: '伊朗外交部发言人Esmail Baghaei称，通过卡塔尔作为中间人与美国会谈的目的是转达德黑兰的诉求。'
};

console.log('--- Item 1 (券商一哥) ---');
const { FOREIGN_ENTITIES } = require('../lib/guardrails.ts');
const t1 = (item1.title + ' ' + item1.content).toLowerCase();
console.log('US_ALL match:', t1.match(FOREIGN_ENTITIES.US_ALL));
console.log('US_MACRO match:', t1.match(FOREIGN_ENTITIES.US_MACRO));
const track1 = classifyTrack(item1);
console.log('classifyTrack:', track1);
const healed1 = autoCorrectTrack(track1, item1.title, item1.content);
console.log('autoCorrectTrack:', healed1);

console.log('\n--- Item 2 (伊朗通过卡塔尔与美国会谈) ---');
const t2 = (item2.title + ' ' + item2.content).toLowerCase();
console.log('WAR_DEFENSE:', FOREIGN_ENTITIES.WAR_DEFENSE.test(t2));
console.log('item2.title:', item2.title);
console.log('test line 1295:', /(?:赵乐际|王毅|李强|习近平|外交部|全国人大|政协).*?(?:会见|会谈|接见|访问|外长|议长|众议长|参议长|总理|总统|公使)/.test(item2.title));
console.log('test line 1359 (商务部|外交部):', /商务部|外交部/.test(t2) && /美方|美国|制裁|法案|关税|清单|出口管制|格雷厄姆/.test(t2));
const track2 = classifyTrack(item2);
console.log('classifyTrack:', track2);
const healed2 = autoCorrectTrack(track2, item2.title, item2.content);
console.log('autoCorrectTrack:', healed2);
