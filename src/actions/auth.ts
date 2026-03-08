// src/actions/auth.ts
'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function selectIdentity(role: 'boy' | 'girl') {
  // ✨ 关键修复：加了 await
  const cookieStore = await cookies();
  
  // 把身份写入 Cookie，有效期 1 年
  cookieStore.set('user_role', role, { 
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
  });
  
  // 选完身份后，带你们回首页！
  redirect('/welcome');
}

export async function logout() {
  // ✨ 关键修复：加了 await
  const cookieStore = await cookies();
  
  cookieStore.delete('user_role');
  redirect('/login');
}