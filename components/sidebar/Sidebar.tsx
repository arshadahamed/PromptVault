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
    <aside className="fixed inset-y-0 left-0 w-[260px] flex flex-col z-30 overflow-y-auto"
      style={{ background: '#0f0f12', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 shrink-0">
        {settings.logoImageUrl ? (
          <img src={settings.logoImageUrl} alt={settings.siteName} className="w-8 h-8 rounded-[10px] object-contain" />
        ) : (
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 anim-glow-pulse"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            <span className="text-white text-xs font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {settings.logoText || 'P'}
            </span>
          </div>
        )}
        <div className="flex flex-col">
          <span
            className="text-[14px] font-bold text-white leading-tight"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {settings.siteName || 'PromptVault'}
          </span>
          <span className="text-[10px] font-medium" style={{ color: '#5c5c6b' }}>
            AI Prompt Gallery
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-2 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Nav items */}
      <NavItems onNavigate={onNavigate} />

      <div className="mx-4 my-3 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Categories */}
      <Categories onTagSelect={onTagSelect} />

      {/* Spacer */}
      <div className="flex-1 min-h-4" />

      <div className="mx-4 mb-2 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Footer */}
      <SidebarFooter settings={settings} isLoggedIn={isLoggedIn} />
    </aside>
  );
}
