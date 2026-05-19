'use client'

import { useState, useEffect, useCallback } from 'react';
import { setMood, deleteMood, getMoodRecords, getMoodStats } from '@/actions/mood';

const MOODS = [
  { key: 'happy', label: '开心', emoji: '😊', color: 'bg-amber-100 text-amber-600 border-amber-300', dot: 'bg-amber-400', bar: 'bg-amber-400' },
  { key: 'love', label: '甜蜜', emoji: '🥰', color: 'bg-pink-100 text-pink-600 border-pink-300', dot: 'bg-pink-400', bar: 'bg-pink-400' },
  { key: 'calm', label: '平静', emoji: '😌', color: 'bg-sky-100 text-sky-600 border-sky-300', dot: 'bg-sky-400', bar: 'bg-sky-400' },
  { key: 'angry', label: '生气', emoji: '😡', color: 'bg-red-100 text-red-600 border-red-300', dot: 'bg-red-400', bar: 'bg-red-400' },
  { key: 'sad', label: '郁闷', emoji: '😢', color: 'bg-indigo-100 text-indigo-600 border-indigo-300', dot: 'bg-indigo-400', bar: 'bg-indigo-400' },
  { key: 'hurt', label: '委屈', emoji: '🥺', color: 'bg-purple-100 text-purple-600 border-purple-300', dot: 'bg-purple-400', bar: 'bg-purple-400' },
  { key: 'excited', label: '兴奋', emoji: '🤩', color: 'bg-orange-100 text-orange-600 border-orange-300', dot: 'bg-orange-400', bar: 'bg-orange-400' },
  { key: 'tired', label: '疲惫', emoji: '😴', color: 'bg-gray-100 text-gray-600 border-gray-300', dot: 'bg-gray-400', bar: 'bg-gray-400' },
];

type RecordItem = { id: number; author: string; date: string; mood: string; diary: string | null };
type StatsData = { boy: Record<string, number>; girl: Record<string, number>; totalDays: number };

