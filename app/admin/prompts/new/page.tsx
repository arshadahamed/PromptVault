'use client';
import Link from 'next/link';
import { ChevronLeft, Plus } from 'lucide-react';
import { PromptForm } from '@/components/admin/PromptForm';
import { useAdminTheme, tk } from '@/context/AdminThemeContext';

export default function NewPromptPage() {
  const { resolved } = useAdminTheme();
  const t = tk(resolved);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-7">
        <Link href="/admin/prompts"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-4 transition-colors"
          style={{ color: t.textMuted }}
          onMouseEnter={(e) => (e.currentTarget.style.color = t.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}>
          <ChevronLeft size={14} /> Back to Prompts
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
            <Plus size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: t.text }}>Add New Prompt</h1>
            <p className="text-[13px] mt-0.5" style={{ color: t.textMuted }}>
              Upload an image and enter the full prompt text
            </p>
          </div>
        </div>
      </div>

      <PromptForm mode="create" />
    </div>
  );
}
