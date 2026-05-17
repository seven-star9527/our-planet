import prisma from '@/lib/prisma';
import BucketListClient from './BucketListClient';

export const dynamic = 'force-dynamic';

export default async function BucketListPage() {
  const items = await prisma.bucketList.findMany({ orderBy: { createdAt: 'desc' } });

  const plainItems = items.map(item => ({
    id: item.id,
    title: item.title,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
  }));

  return <BucketListClient initialItems={plainItems} />;
}