export default function MoodClient({ role, boyName, girlName }: { role: string; boyName: string; girlName: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState('');
  const [diaryText, setDiaryText] = useState('');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const loadData = useCallback(async () => {
    const [recs, st] = await Promise.all([
      getMoodRecords(year, month),
      getMoodStats(year, month),
    ]);
    setRecords(recs);
    setStats(st);
  }, [year, month]);

  useEffect(() => { loadData(); }, [loadData]);

  // 获取月份信息
  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // 以周一为起始日
  const blanksArray = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i);

  // 获取某一天的数据 (用日期字符串比较，避免时区问题)
  const getDayData = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const boyRecord = records.find(r => r.author === 'boy' && r.date.startsWith(dateStr));
    const girlRecord = records.find(r => r.author === 'girl' && r.date.startsWith(dateStr));
    return { boy: boyRecord, girl: girlRecord };
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    const dayData = getDayData(day);
    const myRecord = role === 'boy' ? dayData.boy : dayData.girl;
    setSelectedMood(myRecord?.mood || '');
    setDiaryText(myRecord?.diary || '');
  };

  const handleSave = async () => {
    if (!selectedMood || selectedDay === null) return;
    setIsSubmitting(true);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const result = await setMood(dateStr, selectedMood, diaryText.trim() || undefined);
    if (result.success) {
      setSelectedDay(null);
      await loadData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (selectedDay === null) return;
    setIsSubmitting(true);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const result = await deleteMood(dateStr);
    if (result.success) {
      setSelectedDay(null);
      setSelectedMood('');
      setDiaryText('');
      await loadData();
    }
    setIsSubmitting(false);
  };

  const moodMeta = MOODS.find(m => m.key === selectedMood);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowStats(!showStats)}
          className={`px-4 py-1.5 text-xs font-bold rounded-2xl transition-all ${showStats ? 'bg-purple-100 text-purple-600' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 shadow-sm'}`}
        >
          {showStats ? '收起统计' : '📊 月度统计'}
        </button>
      </div>

      {/* 日历卡片 */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700">
        {/* 月份导航 */}
        <div className="flex justify-between items-center mb-6 px-2">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 2, 1))}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-pink-50 hover:text-pink-500 transition-colors font-bold"
          >
            &lt;
          </button>
          <div className="font-black text-gray-800 dark:text-gray-100 text-lg">
            {year}年 {month}月
          </div>
          <button
            onClick={() => setCurrentDate(new Date(year, month, 1))}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-pink-50 hover:text-pink-500 transition-colors font-bold"
          >
            &gt;
          </button>
        </div>

        {/* 星期表头 */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-400 dark:text-gray-500">
          <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div className="text-pink-400">六</div><div className="text-pink-400">日</div>
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-2">
          {blanksArray.map(b => <div key={`blank-${b}`} className="min-h-[5.5rem]"></div>)}
          {daysArray.map(day => {
            const dayData = getDayData(day);
            const today = isToday(day);
            const hasBoy = !!dayData.boy;
            const hasGirl = !!dayData.girl;
            const isSelected = selectedDay === day;

            const boyMood = MOODS.find(m => m.key === dayData.boy?.mood);
            const girlMood = MOODS.find(m => m.key === dayData.girl?.mood);

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`relative flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all duration-200 py-2 gap-1
                  ${isSelected ? 'ring-2 ring-pink-400 ring-offset-1 scale-105 z-10' : ''}
                  ${today ? 'border-2 border-pink-300' : 'border border-transparent'}
                  ${hasBoy && hasGirl ? 'bg-gradient-to-br from-blue-50 to-pink-50' : hasBoy ? 'bg-blue-50/60' : hasGirl ? 'bg-pink-50/60' : 'bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-pink-50/60'}
                  cursor-pointer active:scale-95
                `}
              >
                <span className={`text-xs leading-none ${today ? 'text-pink-500' : ''}`}>{day}</span>
                {/* 男生行 — 方形淡蓝底 */}
                <div className="flex items-center justify-center">
                  {boyMood ? (
                    <span className="rounded-md w-7 h-7 flex items-center justify-center text-lg shadow-sm bg-blue-100/60">{boyMood.emoji}</span>
                  ) : (
                    <span className="rounded-md w-7 h-7 border border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/20"></span>
                  )}
                </div>
                {/* 女生行 — 圆形淡粉底 */}
                <div className="flex items-center justify-center">
                  {girlMood ? (
                    <span className="rounded-full w-7 h-7 flex items-center justify-center text-lg shadow-sm bg-pink-100/60">{girlMood.emoji}</span>
                  ) : (
                    <span className="rounded-full w-7 h-7 border border-dashed border-pink-200 dark:border-pink-800 bg-pink-50/30 dark:bg-pink-900/20"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 月度统计面板 */}
      {showStats && stats && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700 space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            📊 {month}月心情统计
            <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">共记录 {stats.totalDays} 天</span>
          </h3>

          {/* 男生统计 */}
          <div>
            <div className="text-xs font-bold text-blue-500 mb-2">👨 {boyName}</div>
            <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
              {MOODS.map(m => {
                const count = stats.boy[m.key] || 0;
                const maxVal = Math.max(...Object.values(stats.boy), 1);
                return count > 0 ? (
                  <div key={m.key} className={`${m.bar} h-full`} style={{ width: `${Math.max((count / maxVal) * 100, 5)}%`, minWidth: '12px' }} title={`${m.label}: ${count}`} />
                ) : null;
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {MOODS.map(m => (
                <span key={m.key} className="text-sm text-gray-500">
                  {m.emoji} {stats.boy[m.key] || 0}
                </span>
              ))}
            </div>
          </div>

          {/* 女生统计 */}
          <div>
            <div className="text-xs font-bold text-pink-500 mb-2">👧 {girlName}</div>
            <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
              {MOODS.map(m => {
                const count = stats.girl[m.key] || 0;
                const maxVal = Math.max(...Object.values(stats.girl), 1);
                return count > 0 ? (
                  <div key={m.key} className={`${m.bar} h-full`} style={{ width: `${Math.max((count / maxVal) * 100, 5)}%`, minWidth: '12px' }} title={`${m.label}: ${count}`} />
                ) : null;
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {MOODS.map(m => (
                <span key={m.key} className="text-sm text-gray-500">
                  {m.emoji} {stats.girl[m.key] || 0}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 心情选择弹窗 */}
      {selectedDay !== null && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
          <div
            className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-3xl p-6 shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-gray-800 dark:text-gray-100">
                {year}年{month}月{selectedDay}日
              </h3>
              <button onClick={() => setSelectedDay(null)} className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                ✕
              </button>
            </div>

            {/* 心情选择 */}
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">选择今天的心情</p>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {MOODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMood(m.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 border-2
                    ${selectedMood === m.key ? `${m.color} scale-105 shadow-md` : 'border-transparent bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}
                  `}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className={`text-[11px] font-bold ${selectedMood === m.key ? '' : 'text-gray-500'}`}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            {/* 日记输入 */}
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">日记 (可选)</p>
            <textarea
              value={diaryText}
              onChange={(e) => setDiaryText(e.target.value)}
              placeholder="今天发生了什么..."
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 rounded-2xl border border-gray-100 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 text-sm resize-none"
              rows={3}
            />

            {/* 操作按钮 */}
            <div className="flex gap-2 mt-4">
              {selectedMood && (
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-shrink-0 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-2xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  🗑️ 清除
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!selectedMood || isSubmitting}
                className={`flex-1 py-3 font-bold rounded-2xl text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  ${moodMeta ? moodMeta.bar : 'bg-gray-300'}
                `}
              >
                {isSubmitting ? '保存中...' : selectedMood ? `确认 ${moodMeta?.emoji} ${moodMeta?.label}` : '请选择心情'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
}
