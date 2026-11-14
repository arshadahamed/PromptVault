'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PromptForm } from '@/components/admin/PromptForm';
import { AdminButton, AdminPageHeader } from '@/components/admin/ui/Primitives';

export default function NewPromptPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Add New Prompt"
        description="Upload media or attach an image URL, set classification, and publish to the gallery."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Prompts', href: '/admin/prompts' },
          { label: 'New Prompt' },
        ]}
        actions={
          <Link href="/admin/prompts">
            <AdminButton variant="outline" size="sm" icon={<ArrowLeft size={13} />}>
              Back to Prompts
            </AdminButton>
          </Link>
        }
      />

      <PromptForm mode="create" />
    </div>
  );
}
