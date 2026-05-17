'use client'

import { createMoment } from '@/actions/moments';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DRAFT_KEY = 'moment_draft';

function NewMomentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [bucketId, setBucketId] = useState('');
  const [previewMedia, setPreviewMedia] = useState<{ type: 'image' | 'video'; src: string } | null>(null);

  const isSubmittingRef = useRef(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const draftLoadedRef = useRef(false);

  // 自动保存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = { content, tags, previewImages, videoUrl, bucketId };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [content, tags, previewImages, videoUrl]);

  // 加载草稿 / URL参数预填
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;

    // 优先从 URL 参数预填（如从恋爱清单跳转过来）
    const urlContent = searchParams.get('content');
    if (urlContent) setContent(urlContent);
    const urlBucketId = searchParams.get('bucketId');
    if (urlBucketId) setBucketId(urlBucketId);

    // 再尝试加载草稿（草稿会覆盖 URL 参数）
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.content) setContent(draft.content);
        if (draft.tags) setTags(draft.tags);
        if (draft.previewImages?.length) setPreviewImages(draft.previewImages);
        if (draft.videoUrl) setVideoUrl(draft.videoUrl);
        if (draft.bucketId) setBucketId(draft.bucketId);
      }
    } catch { /* ignore */ }
  }, [searchParams]);

  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`上传失败: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.url) throw new Error('服务器未返回图片地址');

      if (type === 'image') {
        setPreviewImages(prev => [...prev, data.url]);
      } else {
        setVideoUrl(data.url);
      }
    } catch (err: any) {
      alert(`上传失败: ${err.message || '请重试'}`);
    } finally {
      setUploading(false);
    }
    // 重置 input 以便重复选择同一文件
    e.target.value = '';
  };

  // 删除图片
  const removeImage = (idx: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== idx));
  };

  // 图片顺序调整
  const moveImage = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= previewImages.length) return;
    setPreviewImages(prev => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  // 一键清除文字
  const clearAllText = () => {
    setContent('');
    setTags('');
    contentRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('imageUrls', previewImages.join(','));
    formData.set('videoUrl', videoUrl);

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      clearDraft();
      await createMoment(formData);
    } catch (err) {
      console.error('发布失败:', err);
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const hasContent = content.trim() || previewImages.length > 0 || videoUrl;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center shadow-sm">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800 ml-2">✨ 发布新动态</h1>
        {hasContent && (
          <span className="ml-auto text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">草稿已保存</span>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 mt-2">
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100/50 space-y-5">
          {bucketId && <input type="hidden" name="bucketId" value={bucketId} />}

          {/* 内容输入 */}
          <div className="relative">
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              name="content"
              placeholder="今天发生了什么开心的事..."
              className="w-full h-32 p-4 pr-10 bg-gray-50 rounded-2xl resize-none text-base border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all placeholder-gray-400"
              required
            />
            {content && (
              <button
                type="button"
                onClick={clearAllText}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-500 text-xs transition-colors"
                title="清除所有文字"
              >
                ✕
              </button>
            )}
          </div>

          {/* 标签输入 */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold">#</span>
            <input
              ref={tagsRef}
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              name="tags"
              placeholder="添加标签 (如: 旅行 美食)"
              className="w-full pl-8 pr-4 py-3.5 bg-gray-50 rounded-2xl text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all"
            />
          </div>

          {/* 媒体预览区 */}
          <div className="grid grid-cols-3 gap-3">
            {/* 图片预览 - 带删除、预览、排序按钮 */}
            {previewImages.map((src, idx) => (
              <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <img
                  src={src}
                  onClick={() => setPreviewMedia({ type: 'image', src })}
                  className="w-full h-full object-cover cursor-pointer"
                  alt={`preview-${idx}`}
                />
                {/* 悬浮操作层 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {/* 左移 */}
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveImage(idx, -1); }}
                      className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white text-xs font-bold"
                    >
                      ◀
                    </button>
                  )}
                  {/* 预览 */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewMedia({ type: 'image', src }); }}
                    className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white text-sm"
                  >
                    🔍
                  </button>
                  {/* 右移 */}
                  {idx < previewImages.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveImage(idx, 1); }}
                      className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white text-xs font-bold"
                    >
                      ▶
                    </button>
                  )}
                </div>
                {/* 删除按钮 */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                >
                  ✕
                </button>
                {/* 序号标记 */}
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {idx + 1}
                </span>
              </div>
            ))}

            {/* 视频预览 */}
            {videoUrl && (
              <div className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm bg-black">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewMedia({ type: 'video', src: videoUrl })}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setPreviewMedia({ type: 'video', src: videoUrl })}
                    className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white"
                  >
                    ▶
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 上传按钮组 */}
            <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors rounded-2xl flex flex-col items-center justify-center cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'image')} />
              <span className="text-2xl mb-1">📷</span>
              <span className="text-gray-400 text-xs font-medium">照片</span>
            </label>

            {!videoUrl && (
              <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors rounded-2xl flex flex-col items-center justify-center cursor-pointer">
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleUpload(e, 'video')} />
                <span className="text-2xl mb-1">🎥</span>
                <span className="text-gray-400 text-xs font-medium">视频</span>
              </label>
            )}
          </div>

          {/* 底部操作按钮 */}
          <div className="flex gap-2">
            {(content || tags) && (
              <button
                type="button"
                onClick={clearAllText}
                className="flex-shrink-0 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl text-sm font-medium transition-colors"
              >
                🗑️ 清空文字
              </button>
            )}
            <button
              type="submit"
              disabled={uploading || submitting}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {uploading ? '正在上传媒体...' : submitting ? '正在发布...' : '立即发布 🚀'}
            </button>
          </div>
        </form>
      </div>

      {/* 全屏媒体预览 */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewMedia(null)}
        >
          <button className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors text-lg">
            ✕
          </button>
          {previewMedia.type === 'video' ? (
            <video
              src={previewMedia.src}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewMedia.src}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              alt="Preview"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function NewMomentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">加载中...</div>}>
      <NewMomentForm />
    </Suspense>
  );
}
