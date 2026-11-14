'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { DbPrompt } from '@/lib/db';
import { PromptForm } from '@/components/admin/PromptForm';
import {
  AdminBadge, AdminButton, AdminErrorState, AdminPageHeader,
} from '@/components/admin/ui/Primitives';

export default function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prompt, setPrompt] = useState<DbPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/prompts/${id}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(res.status === 404 ? 'Prompt not found.' : data.error || 'Failed to load prompt.');
        }
        return res.json() as Promise<DbPrompt>;
      })
      .then((data) => {
        setPrompt(data);
        setError('');
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Unable to load prompt.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, reloadTick]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Edit Prompt"
        description="Update prompt content, media, framing, or visibility settings."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Prompts', href: '/admin/prompts' },
          { label: id },
        ]}
        badge={
          prompt ? (
            <AdminBadge variant={prompt.published === false ? 'danger' : 'success'}>
              {prompt.published === false ? 'Draft' : 'Published'}
            </AdminBadge>
          ) : null
        }
        actions={
          <Link href="/admin/prompts">
            <AdminButton variant="outline" size="sm" icon={<ArrowLeft size={13} />}>
              Back to Prompts
            </AdminButton>
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-[390px_1fr] gap-6">
          <div className="h-96 rounded-2xl admin-skeleton" />
          <div className="h-96 rounded-2xl admin-skeleton" />
        </div>
      ) : error || !prompt ? (
        <AdminErrorState
          message={error || 'Prompt not found.'}
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadTick((n) => n + 1);
          }}
        />
      ) : (
        <PromptForm mode="edit" initial={prompt} />
      )}
    </div>
  );
}
