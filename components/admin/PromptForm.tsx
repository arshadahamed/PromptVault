'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload, Link as LinkIcon, Check, Loader2, Image as ImageIcon, Type,
  Cpu, User, BarChart2, Palette, Trash2, ExternalLink, Sparkles, X, Plus,
  Code2, Images, ArrowLeft, ArrowRight, FileCode2, Globe, Tag, Layers,
} from 'lucide-react';
import type { DbCategory, DbPrompt } from '@/lib/db';
import {
  ALL_MODELS,
  ALL_TABS,
  CODE_LANGUAGES,
  STACK_TAG_PRESETS,
  VIBE_CODING_MODELS,
  detectLanguageFromFilename,
} from '@/lib/vibe-coding';
import {
  AdminBadge, AdminButton, AdminCard, AdminFormField, AdminInput,
  AdminSectionHeader, AdminSelect, AdminSwitch, AdminTextarea,
} from './ui/Primitives';
import { ConfirmDialog } from './ui/Dialog';
import { useToast } from './ui/ToastProvider';

const MODELS = [...ALL_MODELS];
const TABS = [...ALL_TABS];

const DEFAULT_CATEGORIES = [
  'Vibe Coding', 'ChatGPT', 'Midjourney', 'Nanobanana', 'Seedance', 'DALL-E',
  'Flux', 'Stable Diffusion', 'Adobe Firefly', 'Leonardo AI', 'Gemini',
];

const ASPECTS = ['4/3', '16/9', '1/1', '9/16', '3/4', '2/3'];

const GRADIENT_PRESETS: [string, string][] = [
  ['#b4d4f5', '#f5d4b4'],
  ['#c7b4e8', '#f5f0b4'],
  ['#d4f5b4', '#f5b4e8'],
  ['#f5b4d4', '#b4f5e8'],
  ['#e8d4f5', '#b4e8d4'],
  ['#0f172a', '#06b6d4'],
];

const MODEL_TO_TAB: Record<string, string> = {
  Claude: 'Vibe Coding',
  Cursor: 'Vibe Coding',
  Lovable: 'Vibe Coding',
  'Bolt.new': 'Vibe Coding',
  v0: 'Vibe Coding',
  Replit: 'Vibe Coding',
  Windsurf: 'Vibe Coding',
  'Seedance 2.0': 'Seedance',
  Midjourney: 'Midjourney',
  'DALL-E': 'DALL-E',
  Flux: 'Flux',
  'Stable Diffusion': 'Stable Diffusion',
  'Adobe Firefly': 'Adobe Firefly',
  'Leonardo AI': 'Leonardo AI',
  Gemini: 'Gemini',
  'Nanobanana Pro': 'Nanobanana',
  'Nanobanana 2': 'Nanobanana',
  'GPT Image': 'ChatGPT',
  ChatGPT: 'ChatGPT',
};

const VIBE_MODEL_SET = new Set<string>(VIBE_CODING_MODELS);

interface PromptFormState {
  title: string;
  promptText: string;
  imageUrl: string;
  localImg: string;
  galleryImages: string[];
  codeSnippet: string;
  codeLanguage: string;
  stackTags: string[];
  previewUrl: string;
  authorName: string;
  handle: string;
  model: string;
  tab: string;
  category: string;
  likes: number;
  views: number;
  gradientFrom: string;
  gradientTo: string;
  aspectRatio: string;
  published: boolean;
  featured: boolean;
}

function makeInitialState(initial?: DbPrompt): PromptFormState {
  return {
    title: initial?.title || '',
    promptText: initial?.promptText || '',
    imageUrl: initial?.imageUrl || '',
    localImg: initial?.localImg || '',
    galleryImages: Array.isArray(initial?.galleryImages) ? initial.galleryImages : [],
    codeSnippet: initial?.codeSnippet || '',
    codeLanguage: initial?.codeLanguage || '',
    stackTags: Array.isArray(initial?.stackTags) ? initial.stackTags : [],
    previewUrl: initial?.previewUrl || '',
    authorName: initial?.authorName || '',
    handle: initial?.handle || '',
    model: initial?.model || 'ChatGPT',
    tab: initial?.tab || 'ChatGPT',
    category: initial?.category || 'ChatGPT',
    likes: initial?.likes ?? 0,
    views: initial?.views ?? 0,
    gradientFrom: initial?.gradientFrom || '#b4d4f5',
    gradientTo: initial?.gradientTo || '#f5d4b4',
    aspectRatio: initial?.aspectRatio || '4/3',
    published: initial?.published ?? true,
    featured: initial?.featured ?? false,
  };
}

function hasVibeData(state: PromptFormState): boolean {
  return (
    state.tab === 'Vibe Coding' ||
    state.category === 'Vibe Coding' ||
    Boolean(state.title.trim()) ||
    Boolean(state.codeSnippet.trim()) ||
    Boolean(state.previewUrl.trim()) ||
    state.stackTags.length > 0 ||
    state.galleryImages.length > 0
  );
}

