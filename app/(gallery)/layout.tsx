import { AppProvider } from '@/context/AppContext';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { MobileHeader } from '@/components/sidebar/MobileHeader';
import { ModalRoot } from '@/components/modals/ModalRoot';
import { getSettings } from '@/lib/settings';
import { getTabCounts } from '@/lib/db';

export const revalidate = 60;

export default async function GalleryLayout({ children }: { children: React.ReactNode }) {
  const [settings, tabCounts] = await Promise.all([
    getSettings(),
    getTabCounts(),
  ]);

  return (
    <AppProvider>
      <MobileHeader siteName={settings.siteName} settings={settings} tabCounts={tabCounts} />
      <div className="flex min-h-screen pt-14 md:pt-0">
        <div className="hidden md:block w-[260px] shrink-0" />
        <div className="hidden md:block">
          <Sidebar settings={settings} tabCounts={tabCounts} />
        </div>
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
      <ModalRoot />
    </AppProvider>
  );
}
