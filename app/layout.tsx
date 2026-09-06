import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '全球宏观与核心决策情报终端',
  description: '专为宏观认知拓展、美股与日韩台半导体投资、俄乌美伊战局、国内金融与社会治理追踪打造的高信噪比决策级情报终端。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
