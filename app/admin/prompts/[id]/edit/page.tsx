'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Pencil } from 'lucide-react';
import { PromptForm } from '@/components/admin/PromptForm';
import { useAdminTheme, tk } from '@/context/AdminThemeContext';
import { use } from 'react';

export default function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prompt, setPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { resolved } = useAdminTheme();
  const t = tk(resolved);

  useEffect(() => {
    fetch(`/api/admin/prompts/${id}`)
      .then((r) => r.json())
      .then((data) => { setPrompt(data); setLoading(false); });
  }, [id]);

  return (
    <div className="p-6 lg:p-8">
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
            <Pencil size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: t.text }}>Edit Prompt</h1>
            <p className="text-[13px] mt-0.5" style={{ color: t.textMuted }}>
              Update prompt details, image, or metadata
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-[14px]" style={{ color: t.textMuted }}>
          <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: t.accent, borderTopColor: 'transparent' }} />
          Loading…
        </div>
      ) : prompt?.error ? (
        <div className="px-4 py-3 rounded-xl text-[13px]"
          style={{ background: t.danger, border: `1px solid ${t.dangerBorder}`, color: t.dangerText }}>
          Prompt not found.
        </div>
      ) : (
        <PromptForm mode="edit" initial={prompt} />
      )}
    </div>
  );
}
