import { cookies } from 'next/headers';
import { AppProvider } from '@/context/AppContext';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { MobileHeader } from '@/components/sidebar/MobileHeader';
import { ModalRoot } from '@/components/modals/ModalRoot';
import { getSettings } from '@/lib/settings';
import { verifyToken, COOKIE } from '@/lib/auth';

export default async function GalleryLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  const cookieStore = await cookies();
  const token       = cookieStore.get(COOKIE)?.value;
  const isLoggedIn  = token ? await verifyToken(token) : false;

  return (
    <AppProvider>
      <MobileHeader siteName={settings.siteName} settings={settings} isLoggedIn={isLoggedIn} />
      <div className="flex min-h-screen pt-12 md:pt-0">
        <div className="hidden md:block w-[260px] shrink-0" />
        <div className="hidden md:block">
          <Sidebar settings={settings} isLoggedIn={isLoggedIn} />
        </div>
        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>
      <ModalRoot />
    </AppProvider>
  );
}
