'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 兼容所有手机端、桌面端、微信内置浏览器的滚动坐标获取
      const y =
        window.pageYOffset ||
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      // 只要滚动超过 70px（离开顶端导航），立即浮现
      setIsVisible(y > 70);
    };

    // 挂载时立即执行一次状态检查
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    // 兼容部分不支持 window.scrollTo smooth 的老旧移动浏览器
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="一键回到页面顶端"
      title="一键回到页面顶端"
      className={`fixed right-4 sm:right-6 md:right-8 bottom-6 sm:bottom-8 z-50 flex flex-col items-center justify-center w-12 h-12 md:w-13 md:h-13 rounded-2xl transition-all duration-300 shadow-2xl group cursor-pointer ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-6 scale-90 pointer-events-none'
      } bg-slate-900 dark:bg-slate-900 text-white dark:text-amber-400 border-2 border-slate-700/90 dark:border-amber-500/70 hover:border-blue-500 dark:hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:scale-110 active:scale-95`}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5] transition-transform duration-200 group-hover:-translate-y-1" />
      <span className="text-[9px] font-black tracking-widest leading-none mt-0.5 opacity-90 font-mono">
        TOP
      </span>
    </button>
  );
}
