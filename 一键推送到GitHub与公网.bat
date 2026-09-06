@echo off
chcp 65001 >nul
cls
echo =======================================================
echo     [全球决策情报终端] 一键推送到 GitHub 永久公网托管
echo =======================================================
echo.
echo 第一步：请在浏览器打开新建仓库页面（几秒钟完成）：
echo https://github.com/new
echo.
echo 只要输入任意仓库名称（例如：global-news），点击页面底部的绿色 [Create repository] 按钮。
echo.
echo 第二步：复制新建好的仓库地址（以 https://github.com/ 开头，以 .git 结尾）
echo 例如：https://github.com/您的用户名/global-news.git
echo.
set /p REPO_URL=请将您的 GitHub 仓库链接粘贴在此处并按回车: 

if "%REPO_URL%"=="" (
  echo 提示：未检测到输入内容，操作已取消。
  pause
  exit /b
)

echo.
echo 正在连接您的 GitHub 仓库并推送最新代码...
"C:\Program Files\Git\cmd\git.exe" remote remove origin 2>nul
"C:\Program Files\Git\cmd\git.exe" remote add origin %REPO_URL%
"C:\Program Files\Git\cmd\git.exe" branch -M main
"C:\Program Files\Git\cmd\git.exe" push -u origin main

if %errorlevel% neq 0 (
  echo.
  echo 提示：如果系统弹出了 GitHub 网页登录窗口，请点击 [Authorize] 授权后重新按回车即可。
  pause
  exit /b
)

echo.
echo =======================================================
echo  恭喜！代码已全部成功推送到您的 GitHub！
echo =======================================================
echo.
echo 第三步：绑定 Vercel 生成永久公网网址（只需 30 秒，终身免费）：
echo 1. 打开 Vercel 官网：https://vercel.com
echo 2. 点击右上角 [Log In] 或 [Sign Up]，选择 [Continue with GitHub]（直接用 GitHub 登录）
echo 3. 登录后会自动列出您的仓库，点击该仓库右侧的 [Import] 按钮
echo 4. 在新页面直接点击蓝色的 [Deploy] 按钮！
echo.
echo 稍等 30 秒，Vercel 就会给您一个永久可用的全球公网网址（如 https://global-news.vercel.app）！
echo 所有人随时随地都能在线看，完全不需要您的电脑开机！
echo =======================================================
pause
