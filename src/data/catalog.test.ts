import { describe, expect, it } from 'vitest';
import { categories, starterShades } from './beauty';
import { indiaCatalog, similarProducts } from './catalog';

describe('try-on choices', () => {
  it('offers a shade to preview for every makeup layer', () => {
    for (const category of categories) expect(starterShades.some(shade => shade.category === category), category).toBe(true);
  });

  it('only shows relevant, linked products near the selected colour', () => {
    const matches = similarProducts('Blush', '#bd7584', 'Natural', []);
    expect(matches[0].shadeName).toBe('Rose');
    expect(matches.every(product => product.category === 'Blush' && product.url.startsWith('https://'))).toBe(true);
    expect(indiaCatalog.every(product => product.url.startsWith('https://www.maybelline.co.in/') || product.url.startsWith('https://www.kaybeauty.com/'))).toBe(true);
    expect(new Set(indiaCatalog.filter(product => product.category === 'Lipstick').map(product => product.brand)).size).toBeGreaterThan(1);
  });
});
