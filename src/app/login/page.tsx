// src/app/login/page.tsx
import { selectIdentity } from '@/actions/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-indigo-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-white/50 backdrop-blur-sm">
        <div className="text-5xl mb-6 animate-bounce">🌍</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">欢迎降落我们的星球</h1>
        <p className="text-sm text-gray-500 mb-10">请选择你的专属身份以继续</p>

        <div className="space-y-4">
          {/* 男生按钮 */}
          <form action={selectIdentity.bind(null, 'boy')}>
            <button className="w-full relative overflow-hidden group bg-gradient-to-r from-blue-400 to-indigo-500 text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
              <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                👨 我是男主
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>
          </form>

          {/* 女生按钮 */}
          <form action={selectIdentity.bind(null, 'girl')}>
            <button className="w-full relative overflow-hidden group bg-gradient-to-r from-pink-400 to-rose-400 text-white p-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
              <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                👧 我是公主
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}