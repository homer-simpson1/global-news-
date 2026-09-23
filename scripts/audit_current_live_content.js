const fs = require('fs');
const path = require('path');
const ts = require('typescript');

require.extensions['.ts'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      baseUrl: path.resolve(__dirname, '..'),
      paths: {
        '@/*': ['./*'],
      },
    },
  });
  module._compile(compiled.outputText, filename);
};

const moduleAlias = require('module');
const origResolve = moduleAlias._resolveFilename;
moduleAlias._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    request = path.join(__dirname, '..', request.slice(2));
  }
  return origResolve.call(this, request, parent, isMain, options);
};

async function audit() {
  const { fetchAggregatedNews } = require('../lib/rssFetcher.ts');
  const items = await fetchAggregatedNews(true);
  console.log(`\n=== 实时采编流审计报告（共抓取并处理 ${items.length} 条资讯）===\n`);

  items.forEach((n, i) => {
    console.log(`[${i + 1}] [${n.track}] ${n.title}`);
    console.log(`    信源: ${n.source} | 时间: ${n.publishedAt}`);
    console.log(`    正文长度: ${(n.content || '').length} 字符`);
    console.log(`    核心结论: ${n.oneLineTakeaway}`);
    console.log(`    因果传导: ${n.transmissionImpact}`);
    console.log(`    5W1H: who="${n.summary5W1H?.who}" | why="${n.summary5W1H?.why}" | con="${n.summary5W1H?.consequence}"`);
    console.log(`    事实通报: ${n.summaryParagraph}`);
    console.log(`    纪要条数: ${(n.bulletPoints || []).length} | 首条: ${n.bulletPoints?.[0] || '无'}`);
    console.log('--------------------------------------------------------------------------------');
  });
}

audit().catch(console.error);
