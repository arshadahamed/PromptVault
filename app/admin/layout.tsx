import { AdminThemeProvider } from '@/context/AdminThemeContext';
import { ToastProvider } from '@/components/admin/ui/ToastProvider';
import { AdminShell } from '@/components/admin/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <ToastProvider>
        <AdminShell>{children}</AdminShell>
      </ToastProvider>
    </AdminThemeProvider>
  );
}