function closestAspectRatio(w: number, h: number): string {
  if (!w || !h) return '4/3';
  const ratio = w / h;
  let best = ASPECTS[0];
  let bestDiff = Infinity;
  for (const candidate of ASPECTS) {
    const [cw, ch] = candidate.split('/').map(Number);
    const diff = Math.abs(ratio - cw / ch);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  return best;
}

interface Props {
  initial?: DbPrompt;
  mode: 'create' | 'edit';
}

export function PromptForm({ initial, mode }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const codeFileRef = useRef<HTMLInputElement>(null);

  const titleId = useId();
  const promptTextId = useId();
  const imageUrlId = useId();
  const previewUrlId = useId();
  const codeLangId = useId();
  const codeSnippetId = useId();
  const customTagId = useId();
  const galleryUrlId = useId();
  const modelId = useId();
  const tabId = useId();
  const categoryId = useId();
  const authorId = useId();
  const handleId = useId();
  const likesId = useId();
  const viewsId = useId();
  const aspectId = useId();

  const [initialSnapshot, setInitialSnapshot] = useState<PromptFormState>(() => makeInitialState(initial));
  const [form, setForm] = useState<PromptFormState>(() => makeInitialState(initial));
  const [showVibeTools, setShowVibeTools] = useState<boolean>(() =>
    hasVibeData(makeInitialState(initial))
  );

  const [imgTab, setImgTab] = useState<'upload' | 'url'>(() =>
    initial?.localImg ? 'upload' : initial?.imageUrl ? 'url' : 'upload'
  );
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [galleryUrlError, setGalleryUrlError] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
  const [suggestedAspect, setSuggestedAspect] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    promptText?: string;
    imageUrl?: string;
    previewUrl?: string;
  }>({});
  const [submitError, setSubmitError] = useState('');

  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: DbCategory[]) => {
        if (!Array.isArray(list) || list.length === 0) return;
        const merged = Array.from(new Set([...list.map((c) => c.name), ...DEFAULT_CATEGORIES]));
        setCategories(merged);
      })
      .catch(() => {});
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialSnapshot),
    [form, initialSnapshot]
  );

  useEffect(() => {
    if (!isDirty || saved) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, saved]);

  function setField<K extends keyof PromptFormState>(key: K, value: PromptFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'promptText' || key === 'imageUrl' || key === 'previewUrl') {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function applyPreset(preset: 'image' | 'vibe') {
    if (preset === 'vibe') {
      setShowVibeTools(true);
      setForm((prev) => ({
        ...prev,
        tab: 'Vibe Coding',
        category: 'Vibe Coding',
        model: VIBE_MODEL_SET.has(prev.model) ? prev.model : 'Claude',
        codeLanguage: prev.codeLanguage || 'tsx',
        aspectRatio: prev.aspectRatio === '4/3' ? '16/9' : prev.aspectRatio,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        tab: 'ChatGPT',
        category: 'ChatGPT',
        model: VIBE_MODEL_SET.has(prev.model) && prev.model !== 'ChatGPT' && prev.model !== 'Gemini'
          ? 'ChatGPT'
          : prev.model,
        aspectRatio: prev.aspectRatio === '16/9' ? '4/3' : prev.aspectRatio,
      }));
    }
  }

  async function uploadSingleToR2(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error(`"${file.name}" is not a valid image file.`);
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`"${file.name}" exceeds the 10 MB upload limit.`);
    }
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.localImg) {
      throw new Error(data.error || `Upload failed for ${file.name}.`);
    }
    return data.localImg as string;
  }

  async function uploadFile(file: File) {
    setUploadError('');
    setUploading(true);
    try {
      const localImg = await uploadSingleToR2(file);
      setField('localImg', localImg);
      setSuggestedAspect(null);
      toast({ title: 'Cover image uploaded to R2', variant: 'success', durationMs: 2500 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setUploadError(msg);
      toast({ title: 'Upload failed', description: msg, variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function uploadGalleryFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const remaining = Math.max(0, 10 - form.galleryImages.length);
    if (remaining === 0) {
      toast({ title: 'Gallery limit reached (max 10 extra photos)', variant: 'info' });
      return;
    }

    const slice = files.slice(0, remaining);
    setGalleryUploading(true);
    setGalleryUrlError('');
    try {
      const uploaded: string[] = [];
      for (const file of slice) {
        const url = await uploadSingleToR2(file);
        uploaded.push(url);
      }
      setForm((prev) => ({
        ...prev,
        galleryImages: Array.from(new Set([...prev.galleryImages, ...uploaded])).slice(0, 10),
      }));
      toast({
        title: `Uploaded ${uploaded.length} gallery ${uploaded.length === 1 ? 'photo' : 'photos'}`,
        variant: 'success',
        durationMs: 2500,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setGalleryUrlError(msg);
      toast({ title: 'Gallery upload error', description: msg, variant: 'error' });
    } finally {
      setGalleryUploading(false);
      if (galleryFileRef.current) galleryFileRef.current.value = '';
    }
  }

  function addGalleryUrl() {
    const u = galleryUrlInput.trim();
    if (!u) return;
    if (!(u.startsWith('/') || /^https?:\/\//i.test(u))) {
      setGalleryUrlError('URL must start with https://, http://, or /');
      return;
    }
    if (form.galleryImages.length >= 10) {
      setGalleryUrlError('Maximum 10 extra photos allowed.');
      return;
    }
    setGalleryUrlError('');
    setForm((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.includes(u) ? prev.galleryImages : [...prev.galleryImages, u],
    }));
    setGalleryUrlInput('');
  }

  function moveGalleryPhoto(idx: number, delta: -1 | 1) {
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= form.galleryImages.length) return;
    setForm((prev) => {
      const next = [...prev.galleryImages];
      const [item] = next.splice(idx, 1);
      next.splice(nextIdx, 0, item);
      return { ...prev, galleryImages: next };
    });
  }

  function promoteGalleryPhotoToCover(idx: number) {
    const chosen = form.galleryImages[idx];
    if (!chosen) return;
    setForm((prev) => {
      const oldCover = prev.localImg || prev.imageUrl;
      const nextGallery = prev.galleryImages.filter((_, i) => i !== idx);
      if (oldCover && oldCover !== chosen && !nextGallery.includes(oldCover)) {
        nextGallery.unshift(oldCover);
      }
      return {
        ...prev,
        localImg: chosen,
        imageUrl: prev.localImg ? prev.imageUrl : '',
        galleryImages: nextGallery.slice(0, 10),
      };
    });
    setImgTab('upload');
    toast({ title: 'Updated primary cover photo', variant: 'info', durationMs: 2000 });
  }

  function toggleStackTag(tag: string) {
    setForm((prev) => {
      const exists = prev.stackTags.some((t) => t.toLowerCase() === tag.toLowerCase());
      if (exists) {
        return {
          ...prev,
          stackTags: prev.stackTags.filter((t) => t.toLowerCase() !== tag.toLowerCase()),
        };
      }
      if (prev.stackTags.length >= 12) return prev;
      return { ...prev, stackTags: [...prev.stackTags, tag] };
    });
  }

  function addCustomTag() {
    const clean = customTagInput.trim().slice(0, 40);
    if (!clean) return;
    setForm((prev) => {
      if (prev.stackTags.some((t) => t.toLowerCase() === clean.toLowerCase()) || prev.stackTags.length >= 12) {
        return prev;
      }
      return { ...prev, stackTags: [...prev.stackTags, clean] };
    });
    setCustomTagInput('');
  }

  async function handleCodeFileSelect(file: File) {
    if (file.size > 512 * 1024) {
      toast({ title: 'Code file is too large (max 512 KB)', variant: 'error' });
      return;
    }
    const text = await file.text();
    const detected = detectLanguageFromFilename(file.name);
    setShowVibeTools(true);
    setForm((prev) => ({
      ...prev,
      codeSnippet: text,
      codeLanguage: detected,
      title:
        prev.title.trim() ||
        file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
    }));
    toast({
      title: `Loaded ${file.name} (${detected.toUpperCase()})`,
      variant: 'success',
      durationMs: 2500,
    });
    if (codeFileRef.current) codeFileRef.current.value = '';
  }

  function validate(): boolean {
    const nextErrors: { promptText?: string; imageUrl?: string; previewUrl?: string } = {};
    if (!form.promptText.trim()) {
      nextErrors.promptText = 'Prompt text is required.';
    }
    if (form.imageUrl.trim()) {
      const u = form.imageUrl.trim();
      const valid = u.startsWith('/') || /^https?:\/\//i.test(u);
      if (!valid) {
        nextErrors.imageUrl = 'URL must start with https://, http://, or /';
      }
    }
    if (form.previewUrl.trim()) {
      const p = form.previewUrl.trim();
      const valid = p.startsWith('/') || /^https?:\/\//i.test(p);
      if (!valid) {
        nextErrors.previewUrl = 'Preview URL must start with https://, http://, or /';
      }
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitPrompt(addAnother = false) {
    setSubmitError('');
    if (!validate()) return;

    setSaving(true);
    try {
      const url = mode === 'create' ? '/api/admin/prompts' : `/api/admin/prompts/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save prompt.');
      }

      if (mode === 'create' && addAnother) {
        toast({ title: 'Prompt created! Ready for next.', variant: 'success' });
        const resetState: PromptFormState = {
          ...form,
          title: '',
          promptText: '',
          imageUrl: '',
          localImg: '',
          galleryImages: [],
          codeSnippet: '',
          previewUrl: '',
          likes: 0,
          views: 0,
        };
        setForm(resetState);
        setInitialSnapshot(resetState);
        setSuggestedAspect(null);
        if (fileRef.current) fileRef.current.value = '';
        if (galleryFileRef.current) galleryFileRef.current.value = '';
        if (codeFileRef.current) codeFileRef.current.value = '';
      } else {
        setSaved(true);
        setInitialSnapshot(form);
        toast({
          title: mode === 'create' ? 'Prompt created' : 'Changes saved',
          variant: 'success',
        });
        setTimeout(() => {
          router.push('/admin/prompts');
          router.refresh();
        }, 500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save prompt.';
      setSubmitError(msg);
      toast({ title: 'Save failed', description: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/prompts/${initial.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete prompt');
      toast({ title: 'Prompt deleted', variant: 'success' });
      router.push('/admin/prompts');
      router.refresh();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
      setDeleting(false);
    }
  }

  // Show whichever tab is active first, falling back to the other source so clearing works cleanly
  const preview =
    imgTab === 'upload'
      ? form.localImg || form.imageUrl
      : form.imageUrl || form.localImg;

  const availableCategories = useMemo(
    () => (categories.includes(form.category) ? categories : [form.category, ...categories]),
    [categories, form.category]
  );

  const availableModels = useMemo(
    () => (MODELS.includes(form.model) ? MODELS : [form.model, ...MODELS]),
    [form.model]
  );

  const isVibeMode = showVibeTools || hasVibeData(form);
  const isVibeClassification =
    form.tab === 'Vibe Coding' || form.category === 'Vibe Coding';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submitPrompt(false);
      }}
      noValidate
    >
      {/* Format Mode Switcher (Standard Visual vs Vibe Coding Website) */}
      <div
        className="mb-5 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          backgroundColor: 'var(--adm-surface)',
          border: '1px solid var(--adm-border)',
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--adm-text)' }}>
              Prompt Package Type
            </span>
            <AdminBadge variant={isVibeClassification ? 'info' : 'neutral'}>
              {isVibeClassification ? 'Vibe Coding' : 'Visual / Image'}
            </AdminBadge>
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
            Switch presets anytime — upload code snippets, multiple UI screenshots, stack tags, or standard image prompts.
          </p>
        </div>

        <div
          className="inline-flex items-center gap-1.5 p-1 rounded-xl shrink-0"
          style={{
            backgroundColor: 'var(--adm-surface-muted)',
            border: '1px solid var(--adm-border)',
          }}
        >
          <button
            type="button"
            onClick={() => applyPreset('image')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: !isVibeClassification ? 'var(--adm-surface)' : 'transparent',
              color: !isVibeClassification ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
              boxShadow: !isVibeClassification ? 'var(--adm-shadow-sm)' : 'none',
            }}
          >
            <ImageIcon size={13} />
            Image Prompt
          </button>
          <button
            type="button"
            onClick={() => applyPreset('vibe')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: isVibeClassification ? 'var(--adm-surface)' : 'transparent',
              color: isVibeClassification ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
              boxShadow: isVibeClassification ? 'var(--adm-shadow-sm)' : 'none',
            }}
          >
            <Code2 size={13} />
            Vibe Coding Website
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[390px_1fr] gap-6 items-start">
        {/* Left Column: Visual Media, Gallery Card Preview & Styling */}
        <div className="flex flex-col gap-5">
          {/* Media Card */}
          <AdminCard padding="md">
            <AdminSectionHeader
              icon={ImageIcon}
              title="Media & Preview"
              description="Upload to Cloudflare R2 or reference an image URL."
              action={
                (form.localImg || form.imageUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setField('localImg', '');
                      setField('imageUrl', '');
                      setSuggestedAspect(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-1 rounded-md cursor-pointer"
                    style={{
                      backgroundColor: 'var(--adm-danger-bg)',
                      color: 'var(--adm-danger-text)',
                    }}
                  >
                    <X size={12} /> Clear
                  </button>
                )
              }
            />

            {/* Live Gallery Card Preview */}
            <div
              className="w-full rounded-xl overflow-hidden mb-4 relative"
              style={{
                aspectRatio: form.aspectRatio,
                background: `linear-gradient(135deg, ${form.gradientFrom}, ${form.gradientTo})`,
                border: '1px solid var(--adm-border)',
                minHeight: '170px',
              }}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Prompt visual preview"
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const best = closestAspectRatio(img.naturalWidth, img.naturalHeight);
                    if (best !== form.aspectRatio) setSuggestedAspect(best);
                    else setSuggestedAspect(null);
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <ImageIcon size={28} style={{ color: 'rgba(15,23,42,0.45)' }} />
                  <span className="text-[12px] font-medium" style={{ color: 'rgba(15,23,42,0.65)' }}>
                    Gradient placeholder preview
                  </span>
                </div>
              )}

              {/* Preview overlay badges */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-black/65 text-white backdrop-blur-sm">
                    {form.model}
                  </span>
                  {form.codeSnippet.trim() && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-cyan-500/85 text-slate-950 backdrop-blur-sm">
                      <Code2 size={10} />
                      {(form.codeLanguage || 'code').toUpperCase()}
                    </span>
                  )}
                  {!form.published && (
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-red-600/90 text-white">
                      Draft
                    </span>
                  )}
                  {form.featured && (
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-500/95 text-black">
                      Featured
                    </span>
                  )}
                </div>

                {form.galleryImages.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-black/70 text-white backdrop-blur-sm shrink-0">
                    <Images size={10} />
                    +{form.galleryImages.length}
                  </span>
                )}
              </div>

              {form.title.trim() && (
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/45 to-transparent">
                  <p className="text-[12px] font-semibold text-white truncate">
                    {form.title}
                  </p>
                </div>
              )}
            </div>

            {suggestedAspect && suggestedAspect !== form.aspectRatio && (
              <div
                className="mb-3 px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-[12px]"
                style={{
                  backgroundColor: 'var(--adm-info-bg)',
                  border: '1px solid var(--adm-info-border)',
                  color: 'var(--adm-info-text)',
                }}
              >
                <span>Image fits {suggestedAspect} aspect ratio</span>
                <button
                  type="button"
                  onClick={() => {
                    setField('aspectRatio', suggestedAspect);
                    setSuggestedAspect(null);
                  }}
                  className="font-semibold underline cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Source Tabs */}
            <div
              role="tablist"
              aria-label="Image source method"
              className="flex gap-1 p-1 rounded-xl mb-3"
              style={{
                backgroundColor: 'var(--adm-surface-muted)',
                border: '1px solid var(--adm-border)',
              }}
            >
              {(['upload', 'url'] as const).map((tab) => {
                const active = imgTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setImgTab(tab)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer"
                    style={{
                      backgroundColor: active ? 'var(--adm-surface)' : 'transparent',
                      color: active ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
                      boxShadow: active ? 'var(--adm-shadow-sm)' : 'none',
                    }}
                  >
                    {tab === 'upload' ? (
                      <>
                        <Upload size={12} /> Upload File
                      </>
                    ) : (
                      <>
                        <LinkIcon size={12} /> Image URL
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {imgTab === 'upload' ? (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/x-icon"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadFile(f);
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !uploading && fileRef.current?.click()}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
                      e.preventDefault();
                      fileRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) void uploadFile(f);
                  }}
                  className="w-full py-5 px-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors"
                  style={{
                    borderColor: dragActive || uploading ? 'var(--adm-accent)' : 'var(--adm-border-strong)',
                    backgroundColor: dragActive || uploading ? 'var(--adm-accent-soft)' : 'var(--adm-surface-muted)',
                    color: 'var(--adm-text-muted)',
                  }}
                >
                  {uploading ? (
                    <span className="inline-flex items-center gap-2 text-[12.5px] font-medium" style={{ color: 'var(--adm-accent-text)' }}>
                      <Loader2 size={14} className="animate-spin" />
                      Uploading to R2…
                    </span>
                  ) : (
                    <>
                      <Upload size={18} className="mx-auto mb-1.5" style={{ color: 'var(--adm-accent-text)' }} />
                      <p className="text-[12.5px] font-medium" style={{ color: 'var(--adm-text)' }}>
                        Click or drag an image here
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--adm-text-subtle)' }}>
                        PNG, JPEG, GIF, WebP up to 10 MB
                      </p>
                    </>
                  )}
                </div>
                {form.localImg && (
                  <p className="text-[11px] mt-2 truncate font-mono" style={{ color: 'var(--adm-text-subtle)' }}>
                    Active upload: {form.localImg}
                  </p>
                )}
              </div>
            ) : (
              <AdminFormField
                label="External Image URL"
                htmlFor={imageUrlId}
                error={fieldErrors.imageUrl}
                hint="Direct HTTPS image URL."
              >
                <AdminInput
                  id={imageUrlId}
                  value={form.imageUrl}
                  onChange={(e) => setField('imageUrl', e.target.value)}
                  placeholder="https://images.meigen.ai/…"
                  aria-invalid={Boolean(fieldErrors.imageUrl)}
                />
              </AdminFormField>
            )}

            {uploadError && (
              <p
                role="alert"
                className="mt-2.5 px-3 py-2 rounded-lg text-[12px]"
                style={{
                  backgroundColor: 'var(--adm-danger-bg)',
                  border: '1px solid var(--adm-danger-border)',
                  color: 'var(--adm-danger-text)',
                }}
              >
                {uploadError}
              </p>
            )}
          </AdminCard>

          {/* Additional Related Photos Card (UI screenshots, mobile/desktop views, hover states) */}
          <AdminCard padding="md">
            <AdminSectionHeader
              icon={Images}
              title="Additional Reference Photos"
              description="Upload extra website screenshots, desktop/mobile views, or style frames."
              action={
                <AdminBadge variant="neutral" className="font-mono tabular-nums">
                  {form.galleryImages.length}/10
                </AdminBadge>
              }
            />

            <input
              ref={galleryFileRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,image/x-icon"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void uploadGalleryFiles(e.target.files);
              }}
            />

            <div className="flex items-center gap-2 mb-3">
              <AdminButton
                variant="outline"
                size="sm"
                loading={galleryUploading}
                disabled={form.galleryImages.length >= 10}
                onClick={() => galleryFileRef.current?.click()}
                icon={<Upload size={13} />}
              >
                {galleryUploading ? 'Uploading…' : 'Upload Photos'}
              </AdminButton>
              {form.galleryImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setField('galleryImages', [])}
                  className="text-[11.5px] font-medium px-2.5 py-1.5 rounded-lg cursor-pointer ml-auto"
                  style={{
                    backgroundColor: 'var(--adm-danger-bg)',
                    color: 'var(--adm-danger-text)',
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <label htmlFor={galleryUrlId} className="sr-only">
                  Add extra photo URL
                </label>
                <AdminInput
                  id={galleryUrlId}
                  value={galleryUrlInput}
                  onChange={(e) => {
                    setGalleryUrlInput(e.target.value);
                    setGalleryUrlError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addGalleryUrl();
                    }
                  }}
                  placeholder="Paste screenshot URL (https://…)"
                />
              </div>
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={addGalleryUrl}
                disabled={!galleryUrlInput.trim() || form.galleryImages.length >= 10}
                icon={<Plus size={13} />}
              >
                Add
              </AdminButton>
            </div>

            {galleryUrlError && (
              <p
                role="alert"
                className="mb-2.5 px-2.5 py-1.5 rounded-lg text-[11.5px]"
                style={{
                  backgroundColor: 'var(--adm-danger-bg)',
                  border: '1px solid var(--adm-danger-border)',
                  color: 'var(--adm-danger-text)',
                }}
              >
                {galleryUrlError}
              </p>
            )}

            {form.galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {form.galleryImages.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="rounded-xl overflow-hidden border flex flex-col"
                    style={{
                      backgroundColor: 'var(--adm-surface-muted)',
                      borderColor: 'var(--adm-border)',
                    }}
                  >
                    <div className="relative aspect-video bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/65 text-white text-[10px] font-mono">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setField(
                            'galleryImages',
                            form.galleryImages.filter((_, i) => i !== idx)
                          )
                        }
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition-colors"
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between px-1.5 py-1 gap-1">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveGalleryPhoto(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-black/5 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          style={{ color: 'var(--adm-text-muted)' }}
                          title="Move earlier"
                          aria-label={`Move photo ${idx + 1} left`}
                        >
                          <ArrowLeft size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryPhoto(idx, 1)}
                          disabled={idx === form.galleryImages.length - 1}
                          className="p-1 rounded hover:bg-black/5 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          style={{ color: 'var(--adm-text-muted)' }}
                          title="Move later"
                          aria-label={`Move photo ${idx + 1} right`}
                        >
                          <ArrowRight size={12} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => promoteGalleryPhotoToCover(idx)}
                        className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded hover:underline cursor-pointer"
                        style={{ color: 'var(--adm-accent-text)' }}
                      >
                        Set Cover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11.5px]" style={{ color: 'var(--adm-text-subtle)' }}>
                Optional: attach hover states, dark/light variants, or responsive views shown in the prompt studio viewer.
              </p>
            )}
          </AdminCard>

          {/* Style & Frame Card */}
          <AdminCard padding="md">
            <AdminSectionHeader
              icon={Palette}
              title="Card Framing & Gradient"
              description="Aspect ratio and fallback gradient before image load."
            />

            <div className="mb-4">
              <span
                className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--adm-text-muted)' }}
              >
                Quick Presets
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {GRADIENT_PRESETS.map(([from, to], idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Apply gradient preset ${idx + 1}`}
                    onClick={() => {
                      setField('gradientFrom', from);
                      setField('gradientTo', to);
                    }}
                    className="w-8 h-8 rounded-lg cursor-pointer transition-transform hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${from}, ${to})`,
                      border:
                        form.gradientFrom === from && form.gradientTo === to
                          ? '2px solid var(--adm-accent)'
                          : '1px solid var(--adm-border-strong)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['gradientFrom', 'gradientTo'] as const).map((key) => (
                <AdminFormField key={key} label={key === 'gradientFrom' ? 'Start Color' : 'End Color'}>
                  <div
                    className="admin-control flex items-center gap-2 px-2.5 py-1.5"
                  >
                    <input
                      type="color"
                      aria-label={key === 'gradientFrom' ? 'Gradient start color picker' : 'Gradient end color picker'}
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      aria-label={key === 'gradientFrom' ? 'Gradient start hex' : 'Gradient end hex'}
                      value={form[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      className="w-full bg-transparent text-[12px] font-mono outline-none"
                      style={{ color: 'var(--adm-text)' }}
                    />
                  </div>
                </AdminFormField>
              ))}
            </div>

            <AdminFormField label="Aspect Ratio" htmlFor={aspectId}>
              <AdminSelect
                id={aspectId}
                value={form.aspectRatio}
                onChange={(e) => {
                  setField('aspectRatio', e.target.value);
                  setSuggestedAspect(null);
                }}
              >
                {ASPECTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </AdminSelect>
            </AdminFormField>
          </AdminCard>
        </div>

        {/* Right Column: Prompt Content, Classification, Visibility & Actions */}
        <div className="flex flex-col gap-5">
          {/* Prompt Text */}
          <AdminCard padding="md">
            <AdminSectionHeader
              icon={Type}
              title="Prompt Content"
              description="Full prompt text displayed on detail pages and copied by users."
              action={
                <AdminBadge variant="neutral" className="font-mono tabular-nums">
                  {form.promptText.length.toLocaleString()} chars
                </AdminBadge>
              }
            />
            <AdminFormField
              label="Prompt Text"
              htmlFor={promptTextId}
              required
              error={fieldErrors.promptText}
            >
              <AdminTextarea
                id={promptTextId}
                value={form.promptText}
                onChange={(e) => setField('promptText', e.target.value)}
                rows={9}
                placeholder="Enter the full AI prompt text here…"
                aria-invalid={Boolean(fieldErrors.promptText)}
                className="font-mono text-[13px] leading-relaxed min-h-[210px] resize-y"
              />
            </AdminFormField>
            <div className="flex items-center justify-between flex-wrap gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
              <span className="text-[11.5px]" style={{ color: 'var(--adm-text-subtle)' }}>
                {isVibeMode
                  ? 'Vibe Coding fields enabled below for title, stack tags, code & live URL.'
                  : 'Want to attach component code, UI title, or stack tags?'}
              </span>
              <button
                type="button"
                onClick={() => setShowVibeTools((v) => !v)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer"
                style={{ color: 'var(--adm-accent-text)' }}
              >
                <Code2 size={13} />
                {isVibeMode ? 'Hide Code & Vibe Tools' : '+ Attach Code & Vibe UI Metadata'}
              </button>
            </div>
          </AdminCard>

          {/* Vibe Coding & Code Package */}
          {isVibeMode && (
            <AdminCard padding="md">
              <AdminSectionHeader
                icon={Code2}
                title="Vibe Coding Design & Code Package"
                description="MotionSites-style metadata, source code snippet, stack tags, and optional live demo URL."
                action={
                  form.codeSnippet.trim() ? (
                    <AdminBadge variant="info" className="font-mono tabular-nums">
                      {form.codeSnippet.split(/\r?\n/).length} lines
                    </AdminBadge>
                  ) : undefined
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <AdminFormField
                  label="Design / Component Title"
                  htmlFor={titleId}
                  hint="Displayed as the headline in gallery hover & detail inspector."
                >
                  <AdminInput
                    id={titleId}
                    value={form.title}
                    onChange={(e) => setField('title', e.target.value)}
                    placeholder="e.g. Obsidian Bento SaaS Hero"
                  />
                </AdminFormField>

                <AdminFormField
                  label="Live Demo / Preview URL"
                  htmlFor={previewUrlId}
                  error={fieldErrors.previewUrl}
                  hint="Optional deployed URL or CodePen/Vercel demo link."
                >
                  <div className="relative">
                    <Globe
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--adm-text-subtle)' }}
                    />
                    <AdminInput
                      id={previewUrlId}
                      value={form.previewUrl}
                      onChange={(e) => setField('previewUrl', e.target.value)}
                      placeholder="https://demo.example.com"
                      className="pl-8"
                      aria-invalid={Boolean(fieldErrors.previewUrl)}
                    />
                  </div>
                </AdminFormField>
              </div>

              {/* Stack & Style Tags */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                    style={{ color: 'var(--adm-text)' }}
                  >
                    <Layers size={12.5} />
                    Stack &amp; UI Tags
                  </span>
                  <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--adm-text-subtle)' }}>
                    {form.stackTags.length}/12
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {STACK_TAG_PRESETS.map((preset) => {
                    const active = form.stackTags.some(
                      (t) => t.toLowerCase() === preset.toLowerCase()
                    );
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => toggleStackTag(preset)}
                        className="px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer border"
                        style={{
                          backgroundColor: active ? 'var(--adm-accent-soft)' : 'var(--adm-surface-muted)',
                          borderColor: active ? 'var(--adm-accent)' : 'var(--adm-border)',
                          color: active ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
                        }}
                      >
                        {active ? '✓ ' : '+ '}
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 relative">
                    <Tag
                      size={12.5}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--adm-text-subtle)' }}
                    />
                    <label htmlFor={customTagId} className="sr-only">
                      Add custom stack tag
                    </label>
                    <AdminInput
                      id={customTagId}
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag();
                        }
                      }}
                      placeholder="Add custom tag (e.g. GSAP, Pricing) & press Enter"
                      className="pl-8"
                    />
                  </div>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={addCustomTag}
                    disabled={!customTagInput.trim() || form.stackTags.length >= 12}
                  >
                    Add Tag
                  </AdminButton>
                </div>

                {form.stackTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {form.stackTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11.5px] font-medium border"
                        style={{
                          backgroundColor: 'var(--adm-info-bg)',
                          borderColor: 'var(--adm-info-border)',
                          color: 'var(--adm-info-text)',
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleStackTag(tag)}
                          className="hover:opacity-70 cursor-pointer"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Language + Code File Upload + Code Editor */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                  <div className="w-48">
                    <AdminFormField label="Code Language" htmlFor={codeLangId}>
                      <AdminSelect
                        id={codeLangId}
                        value={form.codeLanguage || 'tsx'}
                        onChange={(e) => setField('codeLanguage', e.target.value)}
                      >
                        {CODE_LANGUAGES.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label} (.{lang.ext})
                          </option>
                        ))}
                      </AdminSelect>
                    </AdminFormField>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={codeFileRef}
                      type="file"
                      accept=".tsx,.jsx,.html,.htm,.css,.scss,.ts,.js,.mjs,.vue,.svelte,.json,.txt,.md"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleCodeFileSelect(f);
                      }}
                    />
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => codeFileRef.current?.click()}
                      icon={<FileCode2 size={13} />}
                    >
                      Import Code File
                    </AdminButton>
                    {form.codeSnippet.trim() && (
                      <button
                        type="button"
                        onClick={() => setField('codeSnippet', '')}
                        className="text-[11.5px] font-medium px-2.5 py-1.5 rounded-lg cursor-pointer"
                        style={{
                          backgroundColor: 'var(--adm-danger-bg)',
                          color: 'var(--adm-danger-text)',
                        }}
                      >
                        Clear Code
                      </button>
                    )}
                  </div>
                </div>

                <AdminFormField
                  label="Code Snippet / Component Source"
                  htmlFor={codeSnippetId}
                  hint={
                    form.codeLanguage === 'html'
                      ? 'HTML snippets render in a safe static sandboxed Live HTML preview + downloadable .html file.'
                      : 'Displayed in the public syntax-lined IDE viewer with one-click Copy Code and file download.'
                  }
                >
                  <AdminTextarea
                    id={codeSnippetId}
                    value={form.codeSnippet}
                    onChange={(e) => {
                      const val = e.target.value;
                      setField('codeSnippet', val);
                      if (val.trim() && !form.codeLanguage) {
                        setField('codeLanguage', 'tsx');
                      }
                    }}
                    rows={12}
                    spellCheck={false}
                    placeholder={'Paste full TSX, HTML, CSS, or component code here (or click "Import Code File")…'}
                    className="font-mono text-[12.5px] leading-relaxed min-h-[250px] resize-y"
                  />
                </AdminFormField>
              </div>
            </AdminCard>
          )}

          {/* Classification */}
          <AdminCard padding="md">
            <AdminSectionHeader
              icon={Cpu}
              title="Classification"
              description="Controls filtering tabs, sidebar category grouping, and model badge."
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <AdminFormField label="AI Model" htmlFor={modelId}>
                <AdminSelect
                  id={modelId}
                  value={form.model}
                  onChange={(e) => {
                    const nextModel = e.target.value;
                    setField('model', nextModel);
                    if (mode === 'create') {
                      const inVibe =
                        form.tab === 'Vibe Coding' || form.category === 'Vibe Coding';
                      const mapped = inVibe
                        ? 'Vibe Coding'
                        : MODEL_TO_TAB[nextModel] || 'ChatGPT';
                      setField('tab', mapped);
                      setField('category', mapped);
                    }
                  }}
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </AdminSelect>
              </AdminFormField>

              <AdminFormField label="Gallery Tab" htmlFor={tabId}>
                <AdminSelect
                  id={tabId}
                  value={form.tab}
                  onChange={(e) => setField('tab', e.target.value)}
                >
                  {TABS.map((tabOption) => (
                    <option key={tabOption} value={tabOption}>
                      {tabOption}
                    </option>
                  ))}
                </AdminSelect>
              </AdminFormField>

              <AdminFormField label="Category" htmlFor={categoryId}>
                <AdminSelect
                  id={categoryId}
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                >
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </AdminSelect>
              </AdminFormField>
            </div>
          </AdminCard>

          {/* Visibility & Publishing */}
          <AdminCard padding="md">
            <AdminSectionHeader
              icon={Sparkles}
              title="Publishing & Visibility"
              description="Control gallery visibility and featured placement."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminSwitch
                id="prompt-published-switch"
                checked={form.published}
                onChange={(val) => setField('published', val)}
                label="Published"
                description="Show this prompt in the public gallery"
              />
              <AdminSwitch
                id="prompt-featured-switch"
                checked={form.featured}
                onChange={(val) => setField('featured', val)}
                label="Featured"
                description="Pin near the top in Featured sort"
              />
            </div>
          </AdminCard>

          {/* Author & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminCard padding="md">
              <AdminSectionHeader icon={User} title="Author Attribution" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AdminFormField label="Author Name" htmlFor={authorId}>
                  <AdminInput
                    id={authorId}
                    value={form.authorName}
                    onChange={(e) => setField('authorName', e.target.value)}
                    placeholder="e.g. Admin"
                  />
                </AdminFormField>
                <AdminFormField label="Handle" htmlFor={handleId}>
                  <AdminInput
                    id={handleId}
                    value={form.handle}
                    onChange={(e) => setField('handle', e.target.value)}
                    placeholder="@username"
                  />
                </AdminFormField>
              </div>
            </AdminCard>

            <AdminCard padding="md">
              <AdminSectionHeader icon={BarChart2} title="Engagement Counts" />
              <div className="grid grid-cols-2 gap-3">
                <AdminFormField label="Likes" htmlFor={likesId}>
                  <AdminInput
                    id={likesId}
                    type="number"
                    min={0}
                    value={form.likes}
                    onChange={(e) => setField('likes', Math.max(0, Number.parseInt(e.target.value, 10) || 0))}
                  />
                </AdminFormField>
                <AdminFormField label="Views" htmlFor={viewsId}>
                  <AdminInput
                    id={viewsId}
                    type="number"
                    min={0}
                    value={form.views}
                    onChange={(e) => setField('views', Math.max(0, Number.parseInt(e.target.value, 10) || 0))}
                  />
                </AdminFormField>
              </div>
            </AdminCard>
          </div>

          {submitError && (
            <div
              role="alert"
              className="px-4 py-3 rounded-xl text-[13px] font-medium"
              style={{
                backgroundColor: 'var(--adm-danger-bg)',
                border: '1px solid var(--adm-danger-border)',
                color: 'var(--adm-danger-text)',
              }}
            >
              {submitError}
            </div>
          )}

          {/* Action Bar */}
          <div
            className="p-4 rounded-2xl flex items-center justify-between gap-3 flex-wrap"
            style={{
              backgroundColor: 'var(--adm-surface)',
              border: '1px solid var(--adm-border)',
            }}
          >
            <div className="flex items-center gap-2">
              {mode === 'edit' && initial?.id && (
                <>
                  <AdminButton
                    variant="danger"
                    size="md"
                    onClick={() => setDeleteOpen(true)}
                    icon={<Trash2 size={14} />}
                  >
                    Delete
                  </AdminButton>
                  {form.published && (
                    <Link href={`/prompt/${initial.id}`} target="_blank" rel="noopener noreferrer">
                      <AdminButton variant="outline" size="md" icon={<ExternalLink size={14} />}>
                        View Public
                      </AdminButton>
                    </Link>
                  )}
                </>
              )}
              {isDirty && (
                <AdminBadge variant="warning">Unsaved changes</AdminBadge>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap ml-auto">
              <AdminButton
                variant="outline"
                size="md"
                onClick={() => {
                  if (isDirty) setDiscardOpen(true);
                  else router.push('/admin/prompts');
                }}
              >
                Cancel
              </AdminButton>

              {mode === 'create' && (
                <AdminButton
                  variant="secondary"
                  size="md"
                  loading={saving}
                  onClick={() => void submitPrompt(true)}
                  icon={<Plus size={14} />}
                >
                  Save &amp; Add Another
                </AdminButton>
              )}

              <AdminButton
                type="submit"
                variant="primary"
                size="md"
                loading={saving}
                disabled={saved}
                icon={saved ? <Check size={14} /> : undefined}
              >
                {saved
                  ? 'Saved!'
                  : mode === 'create'
                    ? 'Create Prompt'
                    : 'Save Changes'}
              </AdminButton>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved changes dialog */}
      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => router.push('/admin/prompts')}
        variant="warning"
        title="Discard unsaved changes?"
        description="You have unsaved edits on this prompt. Leaving now will discard your changes."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
        title="Delete this prompt?"
        description="This prompt will be permanently removed from the database and public gallery. This action cannot be undone."
        confirmLabel="Delete prompt"
      />
    </form>
  );
}
