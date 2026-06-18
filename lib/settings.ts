import { supabase } from './supabase';

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  logoText: string;
  logoImageUrl: string;
  faviconUrl: string;
  primaryColor: string;
  metaTitle: string;
  metaDescription: string;
  footerCopyright: string;
  footerLinks: { label: string; href: string }[];
  socialLinks: { twitter: string; github: string; instagram: string };
  announcementBar: string;
  adminName: string;
  adminTagline: string;
  loginBrandName: string;
  loginTagline: string;
  promoEnabled: boolean;
  promoTitle: string;
  promoDescription: string;
  promoEmoji1: string;
  promoEmoji2: string;
  promoGradientFrom: string;
  promoGradientTo: string;
  promoCtaText: string;
  promoCtaUrl: string;
  updatedAt: string;
}

export async function getSettings(): Promise<SiteSettings> {
  const { data } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 1)
    .maybeSingle();
  if (!data || !data.data) return defaultSettings();
  return { ...defaultSettings(), ...(data.data as Partial<SiteSettings>) };
}

export async function saveSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const updated: SiteSettings = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await supabase
    .from('settings')
    .upsert({ id: 1, data: updated, updated_at: updated.updatedAt });
  return updated;
}

function defaultSettings(): SiteSettings {
  return {
    siteName: 'PromptVault',
    siteTagline: 'Free AI Prompt Gallery',
    siteDescription: 'Browse 2000+ free AI prompts for ChatGPT, Midjourney, Nanobanana, and more.',
    logoText: 'P',
    logoImageUrl: '',
    faviconUrl: '',
    primaryColor: '#7c3aed',
    metaTitle: 'PromptVault — Free AI Prompt Gallery',
    metaDescription: 'Browse 2000+ free AI prompts for ChatGPT, Midjourney, Nanobanana, and more.',
    footerCopyright: '© 2025 PromptVault. All rights reserved.',
    footerLinks: [
      { label: 'Terms', href: '#terms' },
      { label: 'Privacy', href: '#privacy' },
    ],
    socialLinks: { twitter: '', github: '', instagram: '' },
    announcementBar: '',
    adminName: 'PromptVault',
    adminTagline: 'Admin Studio',
    loginBrandName: 'PromptVault',
    loginTagline: 'Prompt Studio',
    promoEnabled: true,
    promoTitle: 'FIFA World Cup 2026 ⚽',
    promoDescription: 'Ronaldo, Messi & epic football art — explore the World Cup collection',
    promoEmoji1: '⚽',
    promoEmoji2: '🏆',
    promoGradientFrom: '#064e3b',
    promoGradientTo: '#d97706',
    promoCtaText: 'Explore now',
    promoCtaUrl: '#',
    updatedAt: '',
  };
}
