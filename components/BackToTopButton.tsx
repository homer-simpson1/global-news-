'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 260) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="一键回到页面顶端"
      title="一键回到页面顶端"
      className={`fixed right-4 md:right-8 bottom-6 md:bottom-9 z-40 flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl transition-all duration-300 shadow-xl group backdrop-blur-md ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      } bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/90 hover:border-blue-500/60 dark:hover:border-amber-500/60 hover:text-blue-600 dark:hover:text-amber-400 hover:shadow-2xl hover:scale-105 active:scale-95`}
    >
      <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
      <span className="text-[9px] font-bold tracking-wider leading-none mt-0.5 opacity-80 group-hover:opacity-100 font-mono">
        TOP
      </span>
    </button>
  );
}
