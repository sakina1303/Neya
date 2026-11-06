import { createClient } from '@supabase/supabase-js';
import type { BeautyData } from './data/beauty';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloud = url && key ? createClient(url, key) : null;

export function cloudSafeData(data: BeautyData): BeautyData {
  if (data.profile.allowImageStorage) return data;
  return { ...data, products: data.products.map(({ image: _image, ...product }) => product) };
}

export function mergeBeautyData(remote: BeautyData, local: BeautyData): BeautyData {
  const localProducts = new Map(local.products.map(product => [product.id, product]));
  const productIds = new Set(remote.products.map(product => product.id));
  const lookIds = new Set(remote.looks.map(look => look.id));
  return {
    ...remote,
    products: [...remote.products.map(product => ({ ...product, image: product.image ?? localProducts.get(product.id)?.image })), ...local.products.filter(product => !productIds.has(product.id))],
    looks: [...remote.looks, ...local.looks.filter(look => !lookIds.has(look.id))],
  };
}

export function isBeautyData(value: unknown): value is BeautyData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<BeautyData>;
  return data.version === 1 && Array.isArray(data.products) && Array.isArray(data.looks) && !!data.profile && Array.isArray(data.profile.styles);
}
