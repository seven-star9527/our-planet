// src/app/period/PeriodClient.tsx
'use client'

import { useState, useMemo } from 'react';
import { markPeriodStart, togglePeriodVisibility, updatePeriodSettings } from '@/actions/period';

type PeriodRecord = { startDate: string; endDate: string | null };

const PHASES = [
  { name: '月经期', days: [1, 5], color: 'bg-rose-100 text-rose-600 border-rose-200', dot: 'bg-rose-400', desc: '她可能容易疲惫、腹痛或情绪低落。', tips: '多给她倒热水，准备好暖宝宝。多包容她的小脾气，尽量不惹她生气哦。' },
  { name: '卵泡期', days: [6, 13], color: 'bg-emerald-100 text-emerald-600 border-emerald-200', dot: 'bg-emerald-400', desc: '经期刚过，雌激素上升，她现在精力充沛，心情绝佳！', tips: '这是你们约会、出游、计划浪漫惊喜的黄金时期，她的皮肤状态也会很好。' },
  { name: '排卵期', days: [14, 16], color: 'bg-orange-100 text-orange-600 border-orange-200', dot: 'bg-orange-400', desc: '体温微升，处于排卵阶段，也是受孕几率最高的时期。', tips: '如果暂时没有宝宝计划，这段时间一定要做好严密防护哦！' },
  { name: '黄体期', days: [17, 28], color: 'bg-indigo-100 text-indigo-600 border-indigo-200', dot: 'bg-indigo-400', desc: '孕激素增加，容易水肿、爆痘，也就是常说的"经前综合征(PMS)"。', tips: '她可能会突然敏感、易怒或委屈。多倾听，多抱抱她，带她吃点甜食。' },
];

