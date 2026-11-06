import { describe, expect, it, vi } from 'vitest';
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
import { cloudSafeData, mergeBeautyData } from './cloud';
import { emptyData, type BeautyData } from './data/beauty';

const product = { id: 'one', brand: 'Test', name: 'Lip', category: 'Lipstick' as const, shadeName: 'Rose', shadeNumber: '', color: '#aa6688', finish: 'Satin' as const, image: 'data:image/jpeg;base64,test', owned: true };

describe('cloud beauty data', () => {
  it('keeps product photos local unless photo sync is enabled', () => {
    const local: BeautyData = { ...structuredClone(emptyData), products: [product] };
    expect(cloudSafeData(local).products[0].image).toBeUndefined();
    expect(local.products[0].image).toBe(product.image);
    expect(cloudSafeData({ ...local, profile: { ...local.profile, allowImageStorage: true } }).products[0].image).toBe(product.image);
  });

  it('merges device products and saved looks without losing local photos', () => {
    const local: BeautyData = { ...structuredClone(emptyData), products: [product], looks: [{ id: 'look-one', name: 'Rose', occasion: 'Everyday', layers: {}, createdAt: '2026-11-06' }] };
    const remote: BeautyData = { ...structuredClone(emptyData), products: [{ ...product, image: undefined }], looks: [] };
    const merged = mergeBeautyData(remote, local);
    expect(merged.products).toHaveLength(1);
    expect(merged.products[0].image).toBe(product.image);
    expect(merged.looks.map(look => look.id)).toEqual(['look-one']);
  });
});
