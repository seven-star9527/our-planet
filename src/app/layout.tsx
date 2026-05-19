import type { Metadata } from "next";
import { cookies } from 'next/headers';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingCat from "./FloatingCat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "我们的专属星球 💫",
  description: "一个专为你们打造的私密记忆空间",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'system';

  return (
    <html lang="zh-CN" className={theme === 'dark' ? 'dark' : ''}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = document.cookie.replace(/(?:(?:^|.*;\\s*)theme\\s*\\=\\s*([^;]*).*$)|^.*$/, "$1") || 'system';
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <FloatingCat />
      </body>
    </html>
  );
}
