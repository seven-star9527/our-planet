import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import COS from 'cos-nodejs-sdk-v5';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
  }

  // File type validation (extension-based, with MIME as secondary check)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm'];
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm',
  ];

  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return NextResponse.json({ error: `不支持的文件类型: ${ext}` }, { status: 400 });
  }

  // MIME type is a secondary check — some browsers report empty or non-standard types
  if (file.type && !allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: `不支持的文件格式: ${file.type}` }, { status: 400 });
  }

  // File size limit: 50MB
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: '文件大小不能超过 50MB' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = Date.now() + '_' + Math.floor(Math.random() * 1000) + path.extname(file.name);

  // 检查是否配置了腾讯云 COS
  const secretId = process.env.TENCENT_COS_SECRET_ID;
  const secretKey = process.env.TENCENT_COS_SECRET_KEY;
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;

  if (secretId && secretKey && bucket && region) {
    // 使用 COS 上传
    try {
      const cos = new COS({ SecretId: secretId, SecretKey: secretKey });

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cos.putObject(
          {
            Bucket: bucket,
            Region: region,
            Key: `uploads/${filename}`,
            Body: buffer,
          },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      });

      const url = `https://${uploadResult.Location}`;
      return NextResponse.json({ url });
    } catch (error) {
      console.error('COS 上传失败:', error);
      return NextResponse.json({ error: 'COS 上传失败' }, { status: 500 });
    }
  }

  // 降级：如果未配置 COS，写入本地目录
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    await writeFile(path.join(uploadDir, filename), buffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('本地上传失败:', error);
    return NextResponse.json({ error: '写入本地文件失败' }, { status: 500 });
  }
}
