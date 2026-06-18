import fs from 'fs';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

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

export function getSettings(): SiteSettings {
  if (!fs.existsSync(SETTINGS_PATH)) return defaultSettings();
  const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  // backfill new fields for existing installations
  return { ...defaultSettings(), ...raw };
}

export function saveSettings(data: Partial<SiteSettings>): SiteSettings {
  const current = getSettings();
  const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
  const tmp = SETTINGS_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(updated, null, 2));
  fs.renameSync(tmp, SETTINGS_PATH);
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
