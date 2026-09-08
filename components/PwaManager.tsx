'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle, Sparkles } from 'lucide-react';

export default function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    // 1. 注册 Service Worker 并深度管理版本更迭
    if (typeof window !== 'undefined') {
      // 深度清理历史旧版缓存，确保彻底换代
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (!key.includes('v3.1')) {
              caches.delete(key);
            }
          });
        });
      }

      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
              // 主动向服务端比对最新 sw.js 字节，杜绝等待
              registration.update();

              // 若已有待激活的 worker，立即令其跳过等待
              if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              }

              // 自动检查更新
              registration.addEventListener('updatefound', () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                  installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                      console.log('[PWA] 发现新版本情报终端，自动激活最新部署');
                      installingWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                  };
                }
              });

              // 监听控制器变更，自动刷新获取最新生产脚本
              let refreshing = false;
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                  refreshing = true;
                  window.location.reload();
                }
              });
            })
            .catch((err) => {
              console.warn('[PWA] Service Worker 注册状态:', err);
            });
        });
      }
    }

    // 2. 检测是否已经处于独立 App 沉浸模式 (Standalone)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
      return isStandaloneMode;
    };

    const standalone = checkStandalone();

    // 3. 设备与系统识别
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 4. 监听 Chrome / Edge / 安卓 原生安装事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // 检查用户是否近期已关闭过提示 (3天内不重复弹窗打扰)
      const dismissed = localStorage.getItem('pwa_prompt_dismissed_time');
      if (!dismissed || Date.now() - Number(dismissed) > 3 * 24 * 3600 * 1000) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. 监听已成功安装事件
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    });

    // 6. 如果是 iOS 且非全屏，且未主动关闭过，提示一次快捷指引
    if (isIOSDevice && !standalone) {
      const iosDismissed = localStorage.getItem('pwa_ios_guide_dismissed');
      if (!iosDismissed || Date.now() - Number(iosDismissed) > 3 * 24 * 3600 * 1000) {
        setTimeout(() => setShowPrompt(true), 2500);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!showIOSGuide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape' || e.keyCode === 27) {
        setShowIOSGuide(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showIOSGuide]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 3000);
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed_time', Date.now().toString());
    localStorage.setItem('pwa_ios_guide_dismissed', Date.now().toString());
  };

  // 如果已经在独立 App 全屏中打开，无需任何引导条
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* 底部悬浮/横幅安装提示条 */}
      {showPrompt && !installedSuccess && (
        <aside
          aria-label="PWA 轻应用安装引导"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white border border-blue-500/40 rounded-2xl p-3.5 shadow-2xl shadow-blue-950/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                <Smartphone className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <span>添加至桌面轻应用</span>
                  <span className="px-1.5 py-0.2 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded font-semibold">
                    秒开沉浸
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  像独立 App 一样全屏打开，免去每次输入网址
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? '查看方法' : '一键添加'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                title="暂不添加"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* iOS Safari 专有指引弹窗 */}
      {showIOSGuide && (
        <div
          onClick={() => setShowIOSGuide(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative cursor-default"
          >
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-blue-400 mb-3">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">iPhone / iPad 添加至桌面步骤</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              由于苹果 iOS 权限规则，请在 Safari 浏览器中按照以下两步完成添加，即可享受独立 App 全屏沉浸体验：
            </p>

            <div className="space-y-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 mb-4">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-slate-200">
                  点击 Safari 底部（或顶部地址栏右侧）的 <strong className="text-white font-semibold">“分享”</strong> 图标（带有箭头的方框 <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" />）
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-slate-200">
                  在弹出的菜单中向下轻滑，选择 <strong className="text-white font-semibold">“添加到主屏幕”</strong>（带有加号的方框 <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" />），点击右上角“添加”即可！
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-blue-600/30 text-center"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* 安装成功轻提示 */}
      {installedSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4" />
          <span>轻应用已成功添加至主屏幕！</span>
        </div>
      )}
    </>
  );
}