export default function PeriodClient({
  records,
  role,
  initialVisibility,
  initialDuration,
  initialCycle,
}: {
  records: PeriodRecord[];
  role: string;
  initialVisibility: boolean;
  initialDuration: number;
  initialCycle: number;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isShared, setIsShared] = useState(initialVisibility);
  const [isLoading, setIsLoading] = useState(false);
  const [periodDuration, setPeriodDuration] = useState(initialDuration);
  const [periodCycle, setPeriodCycle] = useState(initialCycle);
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // 女生也可以标记自己的经期
  const canEdit = role === 'boy' || role === 'girl';

  const parsedRecords = useMemo(() => records.map(r => ({
    startDate: new Date(r.startDate),
    endDate: r.endDate ? new Date(r.endDate) : null,
  })), [records]);

  const latestPeriod = parsedRecords.length > 0 ? parsedRecords[0] : null;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i);

  // 动态计算阶段 (基于实际设置的周期长度)
  const getPhaseForDate = (date: Date) => {
    if (!latestPeriod) return null;
    const diffTime = date.getTime() - latestPeriod.startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;

    if (diffDays < 1) return null;

    const cycleDay = ((diffDays - 1) % periodCycle) + 1;

    // 基于实际持续天数和周期天数动态调整阶段区间
    const periodEnd = periodDuration;
    const follicularEnd = periodCycle - 14;
    const ovulationStart = follicularEnd + 1;
    const ovulationEnd = ovulationStart + 2;

    const dynamicPhases = [
      { name: '月经期', days: [1, periodEnd], color: 'bg-rose-100 text-rose-600 border-rose-200', dot: 'bg-rose-400', desc: '她可能容易疲惫、腹痛或情绪低落。', tips: '多给她倒热水，准备好暖宝宝。多包容她的小脾气，尽量不惹她生气哦。' },
      { name: '卵泡期', days: [periodEnd + 1, follicularEnd], color: 'bg-emerald-100 text-emerald-600 border-emerald-200', dot: 'bg-emerald-400', desc: '经期刚过，雌激素上升，她现在精力充沛，心情绝佳！', tips: '这是你们约会、出游、计划浪漫惊喜的黄金时期，她的皮肤状态也会很好。' },
      { name: '排卵期', days: [ovulationStart, ovulationEnd], color: 'bg-orange-100 text-orange-600 border-orange-200', dot: 'bg-orange-400', desc: '体温微升，处于排卵阶段，也是受孕几率最高的时期。', tips: '如果暂时没有宝宝计划，这段时间一定要做好严密防护哦！' },
      { name: '黄体期', days: [ovulationEnd + 1, periodCycle], color: 'bg-indigo-100 text-indigo-600 border-indigo-200', dot: 'bg-indigo-400', desc: '孕激素增加，容易水肿、爆痘，也就是常说的"经前综合征(PMS)"。', tips: '她可能会突然敏感、易怒或委屈。多倾听，多抱抱她，带她吃点甜食。' },
    ];

    for (const phase of dynamicPhases) {
      if (cycleDay >= phase.days[0] && cycleDay <= phase.days[1]) {
        return { ...phase, cycleDay };
      }
    }
    return null;
  };

  const handleDayClick = async (day: number) => {
    if (!canEdit) return;
    setIsLoading(true);
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString();
    await markPeriodStart(dateStr);
    setIsLoading(false);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await updatePeriodSettings(periodDuration, periodCycle);
    setSavingSettings(false);
    setShowSettings(false);
  };

  const todayPhase = getPhaseForDate(new Date());

  // 计算某天是否在经期内（用于日历标记）
  const isInPeriodRange = (date: Date) => {
    return parsedRecords.some(r => {
      const d = date.getTime();
      const start = r.startDate.getTime();
      if (r.endDate) {
        const end = r.endDate.getTime();
        return d >= start && d <= end;
      }
      // 如果没有 endDate，使用设置的持续天数
      const estimatedEnd = new Date(r.startDate);
      estimatedEnd.setDate(estimatedEnd.getDate() + periodDuration - 1);
      return d >= start && d <= estimatedEnd.getTime();
    });
  };

  const isMarkedStart = (date: Date) => {
    return parsedRecords.some(r => r.startDate.toDateString() === date.toDateString());
  };

  return (
    <div className="space-y-6">

      {/* 顶部状态卡片 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <h2 className="text-sm font-bold text-gray-500 mb-4 relative z-10">今日身体状态分析</h2>

        {todayPhase ? (
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-black border ${todayPhase.color}`}>
                {todayPhase.name} (第 {todayPhase.cycleDay} 天)
              </span>
            </div>
            <p className="text-gray-700 text-sm font-medium mb-2">{todayPhase.desc}</p>
            <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-50 text-sm text-gray-600 leading-relaxed">
              <span className="font-bold text-rose-500 mr-1">💡 专属建议:</span>
              {todayPhase.tips}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm bg-gray-50 p-4 rounded-2xl text-center">
            点击日历标记上一次姨妈来的第一天，即可开启智能预测 ✨
          </div>
        )}
      </div>

      {/* 生理期设置面板 */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between text-sm font-bold text-gray-700"
        >
          <span>⚙️ 生理期设置</span>
          <span className={`transition-transform ${showSettings ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showSettings && (
          <div className="mt-4 space-y-4 pt-4 border-t border-gray-50">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">
                每次持续天数: <span className="text-rose-500">{periodDuration} 天</span>
              </label>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={periodDuration}
                onChange={(e) => setPeriodDuration(Number(e.target.value))}
                className="w-full accent-rose-400"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>2天</span><span>10天</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">
                周期长度: <span className="text-rose-500">{periodCycle} 天</span>
              </label>
              <input
                type="range"
                min="21"
                max="40"
                step="1"
                value={periodCycle}
                onChange={(e) => setPeriodCycle(Number(e.target.value))}
                className="w-full accent-rose-400"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>21天</span><span>40天</span>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {savingSettings ? '保存中...' : '保存设置'}
            </button>
          </div>
        )}
      </div>

      {/* 日历模块 */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 px-2">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors font-bold"
          >
            &lt;
          </button>
          <div className="font-black text-gray-800 text-lg">
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </div>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors font-bold"
          >
            &gt;
          </button>
        </div>

        {/* 星期表头 */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-400">
          <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div className="text-rose-400">六</div><div className="text-rose-400">日</div>
        </div>

        {/* 日期网格 */}
        <div className={`grid grid-cols-7 gap-1 md:gap-2 ${isLoading ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}>
          {blanksArray.map(b => <div key={`blank-${b}`} className="aspect-square"></div>)}

          {daysArray.map(day => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = new Date().toDateString() === date.toDateString();
            const phase = getPhaseForDate(date);
            const isStart = isMarkedStart(date);
            const inRange = isInPeriodRange(date);

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                disabled={!canEdit}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300
                  ${isStart ? 'bg-rose-500 text-white shadow-md shadow-rose-200 transform scale-105' : ''}
                  ${inRange && !isStart ? 'bg-rose-100 text-rose-600' : ''}
                  ${!isStart && !inRange ? 'bg-gray-50/50 text-gray-700 hover:bg-rose-50' : ''}
                  ${isToday && !isStart ? 'border-2 border-rose-300 text-rose-500' : 'border border-transparent'}
                  ${canEdit ? 'cursor-pointer active:scale-95' : 'cursor-default'}
                `}
              >
                <span className="z-10">{day}</span>
                {!isStart && !inRange && phase && (
                  <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${phase.dot}`}></span>
                )}
                {isStart && (
                  <span className="absolute -top-1 -right-1 text-[10px]">🩸</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 颜色图例 */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50 text-xs text-gray-500">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span>月经期</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>卵泡期</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>排卵期</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400"></span>黄体期</div>
        </div>
      </div>

      {/* 共享开关 */}
      {role === 'boy' && (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-700 text-sm">将日历共享给女友</h3>
            <p className="text-xs text-gray-400 mt-0.5">开启后，她也能在首页看到这个入口</p>
          </div>
          <button
            onClick={async () => {
              setIsShared(!isShared);
              await togglePeriodVisibility(!isShared);
            }}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isShared ? 'bg-rose-500' : 'bg-gray-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${isShared ? 'left-6' : 'left-0.5'}`}></div>
          </button>
        </div>
      )}
    </div>
  );
}
