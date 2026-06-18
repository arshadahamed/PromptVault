import { notFound } from 'next/navigation';
import { getPromptById } from '@/data/prompts';
import { PromptDetail } from '@/components/prompt/PromptDetail';

export const dynamic = 'force-dynamic';

export default async function PromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prompt = getPromptById(id);
  if (!prompt) notFound();
  return <PromptDetail prompt={prompt} />;
}
