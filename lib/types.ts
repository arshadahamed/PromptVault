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
  | 'Seedance 2.0'
  | 'Claude'
  | 'Cursor'
  | 'Lovable'
  | 'Bolt.new'
  | 'v0'
  | 'Replit'
  | 'Windsurf';

export type Category =
  | 'All'
  | 'Vibe Coding'
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

export type Tab =
  | 'All'
  | 'Vibe Coding'
  | 'ChatGPT'
  | 'Nanobanana'
  | 'Midjourney'
  | 'Flux'
  | 'Seedance'
  | 'Gemini'
  | 'Adobe Firefly';

export type Sort = 'Featured' | 'Newest' | 'Popular';

export interface Author {
  name: string;
  handle: string;
  initials: string;
  avatarColor: string;
}

export interface Prompt {
  id: string;
  title?: string;
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
  codeSnippet?: string;
  codeLanguage?: string;
  stackTags?: string[];
  galleryImages?: string[];
  previewUrl?: string;
  hasCode?: boolean;
  relatedIds: string[];
  createdAt: string;
}
