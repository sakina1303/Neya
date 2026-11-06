import { useCallback, useEffect, useRef, useState } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { ArrowRight, Camera, CameraOff, Check, Columns2, ImagePlus, Mic, Save, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { categories, finishes, occasions, starterShades, suggestedLayers, techniques, type BeautyData, type Category, type LookLayers, type Product, type SavedLook } from './data/beauty';
import { createLandmarkEngine, detectImageFace, type LandmarkEngine } from './vision/faceLandmarker';
import { drawMakeup } from './vision/makeup';

type Props = { data: BeautyData; onSaveLook: (look: SavedLook) => void; initialLook?: SavedLook | null; onClearInitialLook: () => void };

export function ExplorePage({ data, onSaveLook, initialLook, onClearInitialLook }: Props) {
  const [occasion, setOccasion] = useState(initialLook?.occasion ?? 'Everyday');
  const [layers, setLayers] = useState<LookLayers>(initialLook?.layers ?? {});
  const [source, setSource] = useState<'none' | 'photo' | 'camera'>('none');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [compare, setCompare] = useState(false);
  const [compareLookId, setCompareLookId] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Lipstick');
  const [lookName, setLookName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const landmarksRef = useRef<NormalizedLandmark[] | undefined>(undefined);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<LandmarkEngine | null>(null);
  const frameRef = useRef(0);
  const layersRef = useRef(layers);
  const compareRef = useRef(compare);
  const compareLayersRef = useRef<LookLayers | null>(null);
  const trackingRef = useRef(false);
  layersRef.current = layers;
  compareRef.current = compare;
  compareLayersRef.current = data.looks.find(look => look.id === compareLookId)?.layers ?? null;

  const render = useCallback((image: HTMLImageElement | HTMLVideoElement, face: NormalizedLandmark[] | undefined, mirrored: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = image instanceof HTMLVideoElement ? image.videoWidth : image.naturalWidth;
    const height = image instanceof HTMLVideoElement ? image.videoHeight : image.naturalHeight;
    if (!width || !height) return;
    const max = 1100, scale = Math.min(1, max / Math.max(width, height));
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.save();
    if (mirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    if (!face) return;
    if (compareRef.current && compareLayersRef.current) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, canvas.width / 2, canvas.height); ctx.clip();
      drawMakeup(ctx, face, canvas.width, canvas.height, compareLayersRef.current, mirrored); ctx.restore();
    }
    ctx.save();
    if (compareRef.current) { ctx.beginPath(); ctx.rect(canvas.width / 2, 0, canvas.width / 2, canvas.height); ctx.clip(); }
    drawMakeup(ctx, face, canvas.width, canvas.height, layersRef.current, mirrored);
    ctx.restore();
    if (compareRef.current) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke(); }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
    engineRef.current?.close(); engineRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    trackingRef.current = false;
    setTracking(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => {
    if (initialLook) { setOccasion(initialLook.occasion); setLayers(initialLook.layers); onClearInitialLook(); }
  }, [initialLook, onClearInitialLook]);
  useEffect(() => { if (source === 'photo' && imageRef.current) render(imageRef.current, landmarksRef.current, false); }, [layers, compare, compareLookId, source, render]);

  const loadPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('Choose an image under 12 MB.'); return; }
    stopCamera(); setBusy(true); setError(''); setSource('none');
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      const face = await detectImageFace(image);
      if (!face) throw new Error('No face found. Try a clear, front-facing photo in even light.');
      imageRef.current = image; landmarksRef.current = face; setSource('photo'); render(image, face, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open this photo.'); }
    finally { URL.revokeObjectURL(url); setBusy(false); }
  };

  const startCamera = async () => {
    stopCamera(); imageRef.current = null; landmarksRef.current = undefined; setSource('none'); setError(''); setBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) throw new Error('Camera access requires HTTPS or localhost.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      const video = videoRef.current; if (!video) throw new Error('Camera preview is unavailable.');
      video.srcObject = stream; await video.play();
      engineRef.current = await createLandmarkEngine(); setSource('camera'); setBusy(false);
      let lastVideoTime = -1, lastDetectAt = 0;
      const tick = (now: number) => {
        frameRef.current = requestAnimationFrame(tick);
        if (video.readyState < 2 || video.currentTime === lastVideoTime || now - lastDetectAt < 50) return;
        lastVideoTime = video.currentTime; lastDetectAt = now;
        const face = engineRef.current?.detect(video, now).faceLandmarks[0];
        landmarksRef.current = face;
        if (trackingRef.current !== Boolean(face)) { trackingRef.current = Boolean(face); setTracking(Boolean(face)); }
        render(video, face, true);
      };
      frameRef.current = requestAnimationFrame(tick);
      stream.getVideoTracks()[0]?.addEventListener('ended', () => { stopCamera(); setSource('none'); setError('Camera disconnected.'); }, { once: true });
    } catch (cause) { stopCamera(); setError(cause instanceof Error ? cause.message : 'Camera could not start.'); setBusy(false); }
  };

  const useShade = (category: Category, color: string, finish: typeof finishes[number], productId?: string) => {
    setLayers(previous => ({ ...previous, [category]: { color, finish, intensity: previous[category]?.intensity ?? .55, productId, technique: previous[category]?.technique } }));
  };
  const candidates: (Product | { id: string; name: string; brand: string; color: string; finish: typeof finishes[number]; category: Category; shadeName: string })[] = [
    ...data.products.filter(product => product.category === activeCategory),
    ...starterShades.filter(shade => shade.category === activeCategory).map(shade => ({ ...shade, id: `starter-${shade.name}`, brand: 'NEYA starter palette', shadeName: shade.name })),
  ];
  const saveLook = () => {
    const name = lookName.trim() || `${occasion} look`;
    onSaveLook({ id: crypto.randomUUID(), name, occasion, layers: structuredClone(layers), createdAt: new Date().toISOString() });
    setShowSave(false); setLookName('');
  };

  const listen = () => {
    type SpeechResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
    type SpeechRecognitionLike = { lang: string; onresult: ((event: SpeechResult) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void };
    const BrowserRecognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!BrowserRecognition) { setVoiceStatus('Voice controls are unavailable in this browser.'); return; }
    const recognition = new BrowserRecognition(); recognition.lang = navigator.language || 'en-US';
    recognition.onresult = event => {
      const command = event.results[0]?.[0]?.transcript.toLowerCase().trim() ?? '';
      const category = categories.find(item => command.includes(item.toLowerCase()));
      const shade = starterShades.find(item => command.includes(item.name.toLowerCase()));
      const nextOccasion = occasions.find(item => command.includes(item.toLowerCase()));
      if (shade) { setActiveCategory(shade.category); useShade(shade.category, shade.color, shade.finish); setVoiceStatus(`Trying ${shade.name}.`); }
      else if (command.includes('suggest')) { setLayers(suggestedLayers(occasion, data.products)); setVoiceStatus('Suggested a combination.'); }
      else if (command.includes('compare')) { setCompare(previous => !previous); setVoiceStatus('Comparison changed.'); }
      else if (command.includes('save')) { if (Object.keys(layers).length) { setShowSave(true); setVoiceStatus('Name your look to save it.'); } else setVoiceStatus('Add a shade before saving a look.'); }
      else if (category) { setActiveCategory(category); setVoiceStatus(`Showing ${category}.`); }
      else if (nextOccasion) { setOccasion(nextOccasion); setVoiceStatus(`Selected ${nextOccasion}.`); }
      else setVoiceStatus(`I heard “${command}”. Try a category, shade, “suggest”, “compare”, or “save”.`);
    };
    recognition.onerror = () => setVoiceStatus('Microphone access or voice recognition is unavailable.');
    recognition.onend = () => setVoiceStatus(previous => previous === 'Listening…' ? 'No command heard. Try again.' : previous);
    setVoiceStatus('Listening…'); recognition.start();
  };

  return <main className="page feature-page explore-page">
    <div className="page-title"><div><div className="section-kicker">THE VIRTUAL MAKEUP STUDIO</div><h1>Explore looks<span>.</span></h1><p>Try shades, build your look, and see it on your own face.</p></div><div className="title-actions">{data.profile.voiceEnabled && <button className="outline-button" onClick={listen} title="Say a category, starter shade, suggest, compare, or save"><Mic size={16} /> Voice command</button>}<button className="outline-button" onClick={() => setCompare(!compare)} disabled={source === 'none'}><Columns2 size={16} /> {compare ? 'Full preview' : 'Compare'}</button><button className="primary-button" onClick={() => setShowSave(true)} disabled={!Object.keys(layers).length}><Save size={16} /> Save look</button></div></div>
    {voiceStatus && <p className="voice-status" role="status">{voiceStatus}</p>}
    <div className="explore-layout">
      <section className="preview-card"><div className="preview-head"><span><Sparkles size={17} /> YOUR LIVE PREVIEW</span><span>{source === 'camera' ? tracking ? 'FACE TRACKED' : 'FINDING FACE' : source === 'photo' ? 'PHOTO READY' : 'ADD A FACE'}</span></div>
        <div className="preview-stage">
          <video ref={videoRef} className="hidden-video" muted playsInline aria-hidden="true" />
          {source !== 'none' ? <canvas ref={canvasRef} aria-label="Virtual makeup preview" /> : <canvas ref={canvasRef} className="empty-canvas" aria-hidden="true" />}
          {source === 'none' && <div className="preview-empty"><div className="preview-orb"><ImagePlus size={35} /></div><h2>Your look starts with you</h2><p>Upload a clear photo or open your camera to preview shades and placement.</p><div className="preview-empty-actions"><label className="light-button upload-label"><ImagePlus size={17} /> Upload photo<input type="file" accept="image/*" onChange={event => void loadPhoto(event.target.files?.[0])} /></label><button className="light-button secondary" onClick={() => void startCamera()}><Camera size={17} /> Use camera</button></div></div>}
          {source !== 'none' && <div className="preview-label">{compare ? compareLookId ? 'SAVED LOOK · CURRENT LOOK' : 'BEFORE · AFTER' : 'DIGITAL PREVIEW'}</div>}
          {busy && <div className="preview-loading">Preparing your face preview…</div>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="preview-toolbar"><div><label className="small-action"><ImagePlus size={15} /> Change photo<input type="file" accept="image/*" onChange={event => void loadPhoto(event.target.files?.[0])} /></label><button className="small-action" onClick={() => void startCamera()}><Camera size={15} /> Camera</button>{source === 'camera' && <button className="small-action" onClick={() => { stopCamera(); setSource('none'); }}><CameraOff size={15} /> Stop</button>}</div><small>Digital shades are approximations. Your photo stays on this device.</small></div>
        {compare && data.looks.length > 0 && <div className="compare-select"><label htmlFor="compare-look">Compare left side with</label><select id="compare-look" value={compareLookId} onChange={event => setCompareLookId(event.target.value)}><option value="">Original face</option>{data.looks.map(look => <option value={look.id} key={look.id}>{look.name}</option>)}</select></div>}
      </section>
      <aside className="builder-panel"><div className="builder-head"><div className="section-kicker">CREATE YOUR LOOK</div><h2>Make it yours</h2><p>Switch one layer at a time. The rest of your look stays put.</p></div>
        <div className="builder-body"><label className="field-label" htmlFor="occasion">OCCASION OR STYLE</label><select id="occasion" value={occasion} onChange={event => setOccasion(event.target.value)}>{occasions.map(item => <option key={item}>{item}</option>)}</select><button className="suggest-button" onClick={() => setLayers(suggestedLayers(occasion, data.products))}><Sparkles size={16} /> Suggest a combination <ArrowRight size={15} /></button><p className="builder-note">Suggestions are a local starting point based on your collection and occasion.</p>
          <div className="builder-divider" /><div className="field-label">MAKEUP LAYERS <span>{Object.keys(layers).length} ACTIVE</span></div>
          <div className="layer-tabs">{categories.map(category => <button key={category} className={activeCategory === category ? 'selected' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
          <div className="layer-control"><div><strong>{activeCategory}</strong><small>{layers[activeCategory] ? 'Previewing' : 'No layer selected'}</small></div>{layers[activeCategory] && <button aria-label={`Remove ${activeCategory}`} onClick={() => setLayers(previous => { const next = { ...previous }; delete next[activeCategory]; return next; })}><X size={17} /></button>}</div>
          {layers[activeCategory] && <><label className="field-label" htmlFor="intensity">INTENSITY <span>{Math.round(layers[activeCategory]!.intensity * 100)}%</span></label><input id="intensity" type="range" min="0.1" max="1" step="0.05" value={layers[activeCategory]!.intensity} onChange={event => setLayers(previous => ({ ...previous, [activeCategory]: { ...previous[activeCategory]!, intensity: Number(event.target.value) } }))} /><label className="field-label" htmlFor="finish">FINISH</label><select id="finish" value={layers[activeCategory]!.finish} onChange={event => setLayers(previous => ({ ...previous, [activeCategory]: { ...previous[activeCategory]!, finish: event.target.value as typeof finishes[number] } }))}>{finishes.map(finish => <option key={finish}>{finish}</option>)}</select>{techniques[activeCategory] && <><label className="field-label" htmlFor="technique">TECHNIQUE</label><select id="technique" value={layers[activeCategory]!.technique ?? techniques[activeCategory]![0]} onChange={event => setLayers(previous => ({ ...previous, [activeCategory]: { ...previous[activeCategory]!, technique: event.target.value } }))}>{techniques[activeCategory]!.map(technique => <option key={technique}>{technique}</option>)}</select></>}</>}
          <div className="field-label shade-title">TRY A SHADE</div><div className="shade-list">{candidates.length ? candidates.map(candidate => <button key={candidate.id} className="shade-option" onClick={() => useShade(activeCategory, candidate.color, candidate.finish, candidate.id.startsWith('starter-') ? undefined : candidate.id)}><span className="shade-swatch" style={{ background: candidate.color }} /><span><strong>{candidate.shadeName}</strong><small>{candidate.brand}</small></span>{layers[activeCategory]?.color === candidate.color && <Check size={15} />}</button>) : <p className="builder-note">Add a {activeCategory.toLowerCase()} in My Collection to preview its colour.</p>}</div>
          <label className="field-label" htmlFor="custom-color">OR PICK A COLOUR</label><div className="color-picker"><input id="custom-color" type="color" value={layers[activeCategory]?.color ?? '#a86e62'} onChange={event => useShade(activeCategory, event.target.value, layers[activeCategory]?.finish ?? 'Natural')} /><span>{layers[activeCategory]?.color ?? 'Choose a shade'}</span><SlidersHorizontal size={17} /></div>
        </div>
      </aside>
    </div>
    <div className="subtle-notice"><Sparkles size={18} /><span>NEYA previews colour and placement on face landmarks. It cannot guarantee an exact physical shade, finish, or coverage.</span></div>
    {showSave && <div className="modal-backdrop" onClick={() => setShowSave(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="save-title" onClick={event => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setShowSave(false)}><X size={18} /></button><div className="section-kicker">KEEP THIS LOOK</div><h2 id="save-title">Save your creation</h2><p>Find it later in Saved Looks and keep experimenting.</p><label className="field-label" htmlFor="look-name">LOOK NAME</label><input id="look-name" value={lookName} onChange={event => setLookName(event.target.value)} placeholder={`${occasion} look`} maxLength={60} /><button className="primary-button modal-submit" onClick={saveLook}><Save size={16} /> Save look</button></div></div>}
  </main>;
}
