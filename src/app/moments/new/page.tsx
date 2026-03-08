'use client'

import { createMoment } from '@/actions/moments';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewMomentPage() {
  const router = useRouter();
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>(''); 
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]); 

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (type === 'image') {
        setPreviewImages(prev => [...prev, data.url]);
      } else {
        setVideoUrl(data.url);
      }
    } catch (err) {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

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
      </div>

      <div className="max-w-md mx-auto p-4 mt-2">
        <form action={createMoment} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100/50 space-y-5">
          <input type="hidden" name="imageUrls" value={previewImages.join(',')} />
          <input type="hidden" name="videoUrl" value={videoUrl} />

          {/* 内容输入 */}
          <textarea
            name="content"
            placeholder="今天发生了什么开心的事..."
            className="w-full h-32 p-4 bg-gray-50 rounded-2xl resize-none text-base border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all placeholder-gray-400"
            required
          ></textarea>

          {/* 标签输入 */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold">#</span>
            <input 
              type="text" 
              name="tags"
              placeholder="添加标签 (如: 旅行 美食)"
              className="w-full pl-8 pr-4 py-3.5 bg-gray-50 rounded-2xl text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all"
            />
          </div>

          {/* 媒体预览区 */}
          <div className="grid grid-cols-3 gap-3">
            {/* 图片预览 */}
            {previewImages.map((src, idx) => (
              <img key={idx} src={src} className="aspect-square object-cover rounded-2xl shadow-sm border border-gray-100" />
            ))}
            
            {/* 视频预览 */}
            {videoUrl && (
              <video src={videoUrl} className="aspect-square object-cover rounded-2xl shadow-sm bg-black" controls />
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

          <button type="submit" disabled={uploading} className="w-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {uploading ? '正在上传媒体...' : '立即发布 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}