'use client'

import { useState } from 'react';
import { addComment, toggleLike } from '@/actions/moments';

export default function MomentCard({ moment, currentUser = "我" }: { moment: any, currentUser?: string }) {
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // 快捷表情包
  const emojis = ["❤️", "🫂", "👍", "🔥", "😭"];

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
      {/* 头部信息 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold">
            {moment.author[0]}
          </div>
          <div>
            <div className="font-bold text-gray-800">{moment.author}</div>
            <div className="text-xs text-gray-400">{new Date(moment.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        {/* 标签展示 */}
        <div className="flex gap-1">
          {moment.tags.map((tag: string, i: number) => (
            <span key={i} className="text-xs bg-pink-50 text-pink-500 px-2 py-1 rounded-full">#{tag}</span>
          ))}
        </div>
      </div>

      {/* 内容主体 */}
      <p className="mb-3 text-gray-700">{moment.content}</p>

      {/* 图片展示 */}
      {moment.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {moment.images.map((img: string, idx: number) => (
            <img key={idx} src={img} className="rounded-lg object-cover aspect-square w-full" />
          ))}
        </div>
      )}

      {/* 视频展示 */}
      {moment.videoUrl && (
        <video src={moment.videoUrl} controls className="w-full rounded-lg max-h-64 bg-black mb-3" />
      )}

      {/* 互动数据栏 */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mt-4 border-t border-gray-50 pt-3">
        {/* 点赞列表 */}
        <div className="flex-1 flex flex-wrap gap-1 items-center">
          {moment.likes.length > 0 && (
            <div className="flex -space-x-1 mr-2">
               {moment.likes.slice(0, 5).map((like: any, i: number) => (
                 <span key={i} className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-xs border border-white">
                   {like.emoji}
                 </span>
               ))}
            </div>
          )}
          <div className="flex gap-1">
            {emojis.map(e => (
              <button key={e} onClick={() => toggleLike(moment.id, e)} className="hover:scale-125 transition-transform">
                {e}
              </button>
            ))}
          </div>
        </div>
        
        <button onClick={() => setIsCommenting(!isCommenting)} className="text-pink-500 font-medium">
          💬 {moment.comments.length}
        </button>
      </div>

      {/* 评论区 */}
      {(isCommenting || moment.comments.length > 0) && (
        <div className="bg-gray-50 rounded-xl p-3 mt-3">
          {/* 历史评论 */}
          <div className="space-y-2 mb-3">
            {moment.comments.map((c: any) => (
              <div key={c.id} className="text-sm">
                <span className="font-bold text-gray-700">{c.author}: </span>
                <span className="text-gray-600">{c.content}</span>
              </div>
            ))}
          </div>
          
          {/* 评论输入框 */}
          <div className="flex gap-2">
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写评论..."
              className="flex-1 text-sm p-2 rounded-lg border border-gray-200 focus:outline-pink-500"
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
                   addComment(moment.id, commentText);
                   setCommentText('');
                }
              }}
            />
            <button 
              onClick={() => {
                addComment(moment.id, commentText);
                setCommentText('');
              }}
              className="text-xs bg-pink-500 text-white px-3 rounded-lg"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
}