'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache'; // 关键：用于操作后即时刷新页面
import { redirect } from 'next/navigation';

// 1. 发布手账 (支持视频和标签)
export async function createMoment(formData: FormData) {
  const content = formData.get('content') as string;
  const author = "我"; // 暂时写死
  
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

// 2. 发表评论
export async function addComment(momentId: number, content: string) {
  if (!content.trim()) return;
  
  await prisma.comment.create({
    data: {
      content,
      author: "我", // 实际项目中应获取当前登录用户
      momentId,
    },
  });
  
  // 刷新手账列表页，让评论立即显示
  revalidatePath('/moments'); 
}

// 3. 点赞/取消点赞
export async function toggleLike(momentId: number, emoji: string) {
  // 简单逻辑：如果我已经赞过，就当做是追加新的表情，或者你可以做成“取消赞”
  // 这里我们做成：直接添加一个赞
  await prisma.like.create({
    data: {
      author: "我",
      emoji,
      momentId,
    },
  });

  revalidatePath('/moments');
}