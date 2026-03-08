'use client'

import { useState } from 'react';
import { addComment, toggleLike, updateMoment } from '@/actions/moments'; // ✨ 引入 updateMoment

export default function MomentCard({ moment, currentUser = "我" }: { moment: any, currentUser?: string }) {
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // ✨ 新增：用于控制全屏图片预览的状态
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // ✨ 新增：编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(moment.content);
  const [isSaving, setIsSaving] = useState(false);

  // ✨ 保存修改的方法
  const handleSaveEdit = async () => {
    setIsSaving(true);
    const res = await updateMoment(moment.id, editContent);
    if (res.success) {
      setIsEditing(false);
    } else {
      alert(res.error);
    }
    setIsSaving(false);
  };

  // 快捷表情包
  const emojis = ["❤️", "🫂", "👍", "🔥", "✨"];

  return (
    <> {/* ✨ 关键修复：添加一个空的根标签 */}
      <div className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100/80 mb-5">
        {/* 头部信息 */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {moment.author[0]}
            </div>
            <div>
              <div className="font-bold text-gray-800 text-sm md:text-base">{moment.author}
                <button 
                onClick={() => setIsEditing(!isEditing)} 
                className="text-xs text-gray-400 hover:text-pink-500 font-normal bg-gray-50 px-2 py-0.5 rounded-full"
              >
                {isEditing ? '取消' : '编辑'}
              </button>
              </div>
              <div className="text-xs text-gray-400 font-medium">{new Date(moment.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          {/* 标签展示 */}
          <div className="flex flex-wrap justify-end gap-1.5 max-w-[40%]">
            {moment.tags.map((tag: string, i: number) => (
              <span key={i} className="text-[10px] md:text-xs bg-pink-50 border border-pink-100 text-pink-500 px-2.5 py-1 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 内容主体 */}
        {isEditing ? (
        <div className="mb-4">
          <textarea 
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 bg-pink-50/50 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none text-sm md:text-base text-gray-700"
            rows={3}
          />
          <button 
            onClick={handleSaveEdit}
            disabled={isSaving}
            className="mt-2 bg-pink-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存修改'}
          </button>
        </div>
      ) : (
        <p className="mb-4 text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-wrap">{moment.content}</p>
      )}

        {/* 图片展示 */}
        {moment.images && moment.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {moment.images.map((img: string, idx: number) => (
                <img 
                  key={idx} 
                  src={img} 
                  onClick={() => setSelectedImage(img)} // 点击设置当前图片
                  className="rounded-2xl object-cover aspect-square w-full border border-gray-100 cursor-zoom-in hover:opacity-90 transition-opacity" 
                  alt="moment image"
                />
              ))}
            </div>
          )}

        {/* 视频展示 */}
        {moment.videoUrl && (
          <video src={moment.videoUrl} controls className="w-full rounded-2xl max-h-72 bg-black mb-4 shadow-sm" />
        )}

        {/* 互动数据栏 */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2 border-t border-gray-50 pt-3.5">
          {/* 点赞列表 */}
          <div className="flex-1 flex flex-wrap gap-1.5 items-center">
            {moment.likes && moment.likes.length > 0 && (
              <div className="flex -space-x-1.5 mr-2">
                 {moment.likes.slice(0, 5).map((like: any, i: number) => (
                   <span key={i} className="bg-gray-50 rounded-full w-7 h-7 flex items-center justify-center text-xs border-2 border-white shadow-sm z-10 relative">
                     {like.emoji}
                   </span>
                 ))}
              </div>
            )}
            <div className="flex gap-2">
              {emojis.map(e => (
                <button key={e} onClick={() => toggleLike(moment.id, e)} className="hover:scale-125 transition-transform text-lg">
                  {e}
                </button>
              ))}
            </div>
          </div>
          
          <button onClick={() => setIsCommenting(!isCommenting)} className="text-pink-500 font-bold bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors flex items-center gap-1">
            💬 {moment.comments?.length || 0}
          </button>
        </div>

        {/* 评论区 */}
        {(isCommenting || (moment.comments && moment.comments.length > 0)) && (
          <div className="bg-gray-50/80 rounded-2xl p-4 mt-4 border border-gray-100">
            {/* 历史评论 */}
            {moment.comments && moment.comments.length > 0 && (
              <div className="space-y-2.5 mb-4">
                {moment.comments.map((c: any) => (
                  <div key={c.id} className="text-sm leading-relaxed">
                    <span className="font-bold text-gray-700">{c.author}: </span>
                    <span className="text-gray-600">{c.content}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* 评论输入框 */}
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="说点什么吧..."
                className="flex-1 text-sm p-2.5 px-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all shadow-sm"
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && commentText.trim()) {
                     addComment(moment.id, commentText);
                     setCommentText('');
                  }
                }}
              />
              <button 
                onClick={() => {
                  if(commentText.trim()) {
                    addComment(moment.id, commentText);
                    setCommentText('');
                  }
                }}
                disabled={!commentText.trim()}
                className="text-sm bg-gradient-to-r from-pink-500 to-rose-400 text-white px-4 py-2.5 rounded-xl font-bold disabled:opacity-50 transition-opacity"
              >
                发送
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 全屏图片预览遮罩层 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out opacity-100 transition-opacity"
          onClick={() => setSelectedImage(null)} // 点击空白处关闭
        >
          <button className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors">
            ✕
          </button>
          <img 
            src={selectedImage} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            alt="Enlarged"
            onClick={(e) => e.stopPropagation()} // 阻止点击图片本身时关闭
          />
        </div>
      )}
    </> /* ✨ 关键修复：闭合空的根标签 */
  );
}