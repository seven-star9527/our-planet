import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  // 获取上传的文件
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
  }

  // 将文件转换为 Buffer 数据
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // 生成唯一的文件名 (时间戳 + 随机数 + 后缀)，防止重名
  const filename = Date.now() + '_' + Math.floor(Math.random() * 1000) + path.extname(file.name);
  
  // 确保 public/uploads 文件夹存在
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 写入文件到本地
  try {
    await writeFile(path.join(uploadDir, filename), buffer);
    // 返回可以在浏览器访问的 URL
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json({ error: '写入文件失败' }, { status: 500 });
  }
}