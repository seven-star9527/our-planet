// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 获取当前用户的身份 cookie
  const role = request.cookies.get('user_role')?.value;

  // 如果没有身份，且当前不在 login 页面，则强制跳转到 /login
  if (!role && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// 配置拦截规则（放行静态资源和 API）
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}