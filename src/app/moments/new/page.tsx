'use client'

import { createMoment } from '@/actions/moments';
import { useState } from 'react';

export default function NewMomentPage() {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>(''); // [新增] 视频状态
  const [uploading, setUploading] = useState(false);

  // 通用上传处理 (图片+视频)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]); // 视频一次只传一个，图片简单起见也单选逻辑，可自行改多选

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
    <div className="min-h-screen bg-white p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6 text-gray-800">发布新动态 📸</h1>
      
      <form action={createMoment} className="space-y-4">
        <input type="hidden" name="imageUrls" value={previewImages.join(',')} />
        <input type="hidden" name="videoUrl" value={videoUrl} />

        {/* 内容输入 */}
        <textarea
          name="content"
          placeholder="分享此刻的心情..."
          className="w-full h-32 p-4 bg-gray-50 rounded-xl resize-none text-base outline-none focus:bg-pink-50"
          required
        ></textarea>

        {/* 标签输入 */}
        <input 
          type="text" 
          name="tags"
          placeholder="#标签 (如: 旅行 美食)"
          className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:bg-pink-50"
        />

        {/* 媒体预览区 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 图片预览 */}
          {previewImages.map((src, idx) => (
            <img key={idx} src={src} className="aspect-square object-cover rounded-lg" />
          ))}
          
          {/* 视频预览 (如果有) */}
          {videoUrl && (
            <video src={videoUrl} className="aspect-square object-cover rounded-lg bg-black" controls />
          )}

          {/* 上传按钮组 */}
          <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'image')} />
            <span className="text-gray-400 text-xs">📷 照片</span>
          </label>
          
          <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer">
            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleUpload(e, 'video')} />
            <span className="text-gray-400 text-xs">🎥 视频</span>
          </label>
        </div>

        <button type="submit" disabled={uploading} className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold mt-4">
          {uploading ? '上传中...' : '发布'}
        </button>
      </form>
    </div>
  );
}