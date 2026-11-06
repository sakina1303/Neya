import { useMemo, useState } from 'react';
import { Aperture, ArrowRight, ImagePlus, PackagePlus, Search, Trash2, X } from 'lucide-react';
import { categories, finishes, type Category, type Finish, type Product } from './data/beauty';

type Props = { products: Product[]; onChange: (products: Product[]) => void };
const blank = { brand: '', name: '', category: 'Lipstick' as Category, shadeName: '', shadeNumber: '', color: '#a86e62', finish: 'Satin' as Finish, image: '', purchaseUrl: '', owned: true };

export function CollectionPage({ products, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filtered = useMemo(() => products.filter(product => (category === 'All' || product.category === category) && [product.brand, product.name, product.category, product.shadeName, product.shadeNumber].join(' ').toLowerCase().includes(query.toLowerCase())), [products, category, query]);
  const openForm = (product?: Product) => {
    setEditingId(product?.id ?? null);
    setForm(product ? { brand: product.brand, name: product.name, category: product.category, shadeName: product.shadeName, shadeNumber: product.shadeNumber, color: product.color, finish: product.finish, image: product.image ?? '', purchaseUrl: product.purchaseUrl ?? '', owned: product.owned } : blank);
    setError(''); setShowForm(true);
  };
  const upload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    if (file.size > 6 * 1024 * 1024) { setError('Choose a product photo under 6 MB.'); return; }
    const image = new Image(), url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 420 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      setForm(previous => ({ ...previous, image: canvas.toDataURL('image/jpeg', .72) })); URL.revokeObjectURL(url);
    };
    image.onerror = () => { setError('Could not read that image.'); URL.revokeObjectURL(url); };
    image.src = url;
  };
  const save = () => {
    if (!form.brand.trim() || !form.name.trim()) { setError('Brand and product name are required.'); return; }
    if (form.purchaseUrl && !/^https?:\/\//i.test(form.purchaseUrl)) { setError('Purchase link must start with https:// or http://.'); return; }
    const product: Product = { ...form, id: editingId ?? crypto.randomUUID(), brand: form.brand.trim(), name: form.name.trim(), shadeName: form.shadeName.trim(), shadeNumber: form.shadeNumber.trim(), image: form.image || undefined, purchaseUrl: form.purchaseUrl || undefined };
    onChange(editingId ? products.map(item => item.id === editingId ? product : item) : [product, ...products]);
    setShowForm(false);
  };
  return <main className="page feature-page">
    <div className="page-title"><div><div className="section-kicker">YOUR DIGITAL MAKEUP WARDROBE</div><h1>My collection<span>.</span></h1><p>Keep the shades you own close, and use them to build looks.</p></div><button className="primary-button" onClick={() => openForm()}><PackagePlus size={17} /> Add product</button></div>
    <div className="collection-summary"><div><Aperture size={22} /><strong>{products.length}</strong><span>products in your collection</span></div><p>Search, edit, or add products manually. Product photos are saved only in this browser.</p></div>
    <div className="collection-toolbar"><label className="search-box"><Search size={18} /><input aria-label="Search collection" placeholder="Search brand, product, category or shade" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Filter category" value={category} onChange={event => setCategory(event.target.value)}><option>All</option>{categories.map(item => <option key={item}>{item}</option>)}</select></div>
    {filtered.length ? <div className="product-grid">{filtered.map(product => <article className="product-card" key={product.id}><div className="product-image" style={product.image ? { backgroundImage: `url(${product.image})` } : { background: `linear-gradient(145deg, ${product.color}55, #f6f0e9)` }}>{!product.image && <span className="product-graphic" style={{ background: product.color }} />}</div><div className="product-content"><div className="product-meta"><span>{product.category}</span><span>{product.owned ? 'IN MY BAG' : 'WISHLIST'}</span></div><h3>{product.name}</h3><p>{product.brand}</p><div className="product-shade"><span style={{ background: product.color }} />{product.shadeName || 'Shade not named'}{product.shadeNumber && ` · ${product.shadeNumber}`}</div><div className="product-actions"><button onClick={() => openForm(product)}>Edit <ArrowRight size={14} /></button><button aria-label={`Delete ${product.name}`} onClick={() => setDeleteId(product.id)}><Trash2 size={15} /></button></div></div></article>)}</div> : <div className="empty-state"><div><Aperture size={30} /></div><h2>{products.length ? 'No matching products' : 'Your collection begins here'}</h2><p>{products.length ? 'Try another search or category.' : 'Add the products you love. NEYA will use them when suggesting looks.'}</p><button className="outline-button" onClick={() => openForm()}><PackagePlus size={16} /> Add a product</button></div>}
    <div className="subtle-notice"><ImagePlus size={18} /><span>Photo based product recognition will be available when an AI service is connected. For now, upload a photo and confirm details yourself.</span></div>
    {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><div className="modal product-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title" onClick={event => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setShowForm(false)}><X size={18} /></button><div className="section-kicker">YOUR MAKEUP WARDROBE</div><h2 id="product-form-title">{editingId ? 'Edit product' : 'Add a product'}</h2><p>Add a photo and review the details before saving.</p><div className="product-form-grid"><div className="full"><label className="field-label">PRODUCT PHOTO</label><label className="photo-upload">{form.image ? <img src={form.image} alt="Product preview" /> : <ImagePlus size={24} />}<span>{form.image ? 'Change photo' : 'Choose a product photo'}</span><input type="file" accept="image/*" onChange={event => upload(event.target.files?.[0])} /></label></div><label>Brand *<input value={form.brand} onChange={event => setForm({ ...form, brand: event.target.value })} placeholder="Brand name" /></label><label>Product name *<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Product name" /></label><label>Category<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value as Category })}>{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Finish<select value={form.finish} onChange={event => setForm({ ...form, finish: event.target.value as Finish })}>{finishes.map(item => <option key={item}>{item}</option>)}</select></label><label>Shade name<input value={form.shadeName} onChange={event => setForm({ ...form, shadeName: event.target.value })} placeholder="e.g. Rosewood" /></label><label>Shade number<input value={form.shadeNumber} onChange={event => setForm({ ...form, shadeNumber: event.target.value })} placeholder="Optional" /></label><label>Colour reference<input type="color" value={form.color} onChange={event => setForm({ ...form, color: event.target.value })} /></label><label>Ownership<select value={form.owned ? 'Owned' : 'Wishlist'} onChange={event => setForm({ ...form, owned: event.target.value === 'Owned' })}><option>Owned</option><option>Wishlist</option></select></label><label className="full">Purchase link (optional)<input type="url" value={form.purchaseUrl} onChange={event => setForm({ ...form, purchaseUrl: event.target.value })} placeholder="https://" /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button modal-submit" onClick={save}>Save product <ArrowRight size={16} /></button></div></div>}
    {deleteId && <div className="modal-backdrop"><div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title"><h2 id="delete-product-title">Remove product?</h2><p>This removes it from your local collection. Saved looks keep their selected colour.</p><div className="confirm-actions"><button className="outline-button" onClick={() => setDeleteId(null)}>Cancel</button><button className="danger-button" onClick={() => { onChange(products.filter(product => product.id !== deleteId)); setDeleteId(null); }}>Remove product</button></div></div></div>}
  </main>;
}
