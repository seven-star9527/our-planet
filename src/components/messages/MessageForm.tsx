'use client';

import { useState } from 'react';
import { createMessage } from '@/actions/messages';
import { useRouter } from 'next/navigation';

export default function MessageForm({ role }: { role: string | undefined }) {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [color, setColor] = useState('#ec4899');
    const [size, setSize] = useState('text-base');
    const [isAnimated, setIsAnimated] = useState(true);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        setLoading(true);

        try {
            const res = await createMessage({
                sender: role || 'unknown',
                content,
                color,
                size,
                isAnimated,
                showAt: new Date(),
                duration,
            });

            if (res.success && res.data) {
                setContent('');
                router.refresh(); // Refresh the server component to load new messages
            } else {
                alert(res.error || '发布失败');
            }
        } catch (err) {
            alert('发布失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-50 transition-all px-4 py-3 shadow-sm flex flex-col gap-3">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="写点什么，可以选择颜色、大小和是否漂浮在首页背景上..."
                    className="bg-transparent outline-none text-sm text-gray-700 w-full resize-none h-16"
                    maxLength={100}
                />
                <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3 pb-1">
                    {/* 颜色选择 */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">颜色</span>
                        {['#ffffff', '#000000', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#374151'].map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`w-4 h-4 rounded-full transition-transform shrink-0 shadow-sm border border-gray-200 ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-200' : 'opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    {/* 大小选择 */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">大小</span>
                        <select value={size} onChange={e => setSize(e.target.value)} className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 outline-none">
                            <option value="text-sm">小</option>
                            <option value="text-base">中</option>
                            <option value="text-xl">大</option>
                            <option value="text-3xl">超大</option>
                        </select>
                    </div>

                    {/* 时长选择 */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">展示多久</span>
                        <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 outline-none">
                            <option value={0}>永久展示</option>
                            <option value={10}>10秒</option>
                            <option value={60}>1分钟</option>
                            <option value={3600}>1小时</option>
                            <option value={86400}>1天</option>
                        </select>
                    </div>

                    {/* 动态漂浮 */}
                    <label className="flex items-center gap-1.5 cursor-pointer bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 transition-colors hover:bg-purple-100 ml-auto">
                        <input type="checkbox" checked={isAnimated} onChange={e => setIsAnimated(e.target.checked)} className="accent-purple-500 w-3 h-3" />
                        <span className="text-xs text-purple-700 font-bold select-none">作为弹幕漂浮 🚀</span>
                    </label>
                </div>
            </div>
            <button
                type="submit"
                disabled={loading || !content.trim()}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-md shadow-purple-200 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:translate-y-0 font-bold text-sm"
            >
                {loading ? '...' : '发送'}
            </button>
        </form>
    );
}
