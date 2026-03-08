'use server'

import prisma from '@/lib/prisma'; 
import { revalidatePath } from 'next/cache'; 
import { redirect } from 'next/navigation';
import { getSettings } from './settings';
import { cookies } from 'next/headers'; // ✨ 新增：引入 cookies 用于读取身份

// ✨ 新增一个辅助函数：自动根据当前登录的身份，获取对应的专属昵称
async function getCurrentAuthorName() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value;

  const settings = await getSettings();
  const boyName = settings.boyName || '男主';
  const girlName = settings.girlName || '女主';

  if (role === 'boy') return boyName;
  if (role === 'girl') return girlName;
  return '神秘人'; // 兜底：万一没有走登录流程
}

// 1. 发布手账 (支持视频和标签)
export async function createMoment(formData: FormData) {
  const content = formData.get('content') as string;
  
  // ✨ 修改：获取真实的专属昵称，替换写死的 "我"
  const author = await getCurrentAuthorName(); 
  
  // 处理图片和视频
  const imageString = formData.get('imageUrls') as string;
  const images = imageString ? imageString.split(',').filter(Boolean) : [];
  const videoUrl = formData.get('videoUrl') as string;

  // 处理标签 (按空格或逗号分割，如 "#旅行 #开心" -> ["旅行", "开心"])
  const tagString = formData.get('tags') as string;
  const tags = tagString 
    ? tagString.split(/[\s,，]+/).map(t => t.replace('#', '')).filter(Boolean) 
    : [];

  await prisma.moment.create({
    data: { content, author, images, videoUrl, tags },
  });

  redirect('/moments');
}
// 更新手账内容
export async function updateMoment(id: number, newContent: string) {
  if (!newContent.trim()) return { success: false, error: '内容不能为空' };
  
  try {
    await prisma.moment.update({
      where: { id },
      data: { content: newContent.trim() }
    });
    revalidatePath('/moments');
    return { success: true };
  } catch (error) {
    return { success: false, error: '更新失败' };
  }
}

// 2. 发表评论
export async function addComment(momentId: number, content: string) {
  if (!content.trim()) return;
  
  // ✨ 修改：获取真实的专属昵称
  const authorName = await getCurrentAuthorName();

  await prisma.comment.create({
    data: {
      content,
      author: authorName, 
      momentId,
    },
  });
  
  // 刷新手账列表页，让评论立即显示
  revalidatePath('/moments'); 
}

// 3. 点赞/取消点赞
export async function toggleLike(momentId: number, emoji: string) {
  // ✨ 修改：获取真实的专属昵称
  const authorName = await getCurrentAuthorName();

  // 简单逻辑：直接添加一个赞
  await prisma.like.create({
    data: {
      author: authorName,
      emoji,
      momentId,
    },
  });

  revalidatePath('/moments');
}