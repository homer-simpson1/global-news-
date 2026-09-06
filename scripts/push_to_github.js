const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const projectDir = path.resolve(__dirname, '..');
const gitExe = 'C:\\Program Files\\Git\\cmd\\git.exe';

console.clear();
console.log('===========================================================');
console.log('       【全球决策情报终端】一键同步 GitHub 与公网部署');
console.log('===========================================================');
console.log('');
console.log('【第一步：在 GitHub 上创建一个空白仓库】');
console.log('1. 正在为您自动打开浏览器新建仓库页面：https://github.com/new');

try {
  execSync('start https://github.com/new');
} catch (e) {}

console.log('2. 在打开的网页中：');
console.log('   - 输入任意仓库名称（例如：global-news）');
console.log('   - 保持默认 Public');
console.log('   - 点击底部绿色的 [Create repository] 按钮');
console.log('3. 复制生成的仓库地址（例如：https://github.com/你的用户名/global-news.git）');
console.log('');
console.log('-----------------------------------------------------------');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('👉 请将您的 GitHub 仓库链接粘贴在此处并按回车: ', (repoUrl) => {
  const cleanUrl = (repoUrl || '').trim();
  if (!cleanUrl || !cleanUrl.startsWith('http')) {
    console.log('\n❌ 输入的链接无效，请输入以 https:// 开头的完整 GitHub 仓库地址。');
    rl.close();
    return;
  }

  console.log(`\n🚀 正在连接远程仓库并推送代码: ${cleanUrl} ...`);

  try {
    // 确保本地已 commit
    execSync(`"${gitExe}" remote remove origin`, { cwd: projectDir, stdio: 'ignore' });
  } catch (e) {}

  try {
    execSync(`"${gitExe}" remote add origin "${cleanUrl}"`, { cwd: projectDir, stdio: 'inherit' });
    execSync(`"${gitExe}" branch -M main`, { cwd: projectDir, stdio: 'inherit' });
    console.log('📦 正在上传代码到 GitHub，请稍候...');
    execSync(`"${gitExe}" push -u origin main`, { cwd: projectDir, stdio: 'inherit' });

    console.log('\n===========================================================');
    console.log('🎉 恭喜！代码已 100% 成功推送到您的 GitHub 仓库！');
    console.log('===========================================================');
    console.log('');
    console.log('【第二步：生成所有人都能访问的永久网址（只需30秒）】');
    console.log('1. 打开 Vercel 官网：https://vercel.com');
    console.log('2. 点击右上角 [Log In]，选择 [Continue with GitHub]（用刚刚的账号登录）');
    console.log('3. 页面会自动看到您的仓库，点击它右侧的 [Import] 按钮');
    console.log('4. 在随后出现的页面直接点击蓝色的 [Deploy] 按钮！');
    console.log('');
    console.log('✨ 30秒后 Vercel 会生成永久可用的全球网址（如 https://global-news.vercel.app）！');
    console.log('   无论手机、电脑、平板还是微信分享，任何人都能 24 小时随时在线看！');
    console.log('===========================================================');
  } catch (err) {
    console.log('\n⚠️ 推送未完成，请检查：');
    console.log('1. 如果弹出了 GitHub 登录验证网页，请在浏览器中点击 [Authorize] 授权。');
    console.log('2. 请确保输入的仓库地址属于您当前登录的 GitHub 账号。');
  }

  rl.close();
});
