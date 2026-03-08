'use client';

import { useState, useEffect } from 'react';
import { updateSettings, getSettings } from '@/actions/settings';
import Link from 'next/link';

export default function SettingsPage() {
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [boyName, setBoyName] = useState('男主');
  const [girlName, setGirlName] = useState('女主');
  
  const [hasInitialDate, setHasInitialDate] = useState(false); // 用于判断是"保存"还是"修改"
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 页面加载时获取数据库中的真实设置
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings(); // 直接调用 Server Action 获取数据更稳定
        
        if (data.anniversaryDate) {
          const date = new Date(data.anniversaryDate);
          const formatted = date.toISOString().split('T')[0];
          setAnniversaryDate(formatted);
          setHasInitialDate(true);
        }
        if (data.boyName) setBoyName(data.boyName);
        if (data.girlName) setGirlName(data.girlName);
        
      } catch (error) {
        console.error('加载设置失败:', error);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await updateSettings({
        anniversaryDate: anniversaryDate ? new Date(anniversaryDate).toISOString() : null,
        boyName: boyName.trim(),
        girlName: girlName.trim(),
      });

      if (result.success) {
        setMessage('设置保存成功！');
        setHasInitialDate(true);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('保存失败: ' + result.error);
      }
    } catch (error) {
      setMessage('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center shadow-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-800 ml-2">⚙️ 设置</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 专属称呼设置卡片 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h2 className="font-bold text-gray-800 text-lg">📝 专属称呼</h2>
              <p className="text-sm text-gray-500 mt-1">发手账时，会显示你们自定义的名字哦</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-blue-500 mb-1">👨 男生昵称</label>
                  <input
                    type="text"
                    value={boyName}
                    onChange={(e) => setBoyName(e.target.value)}
                    className="w-full px-4 py-3 bg-blue-50/50 rounded-2xl border border-blue-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none text-gray-700 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-pink-500 mb-1">👧 女生昵称</label>
                  <input
                    type="text"
                    value={girlName}
                    onChange={(e) => setGirlName(e.target.value)}
                    className="w-full px-4 py-3 bg-pink-50/50 rounded-2xl border border-pink-100 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none text-gray-700 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 纪念日设置卡片 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h2 className="font-bold text-gray-800 text-lg">💑 纪念日设置</h2>
              <p className="text-sm text-gray-500 mt-1">设置你们在一起的日期</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <input
                  type="date"
                  value={anniversaryDate}
                  onChange={(e) => setAnniversaryDate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all outline-none text-gray-700 text-sm"
                  disabled={loading}
                />
              </div>

              {message && (
                <div className={`p-3.5 rounded-2xl text-sm font-medium animate-fade-in ${
                  message.includes('成功') 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !anniversaryDate || !boyName || !girlName}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3.5 rounded-2xl font-bold hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200/50 transform hover:-translate-y-0.5"
              >
                {/* ✨ 智能判断：有历史日期就是修改，没有就是保存 */}
                {loading ? '处理中...' : (hasInitialDate ? '修改设置 ✨' : '保存设置')}
              </button>
            </div>
          </div>
        </form>

        {/* 预览卡片 (保持不变) */}
        {anniversaryDate && (
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="font-bold text-lg mb-2 relative z-10">✨ 预览效果</h3>
            <p className="opacity-95 font-medium relative z-10">
              在一起的第{' '}
              <span className="font-bold text-2xl">
                {Math.floor((new Date().getTime() - new Date(anniversaryDate).getTime()) / (1000 * 60 * 60 * 24))}
              </span>
              {' '}天
            </p>
          </div>
        )}

        {/* 其他设置 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-800 text-lg">🎨 外观设置</h2>
            <p className="text-sm text-gray-500 mt-1">自定义应用的外观主题</p>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-700 text-sm">深色模式</div>
                <div className="text-xs text-gray-400 mt-0.5">即将推出，敬请期待</div>
              </div>
              <div className="w-12 h-6 bg-gray-100 rounded-full relative cursor-not-allowed opacity-50 border border-gray-200">
                <div className="w-5 h-5 bg-white rounded-full absolute top-[1px] left-[1px] shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden">
          <div className="p-5 text-center">
            <div className="text-4xl mb-2">🌍</div>
            <h2 className="font-black text-gray-800 text-lg mb-1">我们的专属星球</h2>
            <p className="text-sm text-gray-600 mb-2 font-medium">v1.0.0</p>
            <p className="text-xs text-gray-400">
              一个专为你们打造的私密记忆空间
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}