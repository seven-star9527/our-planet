import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    // 允许 API 路由接收最大 50MB 的请求体（解决 413 上传失败）
    proxyClientMaxBodySize: '50mb',
  },
};

export default nextConfig;
