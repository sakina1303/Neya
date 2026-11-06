import type { Category, Finish, Product } from './beauty';

export type CatalogProduct = Pick<Product, 'brand' | 'name' | 'category' | 'shadeName' | 'color' | 'finish'> & { id: string; url: string };

// Product and shade names come from the linked Indian brand pages. Swatches are
// editorial approximations for browsing, not measured manufacturer shade data.
export const indiaCatalog: CatalogProduct[] = [
  { id: 'maybelline-creamy-nude-nuance', brand: 'Maybelline', name: 'Color Sensational Creamy Matte', category: 'Lipstick', shadeName: 'Nude Nuance', color: '#98605b', finish: 'Matte', url: 'https://www.maybelline.co.in/all-products/lips/lipstick/color-sensational-creamy-matte' },
  { id: 'maybelline-creamy-touch-of-spice', brand: 'Maybelline', name: 'Color Sensational Creamy Matte', category: 'Lipstick', shadeName: 'Touch of Spice', color: '#a05a66', finish: 'Matte', url: 'https://www.maybelline.co.in/all-products/lips/lipstick/color-sensational-creamy-matte' },
  { id: 'maybelline-creamy-almond-pink', brand: 'Maybelline', name: 'Color Sensational Creamy Matte', category: 'Lipstick', shadeName: 'Almond Pink', color: '#bd777d', finish: 'Matte', url: 'https://www.maybelline.co.in/all-products/lips/lipstick/color-sensational-creamy-matte' },
  { id: 'maybelline-fitme-rose', brand: 'Maybelline', name: 'Fit Me Mono Blush', category: 'Blush', shadeName: 'Rose', color: '#bd7584', finish: 'Natural', url: 'https://www.maybelline.co.in/all-products/face/blush/improved-fit-me-mono-blush' },
  { id: 'maybelline-fitme-coral', brand: 'Maybelline', name: 'Fit Me Mono Blush', category: 'Blush', shadeName: 'Coral', color: '#d88972', finish: 'Natural', url: 'https://www.maybelline.co.in/all-products/face/blush/improved-fit-me-mono-blush' },
  { id: 'maybelline-lifter-petal', brand: 'Maybelline', name: 'Lifter Gloss', category: 'Lip gloss', shadeName: 'Petal', color: '#ca8494', finish: 'Glossy', url: 'https://www.maybelline.co.in/all-products/lips/lip-gloss/lifter-gloss-tinted-lip-gloss-with-hyaluronic-acid' },
  { id: 'maybelline-lifter-topaz', brand: 'Maybelline', name: 'Lifter Gloss', category: 'Lip gloss', shadeName: 'Topaz', color: '#b77b5e', finish: 'Glossy', url: 'https://www.maybelline.co.in/all-products/lips/lip-gloss/lifter-gloss-tinted-lip-gloss-with-hyaluronic-acid' },
  { id: 'maybelline-master-gold', brand: 'Maybelline', name: 'Master Chrome Highlighter', category: 'Highlighter', shadeName: 'Molten Gold', color: '#d6aa62', finish: 'Shimmer', url: 'https://www.maybelline.co.in/all-products/face/highlighter/face-studio-master-chrome-highlighter' },
  { id: 'maybelline-master-rose-gold', brand: 'Maybelline', name: 'Master Chrome Highlighter', category: 'Highlighter', shadeName: 'Molten Rose Gold', color: '#d6a08d', finish: 'Shimmer', url: 'https://www.maybelline.co.in/all-products/face/highlighter/face-studio-master-chrome-highlighter' },
  { id: 'maybelline-colossal-black', brand: 'Maybelline', name: 'Colossal Bold Liner', category: 'Eyeliner', shadeName: 'Black', color: '#20201f', finish: 'Matte', url: 'https://www.maybelline.co.in/all-products/eyes/eyeliner/colossal-bold-liner' },
  { id: 'maybelline-fitme-medium', brand: 'Maybelline', name: 'Fit Me Concealer', category: 'Concealer', shadeName: 'Medium', color: '#bd8b68', finish: 'Natural', url: 'https://www.maybelline.co.in/all-products/face/concealer/fit-me-concealer' },
  { id: 'maybelline-fitme-honey', brand: 'Maybelline', name: 'Fit Me Concealer', category: 'Concealer', shadeName: 'Honey', color: '#aa7652', finish: 'Natural', url: 'https://www.maybelline.co.in/all-products/face/concealer/fit-me-concealer' },
  { id: 'maybelline-fitme-warm-nude', brand: 'Maybelline', name: 'Fit Me Matte + Poreless Foundation', category: 'Foundation', shadeName: 'Warm Nude', color: '#bb8b68', finish: 'Matte', url: 'https://www.maybelline.co.in/all-products/face/foundation/fit-me-foundation' },
  { id: 'maybelline-city-sunset', brand: 'Maybelline', name: 'City Mini Palette', category: 'Eyeshadow', shadeName: '5th Avenue Sunset', color: '#a66f58', finish: 'Shimmer', url: 'https://www.maybelline.co.in/all-products/eyes/eye-shadow/city-mini-palette?variant=5th+Avenue+Sunset' },
  { id: 'maybelline-colossal-mascara', brand: 'Maybelline', name: 'Colossal Waterproof Mascara', category: 'Mascara', shadeName: 'Black', color: '#24201f', finish: 'Natural', url: 'https://www.maybelline.co.in/all-products/eyes/mascara' },
  { id: 'kay-matte-cameo', brand: 'Kay Beauty', name: 'Matte Drama Lipstick', category: 'Lipstick', shadeName: 'Cameo', color: '#98616c', finish: 'Matte', url: 'https://www.kaybeauty.com/products/kay-beauty-matte-lipstick-4-2-g' },
  { id: 'kay-matte-wrap-up', brand: 'Kay Beauty', name: 'Matte Drama Lipstick', category: 'Lipstick', shadeName: 'Wrap Up!', color: '#a66c60', finish: 'Matte', url: 'https://www.kaybeauty.com/products/kay-beauty-matte-lipstick-4-2-g' },
  { id: 'kay-liner-cameo', brand: 'Kay Beauty', name: 'Plumping HD Lip Liner', category: 'Lip liner', shadeName: 'Cameo', color: '#8c5961', finish: 'Matte', url: 'https://www.kaybeauty.com/products/kay-beauty-plumping-hd-lip-liner' },
  { id: 'kay-contour-caramel', brand: 'Kay Beauty', name: 'Kover Story Contour Stick', category: 'Contour', shadeName: 'Caramel Focus', color: '#93674c', finish: 'Matte', url: 'https://www.kaybeauty.com/products/kay-beauty-kover-story-contour-stick-2-8-g' },
  { id: 'kay-contour-coco', brand: 'Kay Beauty', name: 'Kover Story Contour Stick', category: 'Contour', shadeName: 'Coco Focus', color: '#654532', finish: 'Matte', url: 'https://www.kaybeauty.com/products/kay-beauty-kover-story-contour-stick-2-8-g' },
  { id: 'kay-blush-rosey-dew', brand: 'Kay Beauty', name: 'Luminizing Blush Drops', category: 'Blush', shadeName: 'Rosey Dew', color: '#c67f8c', finish: 'Dewy', url: 'https://www.kaybeauty.com/collections/shop-all-1/products/luminizing-blush-drops' },
  { id: 'kay-blush-warm-bloom', brand: 'Kay Beauty', name: 'Luminizing Blush Drops', category: 'Blush', shadeName: 'Warm Bloom', color: '#d48b79', finish: 'Dewy', url: 'https://www.kaybeauty.com/collections/shop-all-1/products/luminizing-blush-drops' },
  { id: 'kay-eyeshadow-sunkissed', brand: 'Kay Beauty', name: 'Multi Texture Eyeshadow Palette', category: 'Eyeshadow', shadeName: 'Sunkissed', color: '#a87555', finish: 'Shimmer', url: 'https://www.kaybeauty.com/collections/eyes/products/multi-texture-eyeshadow-palette' },
];

function colourDistance(a: string, b: string) {
  const parse = (hex: string) => [1, 3, 5].map(start => Number.parseInt(hex.slice(start, start + 2), 16));
  const first = parse(a), second = parse(b);
  return Math.sqrt(first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0));
}

export function similarProducts(category: Category, color: string, finish: Finish, collection: Product[], limit = 4) {
  const own = collection.filter(product => product.category === category).map(product => ({ ...product, url: product.purchaseUrl ?? '', source: 'Your collection' as const }));
  const verified = indiaCatalog.filter(product => product.category === category).map(product => ({ ...product, source: 'Verified product' as const }));
  return [...own, ...verified]
    .sort((a, b) => (colourDistance(a.color, color) + (a.finish === finish ? 0 : 26)) - (colourDistance(b.color, color) + (b.finish === finish ? 0 : 26)))
    .slice(0, limit);
}
