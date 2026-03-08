'use client'

import { useState } from 'react';
import { adjustAffinity } from '@/actions/affinity';

type LogItem = {
    id: number;
    type: string;
    delta: number;
    reason: string;
    createdAt: string;
};

type ScoreData = {
    favorability: number;
    intimacy: number;
};

export default function AffinityClient({
    role,
    otherRole,
    myScore,
    theirScore,
    myLogs,
    theirLogs,
}: {
    role: string;
    otherRole: string;
    myScore: ScoreData;
    theirScore: ScoreData;
    myLogs: LogItem[];
    theirLogs: LogItem[];
}) {
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'mine' | 'theirs'>('mine');

    const myName = role === 'boy' ? '我(男主)' : '我(女主)';
    const theirName = otherRole === 'boy' ? '男主' : '女主';

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        formData.set('fromRole', role);
        formData.set('toRole', otherRole);

        const result = await adjustAffinity(formData);
        if (result.success) {
            setShowForm(false);
        } else {
            alert(result.error);
        }
        setIsSubmitting(false);
    };

    // 圆环进度条组件
    const ScoreRing = ({ value, label, color }: { value: number; label: string; color: string }) => {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
                        <circle
                            cx="50" cy="50" r={radius}
                            fill="none"
                            stroke={color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black text-gray-800">{value}</span>
                    </div>
                </div>
                <span className="text-xs font-bold text-gray-500">{label}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* 我给 TA 的分数 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <span className="w-7 h-7 bg-pink-50 rounded-full flex items-center justify-center text-sm">💗</span>
                        {myName} 给 {theirName} 的分数
                    </h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="text-xs bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 px-3 py-1.5 rounded-full font-bold hover:from-pink-100 hover:to-purple-100 transition-colors"
                    >
                        {showForm ? '收起' : '+ 调整'}
                    </button>
                </div>

                <div className="flex justify-center gap-8">
                    <ScoreRing value={myScore.favorability} label="好感度" color="#ec4899" />
                    <ScoreRing value={myScore.intimacy} label="亲密度" color="#8b5cf6" />
                </div>
            </div>

            {/* 调整分数表单 */}
            {showForm && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50 animate-fade-in">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="text-base">✍️</span> 调整分数
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">类型</label>
                                <select name="type" className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-pink-100 focus:outline-none text-sm">
                                    <option value="favorability">💗 好感度</option>
                                    <option value="intimacy">💜 亲密度</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">分数变化</label>
                                <input
                                    name="delta"
                                    type="number"
                                    placeholder="如 +5 或 -3"
                                    className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-pink-100 focus:outline-none text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">事由</label>
                            <textarea
                                name="reason"
                                rows={2}
                                placeholder="记录一下因为什么事加减分..."
                                className="w-full p-3 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-pink-100 focus:outline-none text-sm resize-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-2xl font-bold shadow-md disabled:opacity-50 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            {isSubmitting ? '提交中...' : '确认调整 ✨'}
                        </button>
                    </form>
                </div>
            )}

            {/* TA 给我的分数 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50">
                <h2 className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
                    <span className="w-7 h-7 bg-purple-50 rounded-full flex items-center justify-center text-sm">💜</span>
                    {theirName} 给 {myName} 的分数
                </h2>
                <div className="flex justify-center gap-8">
                    <ScoreRing value={theirScore.favorability} label="好感度" color="#ec4899" />
                    <ScoreRing value={theirScore.intimacy} label="亲密度" color="#8b5cf6" />
                </div>
            </div>

            {/* 变更记录 */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('mine')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'mine'
                                ? 'text-pink-600 bg-pink-50/50 border-b-2 border-pink-500'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        我的记录
                    </button>
                    <button
                        onClick={() => setActiveTab('theirs')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'theirs'
                                ? 'text-purple-600 bg-purple-50/50 border-b-2 border-purple-500'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        TA 的记录
                    </button>
                </div>

                <div className="p-5 max-h-[50vh] overflow-y-auto">
                    {(activeTab === 'mine' ? myLogs : theirLogs).length === 0 ? (
                        <div className="text-center text-gray-400 py-10 text-sm">
                            还没有记录哦 ✨
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(activeTab === 'mine' ? myLogs : theirLogs).map((log) => (
                                <div key={log.id} className="relative pl-6 border-l-2 border-gray-100 last:border-transparent">
                                    <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 ${log.delta > 0
                                            ? 'border-emerald-400 bg-emerald-50'
                                            : 'border-rose-400 bg-rose-50'
                                        }`} />
                                    <div className="pb-4">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className={`text-sm font-black ${log.delta > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {log.delta > 0 ? '+' : ''}{log.delta}
                                            </span>
                                            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                                                {log.type === 'favorability' ? '好感度' : '亲密度'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(log.createdAt).toLocaleDateString('zh-CN', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{log.reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
        </div>
    );
}
