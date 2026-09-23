const fs = require('fs');
const path = require('path');
const ts = require('typescript');

require.extensions['.ts'] = function(module, filename) {
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

// Mock Next.js path resolution if needed
const moduleAlias = require('module');
const origResolve = moduleAlias._resolveFilename;
moduleAlias._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    request = path.join(__dirname, '..', request.slice(2));
  }
  return origResolve.call(this, request, parent, isMain, options);
};

async function main() {
  console.log('--- Testing fetchAggregatedNews(true) Live Crawl ---');
  const { fetchAggregatedNews, getFlashBriefs } = require('../lib/rssFetcher.ts');
  const items = await fetchAggregatedNews(true);
  console.log(`\nFetched ${items.length} total news items from live feed.`);

  const stale99 = items.filter(x => JSON.stringify(x).includes('9月9日'));
  console.log(`Items with "9月9日": ${stale99.length}`);

  const tracks = {};
  items.forEach(item => {
    tracks[item.track] = (tracks[item.track] || 0) + 1;
  });
  console.log('Track distribution:', tracks);

  const koreaItem = items.find(x => x.title.includes('韩国'));
  console.log('Korea item:', JSON.stringify(koreaItem, null, 2));

  const sampleItems = items.slice(0, 5).map(x => ({
    title: x.title,
    track: x.track,
    publishedAt: x.publishedAt,
    source: x.source,
  }));
  console.log('\nSample items:', JSON.stringify(sampleItems, null, 2));

  const briefs = await getFlashBriefs(false);
  console.log(`\nFetched ${briefs.length} flash briefs.`);
  const staleBriefs = briefs.filter(x => JSON.stringify(x).includes('9月9日'));
  console.log(`Flash briefs with "9月9日": ${staleBriefs.length}`);
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
