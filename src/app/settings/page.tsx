'use client';

import { useState, useEffect } from 'react';
import { updateSettings, getSettings } from '@/actions/settings';
import Link from 'next/link';

export default function SettingsPage() {
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [boyName, setBoyName] = useState('男主');
  const [girlName, setGirlName] = useState('女主');

  // 背景设置
  const [bgImage, setBgImage] = useState('');
  const [bgOpacity, setBgOpacity] = useState(1);
  const [bgTone, setBgTone] = useState(0); // 0 = 无蒙层, 1 = 纯黑
  const [bgFit, setBgFit] = useState('cover');

  // 开屏动画设置
  const [splashEnabled, setSplashEnabled] = useState(false);
  const [splashMode, setSplashMode] = useState('template');
  const [splashTemplates, setSplashTemplates] = useState<string[]>(['fireworks']);
  const [splashMedia, setSplashMedia] = useState('');
  const [splashText, setSplashText] = useState('我们的专属星球\n欢迎回来');
  const [splashEntryType, setSplashEntryType] = useState('countdown');
  const [splashDuration, setSplashDuration] = useState(5);

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
        if (data.home_bg_image) setBgImage(data.home_bg_image);
        if (data.home_bg_opacity) setBgOpacity(Number(data.home_bg_opacity));
        if (data.home_bg_tone) setBgTone(Number(data.home_bg_tone));
        if (data.home_bg_fit) setBgFit(data.home_bg_fit);

        if (data.splash_enabled) setSplashEnabled(data.splash_enabled === 'true');
        if (data.splash_mode) setSplashMode(data.splash_mode);
        if (data.splash_templates) setSplashTemplates(data.splash_templates.split(',').filter(Boolean));
        if (data.splash_media) setSplashMedia(data.splash_media);
        if (data.splash_text) setSplashText(data.splash_text);
        if (data.splash_entry_type) setSplashEntryType(data.splash_entry_type);
        if (data.splash_duration) setSplashDuration(Number(data.splash_duration));
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
        home_bg_image: bgImage,
        home_bg_opacity: bgOpacity.toString(),
        home_bg_tone: bgTone.toString(),
        home_bg_fit: bgFit,
        splash_enabled: splashEnabled.toString(),
        splash_mode: splashMode,
        splash_templates: splashTemplates.join(','),
        splash_media: splashMedia,
        splash_text: splashText,
        splash_entry_type: splashEntryType,
        splash_duration: splashDuration.toString(),
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
        <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">

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
            </div>
          </div>

          {/* 首页背景设置 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">🖼️ 首页背景图</h2>
                <p className="text-sm text-gray-500 mt-1">自定义首页背景，效果实时预览</p>
              </div>
            </div>
            <div className="p-5 space-y-5">

              {/* 图片上传区域 */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600">背景图片</label>
                {bgImage ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-sm group border border-gray-200">
                    <img src={bgImage} alt="Background" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setBgImage('')}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-md"
                    >
                      ×
                    </button>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                      <span className="text-white text-sm font-medium">点击右上角取消</span>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm mb-2 group-hover:scale-110 transition-transform text-gray-400">
                      📷
                    </div>
                    <span className="text-sm text-gray-500 font-medium">点击上传图片</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setBgImage(ev.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* 控制项: 透明度、深色蒙层、裁剪 */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-600">背景透明度: {Math.round(bgOpacity * 100)}%</label>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} className="w-full accent-purple-500" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-600">遮罩加深: {Math.round(bgTone * 100)}%</label>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={bgTone} onChange={(e) => setBgTone(Number(e.target.value))} className="w-full accent-purple-500" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">展示模式</label>
                  <div className="flex bg-gray-50 p-1 rounded-lg">
                    <button type="button" onClick={() => setBgFit('cover')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${bgFit === 'cover' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}>
                      裁剪填充 (Cover)
                    </button>
                    <button type="button" onClick={() => setBgFit('contain')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${bgFit === 'contain' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}>
                      完整适应 (Contain)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {/* 开屏动画设置 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">🚀 专属开屏特效</h2>
                <p className="text-sm text-gray-500 mt-1">设置绚丽的欢迎动画或视频</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={splashEnabled} onChange={e => setSplashEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            {splashEnabled && (
              <div className="p-5 space-y-6 animate-fade-in">

                {/* 动画模式选择 */}
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-2 block">动画展现模式</label>
                  <div className="flex bg-gray-50 p-1.5 rounded-xl">
                    <button type="button" onClick={() => setSplashMode('template')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${splashMode === 'template' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>内置节日模板</button>
                    <button type="button" onClick={() => setSplashMode('custom')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${splashMode === 'custom' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>自定义上传</button>
                  </div>
                </div>

                {splashMode === 'template' ? (
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-2 block">选择叠加特效 (支持多选) 🎊</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { id: 'fireworks', icon: '🎇', label: '绚烂烟火' },
                        { id: 'cake', icon: '🎂', label: '中心大蛋糕' },
                        { id: 'flowers', icon: '🌸', label: '鲜花漫不经心飘落' },
                        { id: 'hearts', icon: '💖', label: '满屏爱心升空' },
                        { id: 'stars', icon: '✨', label: '漫天繁星闪烁' },
                        { id: 'balloons', icon: '🎈', label: '气球缓缓升起' },
                        { id: 'meteor', icon: '🌠', label: '流星雨划过天际' },
                      ].map(tpl => {
                        const isSelected = splashTemplates.includes(tpl.id);
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSplashTemplates(prev => prev.filter(p => p !== tpl.id));
                              } else {
                                setSplashTemplates(prev => [...prev, tpl.id]);
                              }
                            }}
                            className={`flex items-center gap-2 p-3 border rounded-xl transition-all ${isSelected ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                          >
                            <span className="text-xl drop-shadow-sm">{tpl.icon}</span>
                            <span className="text-xs font-bold leading-tight">{tpl.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">上传媒体 (支持图片或短视频)</label>
                    {splashMedia ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-sm group border border-gray-200 bg-black">
                        {splashMedia.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video src={splashMedia} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                        ) : (
                          <img src={splashMedia} alt="Splash Custom" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setSplashMedia('')}
                          className="absolute top-2 right-2 w-8 h-8 bg-rose-500 hover:bg-rose-600 rounded-full text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-md z-10 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/50 hover:bg-purple-100 hover:border-purple-300 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm mb-2 group-hover:-translate-y-1 transition-transform text-purple-400">
                          ☁️
                        </div>
                        <span className="text-sm text-purple-600 font-bold">点击上传</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,video/mp4,video/webm"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // 上传COS
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData,
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setSplashMedia(data.url);
                              } else {
                                alert('上传失败');
                              }
                            } catch (err) {
                              alert('上传发生错误');
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* 核心文案配置 */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">主屏幕霸屏祝福文案</label>
                  <textarea
                    value={splashText}
                    onChange={e => setSplashText(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none text-gray-700 text-sm h-20 resize-none"
                    placeholder="文案支持回车换行哦..."
                  />
                </div>

                {/* 进入交互方式 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-2 block">如何进入星球？</label>
                    <select
                      value={splashEntryType}
                      onChange={e => setSplashEntryType(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-purple-300 outline-none text-gray-700 text-sm font-medium"
                    >
                      <option value="countdown">自动倒计时</option>
                      <option value="click">点击按钮</option>
                    </select>
                  </div>

                  {splashEntryType === 'countdown' && (
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-2 block">倒计时秒数</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={splashDuration}
                        onChange={e => setSplashDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:border-purple-300 outline-none text-gray-700 text-sm font-medium"
                      />
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

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
            </div>
          </div>

        </form>

        {/* 全局悬浮保存按钮 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50 animate-fade-in-up flex flex-col items-center justify-center space-y-2">
          {message && (
            <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm max-w-lg w-full text-center ${message.includes('成功')
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
              {message}
            </div>
          )}
          <button
            type="submit"
            form="settings-form"
            disabled={loading || !anniversaryDate || !boyName || !girlName}
            className="w-full max-w-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-2xl font-bold hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-200/50 transform hover:-translate-y-1 text-lg flex justify-center items-center gap-2"
          >
            {loading ? '保存中...' : (hasInitialDate ? '保存所有修改 ✨' : '保存设置 ✨')}
          </button>
        </div>

      </div >
    </main >
  );
}