'use client';

export default function ChangelogButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('show-changelog'))}
      className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm transition-all hover:scale-110 active:scale-90 shadow-sm"
      title="更新日志"
    >
      📋
    </button>
  );
}
