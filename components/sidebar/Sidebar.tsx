import { NavItems } from './NavItems';
import { Categories } from './Categories';
import { SidebarFooter } from './SidebarFooter';
import type { SiteSettings } from '@/lib/settings';

interface Props {
  settings: SiteSettings;
  isLoggedIn: boolean;
  onTagSelect?: (t: string) => void;
  onNavigate?: () => void;
}

export function Sidebar({ settings, isLoggedIn, onTagSelect, onNavigate }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 w-[260px] flex flex-col bg-white border-r border-[#e5e7eb] z-30 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2.5 shrink-0">
        {settings.logoImageUrl ? (
          <img src={settings.logoImageUrl} alt={settings.siteName} className="w-7 h-7 rounded-[8px] object-contain" />
        ) : (
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #1b1b1b, #3d3d3d)' }}
          >
            <span className="text-white text-xs font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {settings.logoText || 'M'}
            </span>
          </div>
        )}
        <span
          className="text-[13px] font-semibold text-[#1b1b1b]"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {settings.siteName || 'MeiGen Gallery'}
        </span>
      </div>

      {/* Nav items */}
      <NavItems onNavigate={onNavigate} />

      <div className="mx-4 my-2 h-px bg-[#e5e7eb]" />

      {/* Categories */}
      <Categories onTagSelect={onTagSelect} />

      {/* Spacer */}
      <div className="flex-1 min-h-4" />

      <div className="mx-4 mb-2 h-px bg-[#e5e7eb]" />

      {/* Footer */}
      <SidebarFooter settings={settings} isLoggedIn={isLoggedIn} />
    </aside>
  );
}
