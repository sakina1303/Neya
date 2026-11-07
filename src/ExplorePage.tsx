import { useCallback, useEffect, useRef, useState } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { ArrowRight, Camera, CameraOff, Check, Columns2, ExternalLink, ImagePlus, Mic, MicOff, Save, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { categories, finishes, occasions, starterShades, suggestedLayers, techniques, type BeautyData, type Category, type LookLayers, type Product, type SavedLook } from './data/beauty';
import { indiaCatalog, similarProducts } from './data/catalog';
import { createLandmarkEngine, detectImageFace, type LandmarkEngine } from './vision/faceLandmarker';
import { drawMakeup } from './vision/makeup';
import { drawPreviewMesh } from './vision/drawFace';
import heroPortrait from './assets/hero-portrait.png';

type Props = { data: BeautyData; onSaveLook: (look: SavedLook) => void; onAddProduct: (product: Product) => void; initialLook?: SavedLook | null; onClearInitialLook: () => void; autoCamera?: boolean };

export function ExplorePage({ data, onSaveLook, onAddProduct, initialLook, onClearInitialLook, autoCamera = false }: Props) {
  const [occasion, setOccasion] = useState(initialLook?.occasion ?? 'Everyday');
  const [layers, setLayers] = useState<LookLayers>(initialLook?.layers ?? {});
  const [source, setSource] = useState<'none' | 'photo' | 'camera'>('none');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('Preparing your face preview…');
  const [compare, setCompare] = useState(false);
  const [compareLookId, setCompareLookId] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Lipstick');
  const [lookName, setLookName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [voiceActive, setVoiceActive] = useState(false);
  const [typedCommand, setTypedCommand] = useState('');
  const [showMatches, setShowMatches] = useState(false);
  const [showFaceMap, setShowFaceMap] = useState(false);
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
  const showFaceMapRef = useRef(showFaceMap);
  const runRef = useRef(0);
  const recognitionRef = useRef<{ abort(): void } | null>(null);
  layersRef.current = layers;
  compareRef.current = compare;
  compareLayersRef.current = data.looks.find(look => look.id === compareLookId)?.layers ?? null;
  showFaceMapRef.current = showFaceMap;

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
    if (showFaceMapRef.current) drawPreviewMesh(ctx, face, canvas.width, canvas.height, mirrored);
    if (compareRef.current) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke(); }
  }, []);

  const stopCamera = useCallback(() => {
    runRef.current += 1;
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
    engineRef.current?.close(); engineRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    trackingRef.current = false;
    setTracking(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => () => recognitionRef.current?.abort(), []);
  useEffect(() => {
    if (initialLook) { setOccasion(initialLook.occasion); setLayers(initialLook.layers); onClearInitialLook(); }
  }, [initialLook, onClearInitialLook]);
  useEffect(() => { if (source === 'photo' && imageRef.current) render(imageRef.current, landmarksRef.current, false); }, [layers, compare, compareLookId, showFaceMap, source, render]);

  const loadPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('Choose an image under 12 MB.'); return; }
    stopCamera(); setBusy(true); setBusyMessage('Preparing your photo preview…'); setError(''); setSource('none');
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      const face = await detectImageFace(image);
      if (!face) throw new Error('No face found. Try a clear, front-facing photo in even light.');
      imageRef.current = image; landmarksRef.current = face; setSource('photo'); render(image, face, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open this photo.'); }
    finally { URL.revokeObjectURL(url); setBusy(false); }
  };
  const loadDemoPhoto = async () => {
    stopCamera(); setBusy(true); setBusyMessage('Preparing the sample face…'); setError(''); setSource('none');
    try {
      const image = new Image(); image.src = heroPortrait; await image.decode();
      const face = await detectImageFace(image);
      if (!face) throw new Error('The sample face could not be tracked. Please upload another photo.');
      imageRef.current = image; landmarksRef.current = face; setSource('photo'); render(image, face, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The sample photo could not open.'); }
    finally { setBusy(false); }
  };

  const startCamera = async () => {
    stopCamera(); imageRef.current = null; landmarksRef.current = undefined; setSource('none'); setError(''); setBusy(true); setBusyMessage('Waiting for camera permission… Allow NEYA in your browser.');
    const run = runRef.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) throw new Error('Camera access requires HTTPS or localhost.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (run !== runRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      setBusyMessage('Loading live face tracking…');
      const video = videoRef.current; if (!video) throw new Error('Camera preview is unavailable.');
      video.srcObject = stream; await video.play();
      if (run !== runRef.current) return;
      const engine = await createLandmarkEngine();
      if (run !== runRef.current) { engine.close(); return; }
      engineRef.current = engine; setSource('camera'); setBusy(false);
      let lastVideoTime = -1, lastDetectAt = 0;
      const tick = (now: number) => {
        if (run !== runRef.current) return;
        frameRef.current = requestAnimationFrame(tick);
        if (video.readyState < 2 || video.currentTime === lastVideoTime || now - lastDetectAt < 50) return;
        lastVideoTime = video.currentTime; lastDetectAt = now;
        try {
          const face = engine.detect(video, now).faceLandmarks[0];
          landmarksRef.current = face;
          if (trackingRef.current !== Boolean(face)) { trackingRef.current = Boolean(face); setTracking(Boolean(face)); }
          render(video, face, true);
        } catch (cause) { stopCamera(); setSource('none'); setError(cause instanceof Error ? cause.message : 'Face tracking stopped. Try the camera again.'); }
      };
      frameRef.current = requestAnimationFrame(tick);
      stream.getVideoTracks()[0]?.addEventListener('ended', () => { stopCamera(); setSource('none'); setError('Camera disconnected.'); }, { once: true });
    } catch (cause) { if (run === runRef.current) { stopCamera(); setError(cause instanceof Error ? cause.message : 'Camera could not start.'); setBusy(false); } }
  };
  useEffect(() => { if (autoCamera) void startCamera(); }, [autoCamera]);

  const useShade = (category: Category, color: string, finish: typeof finishes[number], productId?: string) => {
    const defaultIntensity = category === 'Lipstick' ? .95 : category === 'Blush' || category === 'Eyeshadow' ? .75 : .7;
    setLayers(previous => ({ ...previous, [category]: { color, finish, intensity: previous[category]?.intensity ?? defaultIntensity, productId, technique: previous[category]?.technique } }));
  };
  const candidates: (Product | { id: string; name: string; brand: string; color: string; finish: typeof finishes[number]; category: Category; shadeName: string })[] = [
    ...data.products.filter(product => product.category === activeCategory),
    ...indiaCatalog.filter(product => product.category === activeCategory).map(product => ({ ...product, id: `catalog-${product.id}` })),
    ...starterShades.filter(shade => shade.category === activeCategory).map(shade => ({ ...shade, id: `starter-${shade.name}`, brand: 'NEYA starter palette', shadeName: shade.name })),
  ];
  const selectedLayer = layers[activeCategory];
  const selectedProduct = candidates.find(candidate => candidate.id === selectedLayer?.productId);
  const selectedCatalog = indiaCatalog.find(product => `catalog-${product.id}` === selectedLayer?.productId);
  const collectionCandidates = candidates.filter(candidate => !candidate.id.startsWith('starter-') && !candidate.id.startsWith('catalog-'));
  const brandCandidates = candidates.filter(candidate => candidate.id.startsWith('catalog-'));
  const paletteCandidates = candidates.filter(candidate => candidate.id.startsWith('starter-'));
  const matches = selectedLayer ? similarProducts(activeCategory, selectedLayer.color, selectedLayer.finish, data.products, 5).filter(product => product.id !== selectedCatalog?.id).slice(0, 4) : [];
  const shadeButton = (candidate: typeof candidates[number]) => <button key={candidate.id} className={`shade-option ${selectedLayer?.productId === candidate.id ? 'is-selected' : ''}`} onClick={() => { useShade(activeCategory, candidate.color, candidate.finish, candidate.id); setShowMatches(false); }}><span className="shade-swatch" style={{ background: candidate.color }} /><span><strong>{candidate.shadeName}</strong><small>{candidate.brand} · {candidate.name}</small></span><span className="shade-finish">{candidate.finish}</span>{selectedLayer?.productId === candidate.id && <Check size={15} />}</button>;
  const saveLook = () => {
    const name = lookName.trim() || `${occasion} look`;
    onSaveLook({ id: crypto.randomUUID(), name, occasion, layers: structuredClone(layers), createdAt: new Date().toISOString() });
    setShowSave(false); setLookName('');
  };

  const runCommand = (spoken: string) => {
    const command = spoken.toLocaleLowerCase().trim();
    const aliases: Partial<Record<Category, string[]>> = {
      Lipstick: ['lipstick', 'लिपस्टिक', 'होंठ'], Blush: ['blush', 'ब्लश', 'गाल'],
      Eyeshadow: ['eyeshadow', 'eye shadow', 'आईशैडो'], Eyeliner: ['eyeliner', 'eye liner', 'लाइनर'],
      Foundation: ['foundation', 'फाउंडेशन'], Concealer: ['concealer', 'कंसीलर'],
      Highlighter: ['highlighter', 'हाइलाइटर'], Mascara: ['mascara', 'मस्कारा'],
      Contour: ['contour', 'कॉन्टूर'], 'Lip gloss': ['lip gloss', 'ग्लॉस'], 'Lip liner': ['lip liner', 'लिप लाइनर'],
    };
    const voiceShades = [
      ...data.products.map(item => ({ ...item, label: item.shadeName || item.name })),
      ...indiaCatalog.map(item => ({ ...item, label: item.shadeName })),
      ...starterShades.map(item => ({ ...item, label: item.name })),
    ].filter(item => item.label).sort((a, b) => b.label.length - a.label.length || Number(b.category === activeCategory) - Number(a.category === activeCategory));
    const shade = voiceShades.find(item => command.includes(item.label.toLowerCase()));
    const category = categories.find(item => aliases[item]?.some(alias => command.includes(alias)));
    const nextOccasion = occasions.find(item => command.includes(item.toLowerCase()));
    let response = '';
    if (shade) { setActiveCategory(shade.category); useShade(shade.category, shade.color, shade.finish); response = `Trying ${shade.label}.`; }
    else if (/suggest|recommend|सजेस्ट|सुझाव/.test(command)) { setLayers(suggestedLayers(occasion, data.products)); response = 'Suggested a complete look.'; }
    else if (/compare|तुलना/.test(command)) { setCompare(previous => !previous); response = 'Comparison changed.'; }
    else if (/save|सेव/.test(command)) { if (Object.keys(layers).length) { setShowSave(true); response = 'Name your look to save it.'; } else response = 'Add a shade before saving a look.'; }
    else if (category) { setActiveCategory(category); response = `Showing ${category}. Choose a shade to preview it.`; }
    else if (nextOccasion) { setOccasion(nextOccasion); response = `Selected ${nextOccasion}.`; }
    else response = `I heard “${spoken}”. Try “show blush”, “rosewood”, “suggest”, or “compare”.`;
    setVoiceStatus(response);
    if (data.profile.voiceEnabled && 'speechSynthesis' in window) { window.speechSynthesis.cancel(); const reply = new SpeechSynthesisUtterance(response); reply.lang = voiceLanguage; window.speechSynthesis.speak(reply); }
  };
  const listen = () => {
    if (voiceActive) { recognitionRef.current?.abort(); recognitionRef.current = null; setVoiceActive(false); setVoiceStatus('Listening stopped.'); return; }
    type SpeechResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
    type SpeechRecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; onaudiostart: (() => void) | null; onresult: ((event: SpeechResult) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; abort: () => void };
    const BrowserRecognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!window.isSecureContext) { setVoiceStatus('Microphone needs an HTTPS page.'); return; }
    if (!BrowserRecognition) { setVoiceStatus('Speech recognition is unavailable here. Try NEYA in Chrome or Safari, or type a command below.'); return; }
    const recognition = new BrowserRecognition(); recognition.lang = voiceLanguage; recognition.continuous = false; recognition.interimResults = false;
    recognitionRef.current = recognition;
    recognition.onaudiostart = () => setVoiceStatus('Microphone connected. Say a product, shade, or “suggest”.');
    recognition.onresult = event => {
      const command = event.results[0]?.[0]?.transcript ?? '';
      if (command) runCommand(command);
    };
    recognition.onerror = event => {
      const messages: Record<string, string> = { 'not-allowed': 'Microphone blocked. Allow microphone access for NEYA in your browser, then try again.', 'service-not-allowed': 'This browser has blocked speech recognition. Try Chrome or Safari, or type a command.', 'audio-capture': 'No microphone found. Check your device input.', network: 'Speech service is offline. Type a command below instead.', 'no-speech': 'No speech heard. Move closer to your microphone and retry.' };
      setVoiceStatus(messages[event.error] ?? `Voice recognition stopped (${event.error}). Type a command below instead.`);
    };
    recognition.onend = () => { recognitionRef.current = null; setVoiceActive(false); setVoiceStatus(previous => previous.startsWith('Waiting for microphone') || previous.startsWith('Microphone connected') ? 'No command heard. Try again or type a command.' : previous); };
    try { setVoiceActive(true); setVoiceStatus('Waiting for microphone permission… allow NEYA in your browser, then speak.'); recognition.start(); }
    catch { recognitionRef.current = null; setVoiceActive(false); setVoiceStatus('Microphone could not start here. Try Chrome or Safari, or type a command below.'); }
  };

  return <main className="page feature-page explore-page">
    <div className="page-title"><div><div className="section-kicker">{autoCamera ? 'YOUR REAL TIME MAKEUP MIRROR' : 'THE VIRTUAL MAKEUP STUDIO'}</div><h1>{autoCamera ? 'Live makeup' : 'Explore looks'}<span>.</span></h1><p>{autoCamera ? 'Pick a product or shade and watch it follow your face as you move.' : 'Try shades, build your look, and see it on your own face.'}</p></div><div className="title-actions"><button className={`outline-button ${voiceActive ? 'listening-button' : ''}`} onClick={listen} title="Say a category, shade, suggest, compare, or save">{voiceActive ? <MicOff size={16} /> : <Mic size={16} />} {voiceActive ? 'Stop listening' : 'Voice command'}</button><button className="outline-button" onClick={() => setCompare(!compare)} disabled={source === 'none'}><Columns2 size={16} /> {compare ? 'Full preview' : 'Compare'}</button><button className="primary-button" onClick={() => setShowSave(true)} disabled={!Object.keys(layers).length}><Save size={16} /> Save look</button></div></div>
    <form className="voice-bar" onSubmit={event => { event.preventDefault(); if (typedCommand.trim()) { runCommand(typedCommand); setTypedCommand(''); } }}><label htmlFor="voice-language">VOICE LANGUAGE</label><select id="voice-language" value={voiceLanguage} onChange={event => setVoiceLanguage(event.target.value as 'en-IN' | 'hi-IN')}><option value="en-IN">English / Hinglish</option><option value="hi-IN">Hindi</option></select><input aria-label="Type a makeup command" placeholder="Try “show blush” or “suggest a look”" value={typedCommand} onChange={event => setTypedCommand(event.target.value)} /><button type="submit" disabled={!typedCommand.trim()}>Send</button></form>
    <p className="voice-help">Allow microphone access for voice commands. If your in-app browser blocks speech recognition, open NEYA in Chrome or Safari. Typed commands work here too.</p>
    {voiceStatus && <p className="voice-status" role="status">{voiceStatus}</p>}
    <div className="explore-layout">
      <section className="preview-card"><div className="preview-head"><span><Sparkles size={17} /> YOUR LIVE PREVIEW</span><span>{source === 'camera' ? tracking ? 'FACE TRACKED' : 'FINDING FACE' : source === 'photo' ? 'PHOTO READY' : 'ADD A FACE'}</span></div>
        <div className="preview-stage">
          <video ref={videoRef} className="hidden-video" muted playsInline aria-hidden="true" />
          {source !== 'none' ? <canvas ref={canvasRef} aria-label="Virtual makeup preview" /> : <canvas ref={canvasRef} className="empty-canvas" aria-hidden="true" />}
          {source === 'none' && <div className="preview-empty"><div className="preview-orb"><ImagePlus size={35} /></div><h2>Your look starts with you</h2><p>Upload a clear photo or open your camera to preview shades and placement.</p><div className="preview-empty-actions"><label className="light-button upload-label"><ImagePlus size={17} /> Upload photo<input type="file" accept="image/*" onChange={event => void loadPhoto(event.target.files?.[0])} /></label><button className="light-button secondary" onClick={() => void startCamera()}><Camera size={17} /> Use camera</button><button className="light-button secondary" onClick={() => void loadDemoPhoto()}><Sparkles size={17} /> Try sample face</button></div></div>}
          {source !== 'none' && <div className="preview-label">{compare ? compareLookId ? 'SAVED LOOK · CURRENT LOOK' : 'BEFORE · AFTER' : source === 'camera' ? tracking ? `${Object.keys(layers).length} LIVE MAKEUP LAYERS` : 'POSITION YOUR FACE' : 'DIGITAL PREVIEW'}</div>}
          {source !== 'none' && activeCategory === 'Lipstick' && selectedProduct && <div className="preview-product-badge"><span className="preview-product-dot" style={{ background: selectedProduct.color }} /><span><strong>{selectedProduct.shadeName}</strong><small>{selectedProduct.brand} · {selectedProduct.name}</small></span></div>}
          {busy && <div className="preview-loading"><span>{busyMessage}</span><button onClick={() => { stopCamera(); setBusy(false); setSource('none'); }}>Cancel</button></div>}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="preview-toolbar"><div><label className="small-action"><ImagePlus size={15} /> Change photo<input type="file" accept="image/*" onChange={event => void loadPhoto(event.target.files?.[0])} /></label><button className="small-action" onClick={() => void startCamera()}><Camera size={15} /> Live camera</button><button className="small-action" onClick={() => void loadDemoPhoto()}><Sparkles size={15} /> Sample face</button><button className="small-action" disabled={source === 'none'} onClick={() => setShowFaceMap(previous => !previous)}>{showFaceMap ? 'Hide face map' : 'Show face map'}</button>{source === 'camera' && <button className="small-action" onClick={() => { stopCamera(); setSource('none'); }}><CameraOff size={15} /> Stop</button>}</div><small>Select a shade on the right to see makeup on your face. Video stays on this device.</small></div>
        {Object.keys(layers).length > 0 && <div className="active-layer-strip"><span>ON YOUR FACE</span>{(Object.keys(layers) as Category[]).map(category => <button key={category} onClick={() => setActiveCategory(category)}><i style={{ background: layers[category]?.color }} />{category}</button>)}</div>}
        {compare && data.looks.length > 0 && <div className="compare-select"><label htmlFor="compare-look">Compare left side with</label><select id="compare-look" value={compareLookId} onChange={event => setCompareLookId(event.target.value)}><option value="">Original face</option>{data.looks.map(look => <option value={look.id} key={look.id}>{look.name}</option>)}</select></div>}
      </section>
      <aside className="builder-panel"><div className="builder-head"><div className="section-kicker">CREATE YOUR LOOK</div><h2>Make it yours</h2><p>Switch one layer at a time. The rest of your look stays put.</p></div>
        <div className="builder-body"><label className="field-label" htmlFor="occasion">OCCASION OR STYLE</label><select id="occasion" value={occasion} onChange={event => setOccasion(event.target.value)}>{occasions.map(item => <option key={item}>{item}</option>)}</select><button className="suggest-button" onClick={() => setLayers(suggestedLayers(occasion, data.products))}><Sparkles size={16} /> Suggest a combination <ArrowRight size={15} /></button><p className="builder-note">Suggestions are a local starting point based on your collection and occasion.</p>
          <div className="builder-divider" /><div className="field-label">MAKEUP LAYERS <span>{Object.keys(layers).length} ACTIVE</span></div>
          <div className="layer-tabs">{categories.map(category => <button key={category} className={activeCategory === category ? 'selected' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
          <div className="layer-control"><div><strong>{activeCategory}</strong><small>{layers[activeCategory] ? 'Previewing' : 'No layer selected'}</small></div>{layers[activeCategory] && <button aria-label={`Remove ${activeCategory}`} onClick={() => setLayers(previous => { const next = { ...previous }; delete next[activeCategory]; return next; })}><X size={17} /></button>}</div>
          {activeCategory === 'Lipstick' && <p className="lip-product-help">Choose an actual lipstick below. The preview follows your lips; colour is an approximation of the physical shade.</p>}
          {layers[activeCategory] && <><label className="field-label" htmlFor="intensity">INTENSITY <span>{Math.round(layers[activeCategory]!.intensity * 100)}%</span></label><input id="intensity" type="range" min="0.1" max="1" step="0.05" value={layers[activeCategory]!.intensity} onChange={event => setLayers(previous => ({ ...previous, [activeCategory]: { ...previous[activeCategory]!, intensity: Number(event.target.value) } }))} /><label className="field-label" htmlFor="finish">FINISH</label><select id="finish" value={layers[activeCategory]!.finish} onChange={event => setLayers(previous => ({ ...previous, [activeCategory]: { ...previous[activeCategory]!, finish: event.target.value as typeof finishes[number] } }))}>{finishes.map(finish => <option key={finish}>{finish}</option>)}</select>{techniques[activeCategory] && <><label className="field-label" htmlFor="technique">TECHNIQUE</label><select id="technique" value={layers[activeCategory]!.technique ?? techniques[activeCategory]![0]} onChange={event => setLayers(previous => ({ ...previous, [activeCategory]: { ...previous[activeCategory]!, technique: event.target.value } }))}>{techniques[activeCategory]!.map(technique => <option key={technique}>{technique}</option>)}</select></>}</>}
          {collectionCandidates.length > 0 && <><div className="field-label shade-title">IN YOUR COLLECTION</div><div className="shade-list collection-shades">{collectionCandidates.map(shadeButton)}</div></>}
          <div className="field-label shade-title">{activeCategory === 'Lipstick' ? 'BRAND LIPSTICKS · INDIA' : 'BRAND PRODUCTS · INDIA'}</div><div className={`shade-list ${activeCategory === 'Lipstick' ? 'lipstick-list' : ''}`}>{brandCandidates.map(shadeButton)}</div>
          {selectedCatalog && <div className="selected-product"><div className="selected-product-swatch" style={{ background: selectedCatalog.color }} /><div><span>ON YOUR FACE</span><strong>{selectedCatalog.brand} {selectedCatalog.name}</strong><small>{selectedCatalog.shadeName} · {selectedCatalog.finish} finish</small></div><a href={selectedCatalog.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${selectedCatalog.brand} ${selectedCatalog.name} on brand site`}>View product <ExternalLink size={14} /></a></div>}
          {activeCategory !== 'Lipstick' && <><div className="field-label shade-title">NEYA COLOUR IDEAS</div><div className="shade-list palette-list">{paletteCandidates.map(candidate => <button key={candidate.id} className="shade-option" onClick={() => { useShade(activeCategory, candidate.color, candidate.finish); setShowMatches(false); }}><span className="shade-swatch" style={{ background: candidate.color }} /><span><strong>{candidate.shadeName}</strong><small>Digital colour idea</small></span></button>)}</div></>}
          <label className="field-label" htmlFor="custom-color">OR PICK A COLOUR</label><div className="color-picker"><input id="custom-color" type="color" value={layers[activeCategory]?.color ?? '#a86e62'} onChange={event => useShade(activeCategory, event.target.value, layers[activeCategory]?.finish ?? 'Natural')} /><span>{layers[activeCategory]?.color ?? 'Choose a shade'}</span><SlidersHorizontal size={17} /></div>
          <button className="suggest-button match-toggle" disabled={!selectedLayer} onClick={() => setShowMatches(previous => !previous)}><Sparkles size={16} /> {showMatches ? 'Hide similar products' : 'Show similar products'} <ArrowRight size={15} /></button>
          {showMatches && selectedLayer && <div className="matched-products"><p>India products near this colour family. Digital swatches are approximate; check the brand page for the actual shade.</p>{matches.length ? matches.map(product => <article className="match-card" key={`${product.source}-${product.id}`}><span className="match-swatch" style={{ background: product.color }} /><div><strong>{product.brand} {product.name}</strong><small>{product.shadeName} · {product.source === 'Your collection' ? 'In your collection' : 'Brand verified'}</small></div>{product.url && <a href={product.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${product.brand} ${product.name} on brand site`}><ExternalLink size={15} /></a>}{product.source === 'Verified product' && <button className="wishlist-button" onClick={() => onAddProduct({ id: crypto.randomUUID(), brand: product.brand, name: product.name, category: product.category, shadeName: product.shadeName, shadeNumber: '', color: product.color, finish: product.finish, purchaseUrl: product.url, owned: false })} disabled={data.products.some(item => item.brand === product.brand && item.name === product.name && item.shadeName === product.shadeName)}>{data.products.some(item => item.brand === product.brand && item.name === product.name && item.shadeName === product.shadeName) ? 'Saved' : '+ Wishlist'}</button>}</article>) : <p>No verified product in this category yet. You can add one to My Collection.</p>}</div>}
        </div>
      </aside>
    </div>
    <div className="subtle-notice"><Sparkles size={18} /><span>NEYA previews colour and placement on face landmarks. It cannot guarantee an exact physical shade, finish, or coverage.</span></div>
    {showSave && <div className="modal-backdrop" onClick={() => setShowSave(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="save-title" onClick={event => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setShowSave(false)}><X size={18} /></button><div className="section-kicker">KEEP THIS LOOK</div><h2 id="save-title">Save your creation</h2><p>Find it later in Saved Looks and keep experimenting.</p><label className="field-label" htmlFor="look-name">LOOK NAME</label><input id="look-name" value={lookName} onChange={event => setLookName(event.target.value)} placeholder={`${occasion} look`} maxLength={60} /><button className="primary-button modal-submit" onClick={saveLook}><Save size={16} /> Save look</button></div></div>}
  </main>;
}
