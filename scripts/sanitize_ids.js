const fs = require('fs');
const path = require('path');

const seedPath = path.resolve(__dirname, '../data/seedData.ts');
let content = fs.readFileSync(seedPath, 'utf8');

// 将所有暴露爬虫源的 ID (如 wscn-3160810, sina-5078418, em-12345) 转换为专业全球情报编号 (GID-3160810)
content = content.replace(/"(wscn|sina|em)-([0-9a-zA-Z_]+)"/g, '"GID-$2"');

fs.writeFileSync(seedPath, content, 'utf8');
console.log('Successfully sanitized seedData IDs to GID- format!');
