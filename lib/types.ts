export type Model =
  | 'ChatGPT'
  | 'Gemini'
  | 'Midjourney'
  | 'Stable Diffusion'
  | 'DALL-E'
  | 'Flux'
  | 'Seedance'
  | 'Nanobanana'
  | 'Nanobanana Pro'
  | 'Nanobanana 2'
  | 'Adobe Firefly'
  | 'Leonardo AI'
  | 'GPT Image'
  | 'Seedance 2.0';

export type Category =
  | 'All'
  | 'ChatGPT'
  | 'Gemini'
  | 'Midjourney'
  | 'Stable Diffusion'
  | 'DALL-E'
  | 'Flux'
  | 'Seedance'
  | 'Nanobanana'
  | 'Adobe Firefly'
  | 'Leonardo AI';

export type Tab = 'All' | 'ChatGPT' | 'Midjourney' | 'Gemini' | 'Nanobanana' | 'Adobe Firefly';

export type Sort = 'Featured' | 'Newest' | 'Popular';

export interface Author {
  name: string;
  handle: string;
  initials: string;
  avatarColor: string;
}

export interface Prompt {
  id: string;
  author: Author;
  model: Model;
  category: Category;
  tab: Tab;
  likes: number;
  views?: number;
  promptText: string;
  aspectRatio: string;
  gradientFrom: string;
  gradientTo: string;
  localImg?: string;
  relatedIds: string[];
  createdAt: string;
}
