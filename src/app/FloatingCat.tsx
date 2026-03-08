'use client'

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function FloatingCat() {
    const pathname = usePathname();

    // 在聊天页面、登录页面、欢迎页面隐藏
    if (pathname === '/chat' || pathname === '/login' || pathname === '/welcome') {
        return null;
    }

    return (
        <Link
            href="/chat"
            className="fixed bottom-6 right-6 z-50 group"
            aria-label="打开聊天"
        >
            {/* 外层呼吸光环 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 opacity-40 group-hover:opacity-60 animate-cat-pulse blur-md scale-110 transition-opacity duration-300" />

            {/* 主体头像容器 */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 shadow-lg shadow-purple-300/40 flex items-center justify-center transform group-hover:scale-110 group-active:scale-95 transition-all duration-300 cursor-pointer">
                {/* 猫咪脸 */}
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* 猫耳朵 */}
                    <div className="absolute -top-1.5 -left-0.5 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] border-b-pink-300 rotate-[-15deg]" />
                    <div className="absolute -top-1.5 -right-0.5 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[12px] border-b-purple-300 rotate-[15deg]" />

                    {/* 猫脸 emoji */}
                    <span className="text-2xl select-none drop-shadow-sm">🐱</span>
                </div>
            </div>

            {/* 悬停时的提示文字 */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-white rounded-xl shadow-md border border-gray-100 text-xs font-bold text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                找小七聊天 💬
                <div className="absolute bottom-0 right-5 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-100" />
            </div>

            <style jsx global>{`
        @keyframes cat-pulse {
          0%, 100% { transform: scale(1.1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.2; }
        }
        .animate-cat-pulse {
          animation: cat-pulse 3s ease-in-out infinite;
        }
      `}</style>
        </Link>
    );
}
