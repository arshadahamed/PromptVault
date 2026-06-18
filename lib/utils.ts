import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PALETTES: Array<[string, string]> = [
  ['#f8b4c8', '#a78bfa'],
  ['#93c5fd', '#6ee7b7'],
  ['#fcd34d', '#fb923c'],
  ['#c4b5fd', '#818cf8'],
  ['#86efac', '#34d399'],
  ['#fda4af', '#f472b6'],
  ['#7dd3fc', '#818cf8'],
  ['#fdba74', '#fbbf24'],
  ['#a5b4fc', '#c084fc'],
  ['#6ee7b7', '#34d399'],
  ['#f9a8d4', '#c084fc'],
  ['#bef264', '#34d399'],
];

export function gradientFromId(id: string): { gradientFrom: string; gradientTo: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [gradientFrom, gradientTo] = PALETTES[hash % PALETTES.length];
  return { gradientFrom, gradientTo };
}

export function formatLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
