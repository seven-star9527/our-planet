'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBucketItem, updateBucketStatus, deleteBucketItem, editBucketItem, markBucketDone } from '@/actions/features';

type BucketItem = {
  id: number;
  title: string;
  status: string;
  createdAt: string;
};

export default function BucketListClient({ initialItems }: { initialItems: BucketItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<BucketItem[]>(initialItems);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const refresh = () => router.refresh();

  const doneCount = items.filter(i => i.status === 'DONE').length;
  const totalCount = items.length;

  const handleCreate = async () => {
    if (!newTitle.trim() || submitting) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', newTitle.trim());
    await createBucketItem(formData);
    setNewTitle('');
    setSubmitting(false);
    refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个心愿吗？')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    await deleteBucketItem(id);
    refresh();
  };

  const handleEdit = async (id: number) => {
    const result = await editBucketItem(id, editTitle);
    if (result.success) {
      setEditingId(null);
      refresh();
    } else {
      alert(result.error);
    }
  };

  const handleMarkDone = async (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'DONE' } : i));
    await markBucketDone(id);
    refresh();
  };

  const handleUndo = async (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'TODO' } : i));
    await updateBucketStatus(id, 'TODO');
    refresh();
  };

  const handleStatusChange = async (id: number, status: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    await updateBucketStatus(id, status);
    refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 px-4 py-3 flex items-center shadow-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-800 ml-2">📝 恋爱清单</h1>
        <div className="ml-auto text-xs font-medium text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
          {doneCount} / {totalCount} 已达成
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6 mt-2">
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="想和你一起做..."
            className="flex-1 p-3.5 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-sm"
          />
          <button
            onClick={handleCreate}
            disabled={submitting || !newTitle.trim()}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            许愿 ✨
          </button>
        </div>

        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl transition-all duration-300 border ${
                item.status === 'DONE'
                  ? 'bg-gray-50 border-gray-100 opacity-75'
                  : 'bg-white border-gray-100/50 shadow-sm hover:shadow-md'
              }`}
            >
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(item.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 p-2 bg-white rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                    autoFocus
                  />
                  <button onClick={() => handleEdit(item.id)} className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-full font-medium hover:bg-indigo-600">
                    保存
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-xs bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full font-medium hover:bg-gray-300">
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className={`text-sm md:text-base ${item.status === 'DONE' ? 'line-through text-gray-400' : 'font-medium text-gray-800'}`}>
                    {item.title}
                  </span>

                  <div className="flex gap-2 shrink-0 ml-4">
                    {item.status === 'TODO' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(item.id, 'DOING')}
                          className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 px-3 py-1.5 rounded-full font-medium transition-colors"
                        >
                          开始做
                        </button>
                        <button
                          onClick={() => { setEditingId(item.id); setEditTitle(item.title); }}
                          className="text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 px-2 py-1.5 rounded-full font-medium transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 px-2 py-1.5 rounded-full font-medium transition-colors"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    {item.status === 'DOING' && (
                      <>
                        <button
                          onClick={() => handleMarkDone(item.id)}
                          className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1.5 rounded-full font-bold shadow-sm hover:shadow transition-all"
                        >
                          ✅ 达成
                        </button>
                        <Link
                          href={`/moments/new?content=我们终于完成了：${encodeURIComponent(item.title)}！&bucketId=${item.id}`}
                          className="text-xs bg-pink-50 text-pink-500 hover:bg-pink-100 px-2 py-1.5 rounded-full font-medium transition-colors"
                        >
                          📸 记录
                        </Link>
                        <button
                          onClick={() => { setEditingId(item.id); setEditTitle(item.title); }}
                          className="text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 px-2 py-1.5 rounded-full font-medium transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 px-2 py-1.5 rounded-full font-medium transition-colors"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    {item.status === 'DONE' && (
                      <>
                        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-medium">
                          已达成
                        </span>
                        <button
                          onClick={() => handleUndo(item.id)}
                          className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 px-2 py-1.5 rounded-full font-medium transition-colors"
                          title="撤销达成"
                        >
                          ↩️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 px-2 py-1.5 rounded-full font-medium transition-colors"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center text-gray-400 py-10 text-sm">
              还没有愿望哦，快添加一个吧！
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
