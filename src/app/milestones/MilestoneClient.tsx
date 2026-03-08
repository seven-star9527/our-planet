'use client'

import { useState } from 'react';
import { createMilestone, deleteMilestone } from '@/actions/features';
import { updateMilestone } from '@/actions/features'; 

function getDaysDiff(date: Date) {
  const now = new Date();
  const target = new Date(date);
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
}

export default function MilestoneClient({ milestones }: { milestones: any[] }) {
  const [editingStone, setEditingStone] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      if (editingStone) {
        await updateMilestone(editingStone.id, formData);
        setEditingStone(null);
      } else {
        await createMilestone(formData);
        (e.target as HTMLFormElement).reset(); 
      }
    } catch (err) {
      alert("操作失败");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4 mt-2 space-y-6">
      {/* 新建/编辑表单卡片 */}
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100/50 space-y-4 transition-all duration-300">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2">
            {editingStone ? '修改重要日子 ✍️' : '添加新日子 📅'}
          </h2>
          {editingStone && (
            <button type="button" onClick={() => setEditingStone(null)} className="text-xs text-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors font-medium">
              取消修改
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input 
            name="title" 
            defaultValue={editingStone?.title || ''}
            placeholder="事件名称 (如: 她的生日)" 
            className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 text-sm transition-all" 
            required 
          />
          <input 
            type="date" 
            name="date" 
            defaultValue={editingStone ? new Date(editingStone.date).toISOString().split('T')[0] : ''}
            className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 text-sm text-gray-700 transition-all" 
            required 
          />
        </div>
        <div className="flex gap-3 items-center">
          <select 
            name="type" 
            defaultValue={editingStone ? (editingStone.isCountdown ? 'countdown' : 'anniversary') : 'anniversary'}
            className="flex-1 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 text-sm text-gray-700 transition-all"
          >
            <option value="anniversary">累计 (在一起X天)</option>
            <option value="countdown">倒数 (还有X天)</option>
          </select>
          <button disabled={isSubmitting} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-md transition-all shrink-0 text-sm disabled:opacity-50 transform hover:-translate-y-0.5">
            {isSubmitting ? '保存中...' : (editingStone ? '保存修改' : '+ 添加')}
          </button>
        </div>
      </form>

      {/* 纪念日列表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {milestones.map(m => {
          const days = getDaysDiff(m.date);
          return (
            <div key={m.id} className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-md transition-all border border-gray-100/50 flex justify-between items-center relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 ${m.isCountdown ? 'bg-indigo-500' : 'bg-pink-500'}`}></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm ${m.isCountdown ? 'bg-indigo-50 text-indigo-500 border border-indigo-100' : 'bg-pink-50 text-pink-500 border border-pink-100'}`}>
                    {m.isCountdown ? '倒数日' : '累计日'}
                  </span>
                  {/* ✨ 修复：移动端永远可见的“编辑”按钮 */}
                  <button 
                    onClick={() => setEditingStone(m)} 
                    className="text-[10px] text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full font-medium active:scale-95 transition-all"
                  >
                    ✎ 编辑
                  </button>
                </div>
                <h3 className="text-lg font-bold text-gray-800">{m.title}</h3>
                <p className="text-gray-400 text-xs font-medium mt-1">{new Date(m.date).toLocaleDateString()}</p>
              </div>

              <div className="text-right relative z-10 flex flex-col items-end">
                {m.isCountdown ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-gray-500 mb-1 font-medium">还有</span>
                    <span className="text-4xl font-black bg-gradient-to-br from-indigo-500 to-purple-500 bg-clip-text text-transparent">{days > 0 ? days : 0}</span>
                    <span className="text-sm text-gray-500 font-bold">天</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-gray-500 mb-1 font-medium">已经</span>
                    <span className="text-4xl font-black bg-gradient-to-br from-pink-500 to-rose-400 bg-clip-text text-transparent">{Math.abs(days)}</span>
                    <span className="text-sm text-gray-500 font-bold">天</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}