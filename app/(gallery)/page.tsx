import { getPromptsPaginated, getTabCounts } from '@/lib/db';
import { toPrompt } from '@/lib/prompts';
import { getSettings } from '@/lib/settings';
import { GalleryClient } from './GalleryClient';

export const revalidate = 60;

const PAGE_SIZE = 24;

export default async function Home() {
  const [dbPrompts, tabCounts, settings] = await Promise.all([
    getPromptsPaginated({ tab: 'All', sort: 'Featured', page: 1, limit: PAGE_SIZE }),
    getTabCounts(),
    getSettings(),
  ]);

  const prompts = dbPrompts.map(toPrompt);
  const total = tabCounts.All ?? prompts.length;

  return (
    <GalleryClient
      initialPrompts={prompts}
      initialTotal={total}
      tabCounts={tabCounts}
      settings={settings}
    />
  );
}
