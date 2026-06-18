'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function SidebarLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="w-full flex items-center justify-center gap-2 h-9 rounded-[10px] text-[12px] font-medium transition-colors cursor-pointer"
      style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.15)',
        color: '#ef4444',
      }}
    >
      <LogOut size={12} />
      Logout
    </button>
  );
}
