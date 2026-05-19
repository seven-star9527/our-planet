import { cookies } from 'next/headers';
import Link from 'next/link';
import { getSettings } from '@/actions/settings';
import MoodClient from './MoodClient';

export const dynamic = 'force-dynamic';

export default async function MoodPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value || 'boy';
  const settings = await getSettings();
  const boyName = settings.boyName || '男主';
  const girlName = settings.girlName || '女主';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center shadow-sm">
        <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-all duration-150 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 active:bg-gray-200 dark:active:bg-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 ml-2">😊 心情日记</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <MoodClient role={role} boyName={boyName} girlName={girlName} />
      </div>
    </div>
  );
}
