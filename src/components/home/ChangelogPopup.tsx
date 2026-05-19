'use client';

import { useState, useEffect, useCallback } from 'react';
import changelogs from '@/data/changelogs.json';

export default function ChangelogPopup() {
  const [visible, setVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const latestVersion = changelogs.versions[0];
  const olderVersions = changelogs.versions.slice(1);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (latestVersion) {
      localStorage.setItem('changelog_seen_version', latestVersion.version);
    }
  }, [latestVersion]);

  useEffect(() => {
    if (!latestVersion) {
      setInitialized(true);
      return;
    }
    const seen = localStorage.getItem('changelog_seen_version');
    if (seen !== latestVersion.version) {
      setVisible(true);
    }
    setInitialized(true);
  }, [latestVersion]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      dismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [visible, dismiss]);

  if (!initialized || !visible || !latestVersion) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={dismiss}>
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto mx-0 sm:mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2.5 py-1 rounded-full">
                {latestVersion.version}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{latestVersion.date}</span>
            </div>
            <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 mt-2">
              {latestVersion.title}
            </h2>
          </div>
          <button
            onClick={dismiss}
            className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Current version changes */}
        <div className="space-y-2 mb-5">
          {latestVersion.changes.map((change, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✨</span>
              <span className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{change}</span>
            </div>
          ))}
        </div>

        {/* Older versions */}
        {olderVersions.length > 0 && (
          <details className="group">
            <summary className="text-xs font-bold text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform text-[10px]">▶</span>
              历史更新记录
            </summary>
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
              {olderVersions.map((v) => (
                <div key={v.version}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{v.version}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{v.date}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">{v.title}</p>
                  <ul className="space-y-0.5">
                    {v.changes.map((c, j) => (
                      <li key={j} className="text-[11px] text-gray-500 dark:text-gray-400 pl-3 relative before:content-['·'] before:absolute before:left-1 before:text-gray-300 dark:before:text-gray-600">{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Auto-close indicator */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">5s 后自动关闭</span>
          <button
            onClick={dismiss}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-xs font-bold hover:from-pink-600 hover:to-purple-600 transition-all shadow-md"
          >
            知道了
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
}
