'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function SidebarLogoutButton() {
  const router = useRouter();
  const { setIsAdmin } = useApp();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAdmin(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="w-full flex items-center justify-center gap-2 h-9 rounded-[10px] text-[12px] font-medium transition-colors cursor-pointer bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400"
    >
      <LogOut size={12} />
      Logout
    </button>
  );
}
