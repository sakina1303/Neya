export const categories = ['Foundation', 'Concealer', 'Eyeshadow', 'Eyeliner', 'Mascara', 'Blush', 'Contour', 'Highlighter', 'Lipstick', 'Lip gloss', 'Lip liner'] as const;
export type Category = typeof categories[number];
export type Finish = 'Matte' | 'Satin' | 'Dewy' | 'Shimmer' | 'Glossy' | 'Natural';
export type Product = {
  id: string;
  brand: string;
  name: string;
  category: Category;
  shadeName: string;
  shadeNumber: string;
  color: string;
  finish: Finish;
  image?: string;
  purchaseUrl?: string;
  owned: boolean;
};
export type LookLayers = Partial<Record<Category, { color: string; intensity: number; finish: Finish; productId?: string; technique?: string }>>;
export type SavedLook = { id: string; name: string; occasion: string; layers: LookLayers; createdAt: string };
export type BeautyProfile = {
  name: string;
  experience: 'Beginner' | 'Intermediate' | 'Confident';
  styles: string[];
  preferredBrands: string;
  assistance: 'Gentle' | 'Balanced' | 'Detailed';
  defaultFinish: Finish;
  voiceEnabled: boolean;
  allowImageStorage: boolean;
};
export type BeautyData = { version: 1; products: Product[]; looks: SavedLook[]; profile: BeautyProfile };

export const occasions = ['Everyday', 'College', 'Office', 'Date Night', 'Party', 'Wedding', 'Soft Glam', 'Full Glam', 'Natural Makeup', 'Custom Look'];
export const styles = ['Natural', 'Everyday', 'Soft Glam', 'Full Glam', 'Minimal', 'Experimental'];
export const finishes: Finish[] = ['Natural', 'Matte', 'Satin', 'Dewy', 'Shimmer', 'Glossy'];
export const techniques: Partial<Record<Category, string[]>> = {
  Blush: ['Soft lift', 'Apples', 'Sun-kissed'],
  Eyeshadow: ['Soft wash', 'Outer corner', 'Halo'],
  Eyeliner: ['Classic line', 'Soft wing', 'Extended wing'],
  Contour: ['Soft sculpt', 'Cheekbone lift'],
  Highlighter: ['Natural glow', 'Focused glow'],
  Lipstick: ['Full lip', 'Soft blur'],
};

export const starterShades: { name: string; category: Category; color: string; finish: Finish }[] = [
  { name: 'Rosewood', category: 'Lipstick', color: '#a6565b', finish: 'Satin' },
  { name: 'Warm nude', category: 'Lipstick', color: '#a86e62', finish: 'Matte' },
  { name: 'Berry', category: 'Lipstick', color: '#7e3e61', finish: 'Glossy' },
  { name: 'Soft peach', category: 'Blush', color: '#d99078', finish: 'Natural' },
  { name: 'Rose', category: 'Blush', color: '#be6b7b', finish: 'Dewy' },
  { name: 'Copper', category: 'Eyeshadow', color: '#a46b4f', finish: 'Shimmer' },
  { name: 'Taupe', category: 'Eyeshadow', color: '#79665b', finish: 'Matte' },
  { name: 'Espresso', category: 'Eyeliner', color: '#392b2a', finish: 'Matte' },
  { name: 'Soft bronze', category: 'Contour', color: '#9a6550', finish: 'Natural' },
  { name: 'Champagne', category: 'Highlighter', color: '#e1bb8d', finish: 'Shimmer' },
];

export const emptyData: BeautyData = {
  version: 1,
  products: [],
  looks: [],
  profile: { name: '', experience: 'Beginner', styles: ['Natural'], preferredBrands: '', assistance: 'Balanced', defaultFinish: 'Natural', voiceEnabled: false, allowImageStorage: false },
};

const storageKey = 'neya.beauty.v1';
export function loadBeautyData(): BeautyData {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null') as BeautyData | null;
    if (value?.version === 1 && Array.isArray(value.products) && Array.isArray(value.looks) && value.profile) return value;
  } catch { /* Corrupt or unavailable local data falls back to an empty profile. */ }
  return structuredClone(emptyData);
}
export function saveBeautyData(data: BeautyData): boolean {
  try { localStorage.setItem(storageKey, JSON.stringify(data)); return true; } catch { return false; }
}
export function clearBeautyData() { localStorage.removeItem(storageKey); }

export function suggestedLayers(occasion: string, products: Product[], ownedOnly = false): LookLayers {
  const palette: Record<string, [string, string, string]> = {
    'Date Night': ['#9b4a59', '#c87979', '#8a5e56'], Party: ['#833d60', '#bf6a80', '#8d6151'],
    Wedding: ['#a86165', '#cb8d82', '#a07860'], 'Soft Glam': ['#a86e62', '#c98579', '#80635a'],
    'Full Glam': ['#8d3f57', '#bd7179', '#755148'], Office: ['#a36a65', '#c48176', '#80675c'],
  };
  const [lip, blush, eye] = palette[occasion] ?? ['#a86e62', '#d99078', '#8a7062'];
  const defaults: LookLayers = {
    Lipstick: { color: lip, intensity: .65, finish: 'Satin' },
    Blush: { color: blush, intensity: .35, finish: 'Natural' },
    Eyeshadow: { color: eye, intensity: .33, finish: 'Matte' },
    Eyeliner: { color: '#42352f', intensity: .65, finish: 'Matte' },
  };
  for (const category of Object.keys(defaults) as Category[]) {
    const match = products.find(product => product.category === category && (!ownedOnly || product.owned));
    if (match) defaults[category] = { color: match.color, intensity: defaults[category]!.intensity, finish: match.finish, productId: match.id };
    else if (ownedOnly) delete defaults[category];
  }
  return defaults;
}
