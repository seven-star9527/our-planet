// 设置API路由
// 处理纪念日设置的保存和获取

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取设置
export async function GET() {
  try {
    // 分别获取纪念日日期和名称的键值对
    const dateSetting = await prisma.appSetting.findFirst({
      where: { key: 'anniversaryDate' },
    });
    
    const nameSetting = await prisma.appSetting.findFirst({
      where: { key: 'anniversaryName' },
    });

    return NextResponse.json({
      success: true,
      data: {
        anniversaryDate: dateSetting?.value || null,
        anniversaryName: nameSetting?.value || '在一起的纪念日',
      },
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取设置失败',
      },
      { status: 500 }
    );
  }
}

// 保存设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anniversaryDate, anniversaryName } = body;

    // 验证数据
    if (!anniversaryDate) {
      return NextResponse.json(
        {
          success: false,
          message: '纪念日日期不能为空',
        },
        { status: 400 }
      );
    }

    // 封装一个保存单个配置的辅助函数
    const saveSetting = async (key: string, value: string) => {
      const existing = await prisma.appSetting.findFirst({ where: { key } });
      if (existing) {
        await prisma.appSetting.update({
          where: { id: existing.id },
          data: { value },
        });
      } else {
        await prisma.appSetting.create({
          data: { key, value },
        });
      }
    };

    // 保存两个配置项，确保日期以标准格式存储
    await saveSetting('anniversaryDate', new Date(anniversaryDate).toISOString());
    await saveSetting('anniversaryName', anniversaryName || '在一起的纪念日');

    return NextResponse.json({
      success: true,
      message: '设置保存成功',
      data: {
        anniversaryDate,
        anniversaryName: anniversaryName || '在一起的纪念日',
      },
    });
  } catch (error) {
    console.error('保存设置失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '保存设置失败',
      },
      { status: 500 }
    );
  }
}