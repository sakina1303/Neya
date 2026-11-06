import { useEffect, useRef, useState } from 'react';
import {
  Aperture, ArrowRight, Bookmark, Camera, CameraOff, Check, ChevronDown, CircleHelp,
  Eye, Focus, LayoutGrid, Menu, ScanFace, Settings2, ShieldCheck,
  Sparkles, Video, X,
} from 'lucide-react';
import { useFaceSession } from './hooks/useFaceSession';
import type { OverlayMode } from './vision/drawFace';
import heroPortrait from './assets/hero-portrait.png';
import { ExplorePage } from './ExplorePage';
import { CollectionPage } from './CollectionPage';
import { ProfilePage } from './ProfilePage';
import { SavedLooksPage } from './SavedLooksPage';
import { clearBeautyData, emptyData, loadBeautyData, saveBeautyData, type BeautyData, type SavedLook } from './data/beauty';
import { cloud, cloudSafeData, isBeautyData, mergeBeautyData } from './cloud';

const displayStatus = {
  idle: 'Camera off', requesting: 'Requesting access', 'loading-model': 'Loading face tracker',
  searching: 'Looking for your face', tracking: 'Face tracking active', error: 'Camera needs attention',
};

function App() {
  const session = useFaceSession();
  const [view, setView] = useState<'dashboard' | 'studio' | 'explore' | 'collection' | 'profile' | 'looks'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [beauty, setBeauty] = useState<BeautyData>(loadBeautyData);
  const [storageError, setStorageError] = useState(false);
  const [initialLook, setInitialLook] = useState<SavedLook | null>(null);
  const [cloudUser, setCloudUser] = useState<{ id: string; email?: string } | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState('');
  const beautyRef = useRef(beauty);
  beautyRef.current = beauty;
  const isActive = !['idle', 'error'].includes(session.state.status);

  const openStudio = () => { setView('studio'); setMenuOpen(false); };
  const navigate = (next: typeof view) => { if (next !== 'studio') session.stop(); setView(next); setMenuOpen(false); };
  const backHome = () => { session.stop(); setView('dashboard'); setMenuOpen(false); };
  useEffect(() => { setStorageError(!saveBeautyData(beauty)); }, [beauty]);
  useEffect(() => {
    const client = cloud;
    if (!client) return;
    let active = true;
    let lastUser = '';
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user;
      if (!nextUser) { lastUser = ''; setCloudUser(null); setCloudReady(false); return; }
      setCloudUser({ id: nextUser.id, email: nextUser.email });
      if (lastUser === nextUser.id) return;
      lastUser = nextUser.id; setCloudReady(false);
      window.setTimeout(async () => {
        if (!active) return;
        const { data: row, error } = await client.from('beauty_data').select('payload').eq('user_id', nextUser.id).maybeSingle();
        if (!active) return;
        if (error) { setCloudError(error.message); return; }
        if (row && isBeautyData(row.payload)) setBeauty(mergeBeautyData(row.payload, beautyRef.current));
        else {
          const { error: saveError } = await client.from('beauty_data').upsert({ user_id: nextUser.id, payload: cloudSafeData(beautyRef.current), updated_at: new Date().toISOString() });
          if (saveError) { setCloudError(saveError.message); return; }
        }
        setCloudError(''); setCloudReady(true);
      }, 0);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    const client = cloud;
    if (!client || !cloudUser || !cloudReady) return;
    const timer = window.setTimeout(async () => {
      const { error } = await client.from('beauty_data').upsert({ user_id: cloudUser.id, payload: cloudSafeData(beauty), updated_at: new Date().toISOString() });
      setCloudError(error?.message ?? '');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [beauty, cloudUser, cloudReady]);
  const openLook = (look: SavedLook) => { setInitialLook(look); navigate('explore'); };
  const deleteAll = async () => {
    setCloudReady(false);
    if (cloud && cloudUser) {
      const { error } = await cloud.from('beauty_data').delete().eq('user_id', cloudUser.id);
      if (error) { setCloudError(error.message); setCloudReady(true); return false; }
      const { error: signOutError } = await cloud.auth.signOut();
      if (signOutError) { setCloudError(signOutError.message); return false; }
    }
    clearBeautyData(); setBeauty(structuredClone(emptyData)); setCloudError(''); return true;
  };
  const signOut = async () => { if (cloud) await cloud.auth.signOut(); clearBeautyData(); setBeauty(structuredClone(emptyData)); };
  const signIn = async (email: string) => {
    if (!cloud) return 'Cloud sync is not configured yet.';
    const { error } = await cloud.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    return error ? error.message : 'Check your email for the sign-in link.';
  };

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
      <div className="brand" onClick={backHome} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') backHome(); }}>
        <div className="brand-mark"><span>n</span><i /></div>
        <div className="brand-word">neya<span>.</span></div>
      </div>
      <div className="sidebar-caption">YOUR BEAUTY SPACE</div>
      <nav aria-label="Main navigation" className="nav-list">
        <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={backHome}><LayoutGrid size={18} /> Dashboard</button>
        <button className={`nav-item ${view === 'studio' ? 'active' : ''}`} onClick={openStudio}><ScanFace size={18} /> Face studio <span className="nav-live" /></button>
        <button className={`nav-item ${view === 'explore' ? 'active' : ''}`} onClick={() => navigate('explore')}><Sparkles size={18} /> Explore looks</button>
      </nav>
      <div className="sidebar-caption tools-caption">YOUR TOOLS</div>
      <nav aria-label="Your tools" className="nav-list">
        <button className={`nav-item ${view === 'collection' ? 'active' : ''}`} onClick={() => navigate('collection')}><Aperture size={18} /> My collection</button>
        <button className={`nav-item ${view === 'looks' ? 'active' : ''}`} onClick={() => navigate('looks')}><Bookmark size={18} /> Saved looks</button>
        <button className={`nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => navigate('profile')}><Settings2 size={18} /> Beauty profile</button>
      </nav>
      <div className="sidebar-bottom">
        <div className="privacy-note"><ShieldCheck size={19} /><div><strong>Privacy comes first</strong><p>Camera frames stay on your device during tracking.</p></div></div>
        <div className="avatar-line"><div className="avatar">N</div><div><strong>{beauty.profile.name ? `Hello, ${beauty.profile.name}` : 'Welcome to NEYA'}</strong><small>Your personal beauty space</small></div><ChevronDown size={15} /></div>
      </div>
    </aside>

    <div className="main-column">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={22} /></button>
        <div className="breadcrumb">YOUR SPACE <span>/</span> <strong>{({ dashboard: 'DASHBOARD', studio: 'FACE STUDIO', explore: 'EXPLORE LOOKS', collection: 'MY COLLECTION', profile: 'BEAUTY PROFILE', looks: 'SAVED LOOKS' } as const)[view]}</strong></div>
        <div className="topbar-right"><span className="phase-pill"><span /> YOUR BEAUTY SPACE</span><button className="help-button" title="Privacy information" onClick={() => navigate('profile')}><CircleHelp size={19} /></button></div>
      </header>

      {view === 'dashboard' ? <main className="page dashboard">
        <div className="welcome-line"><span>YOUR PERSONAL BEAUTY SPACE</span><span>✦ &nbsp; MADE FOR YOUR FACE</span></div>
        <section className="hero">
          <div className="hero-content"><div className="eyebrow"><Sparkles size={14} /> THE BEAUTY OF BEING YOU</div><h1>Meet your<br /><em>personal</em> makeup artist.</h1><p>Try looks on your face, build a collection, and discover a routine that feels like you.</p><button className="primary-button" onClick={() => navigate('explore')}>Explore looks <ArrowRight size={18} /></button><div className="hero-foot"><span className="star">✳</span> A more personal way to do makeup starts here.</div></div>
          <div className="hero-art" aria-hidden="true"><img className="hero-portrait" src={heroPortrait} alt="" /><div className="portrait-glow" /></div>
        </section>

        <section className="section-head"><div><div className="section-kicker">LET'S BEGIN</div><h2>What would you like to do?</h2></div><span>YOUR JOURNEY, YOUR WAY</span></section>
        <div className="feature-grid">
          <button className="feature-card available" onClick={openStudio}><div className="feature-icon coral"><ScanFace size={25} /></div><div className="feature-label"><span>01 · LIVE TRACKING</span><ArrowRight size={19} /></div><h3>Start face tracking</h3><p>Open your camera and see subtle face mapping that moves with you.</p><div className="feature-foot">OPEN STUDIO <ArrowRight size={15} /></div></button>
          <button className="feature-card available" onClick={() => navigate('explore')}><div className="feature-icon lilac"><Sparkles size={25} /></div><div className="feature-label"><span>02 · VIRTUAL STUDIO</span><ArrowRight size={19} /></div><h3>Try on looks</h3><p>Preview shades and complete looks right on your face.</p><div className="feature-foot">EXPLORE LOOKS <ArrowRight size={15} /></div></button>
          <button className="feature-card available" onClick={() => navigate('collection')}><div className="feature-icon peach"><Aperture size={25} /></div><div className="feature-label"><span>03 · YOUR PRODUCTS</span><ArrowRight size={19} /></div><h3>My collection</h3><p>Bring your favorite products together in one personal beauty space.</p><div className="feature-foot">OPEN COLLECTION <ArrowRight size={15} /></div></button>
        </div>
        <div id="about-phase" className="foundation-strip"><div className="strip-icon"><Focus size={21} /></div><div><strong>Your space is taking shape.</strong><p>Try-on and collection tools work now. Sign in under Beauty Profile for free cloud sync. AI services are off to avoid billing.</p></div><span>NEYA STUDIO</span></div>
      </main> : view === 'explore' ? <ExplorePage data={beauty} onSaveLook={look => setBeauty(previous => ({ ...previous, looks: [look, ...previous.looks] }))} initialLook={initialLook} onClearInitialLook={() => setInitialLook(null)} /> : view === 'collection' ? <CollectionPage products={beauty.products} onChange={products => setBeauty(previous => ({ ...previous, products }))} /> : view === 'profile' ? <ProfilePage data={beauty} onChange={profile => setBeauty(previous => ({ ...previous, profile }))} onDeleteAll={deleteAll} cloudConnected={cloudReady} cloudAvailable={Boolean(cloud)} accountEmail={cloudUser?.email} onSignIn={signIn} onSignOut={signOut} cloudError={cloudError} /> : view === 'looks' ? <SavedLooksPage looks={beauty.looks} onOpen={openLook} onChange={looks => setBeauty(previous => ({ ...previous, looks }))} /> : <main className="page studio-page">
        <div className="studio-heading"><div><div className="section-kicker">THE FIRST STEP TO YOUR LOOK</div><h1>Your face studio<span>.</span></h1><p>See how NEYA maps your features in real time. Move naturally and watch the tracking follow.</p></div><button className="text-back" onClick={backHome}>← Back to dashboard</button></div>

        <div className="studio-grid"><section className="camera-panel">
          <div className="panel-top"><div><div className="camera-symbol"><Video size={18} /></div><strong>Live camera</strong><span className="panel-subtitle">Your face, in focus</span></div><div className={`status-badge ${session.state.status === 'tracking' ? 'good' : ''}`}><i />{displayStatus[session.state.status]}</div></div>
          <div className="camera-stage">
            <div className="camera-media"><video ref={session.videoRef} autoPlay muted playsInline aria-label="Live webcam preview" /><canvas ref={session.canvasRef} aria-label="Face landmark overlay" /></div>
            {!isActive && <div className="camera-empty"><div className="camera-empty-icon">{session.state.status === 'error' ? <CameraOff size={35} /> : <Camera size={35} />}</div><h2>{session.state.status === 'error' ? 'Camera needs attention' : 'Your mirror is ready'}</h2><p>{session.state.error || 'Allow camera access to start real-time face tracking. Your video stays on this device.'}</p><button className="light-button" onClick={session.start}>{session.state.status === 'error' ? 'Try again' : 'Enable camera'} <ArrowRight size={17} /></button></div>}
            {isActive && <><div className="camera-corner tl" /><div className="camera-corner tr" /><div className="camera-corner bl" /><div className="camera-corner br" /><div className="camera-overlay-info"><span className="rec-dot" /> {session.state.status === 'tracking' ? 'TRACKING FACE' : session.state.status === 'searching' ? 'POSITION YOUR FACE' : 'GETTING READY'}</div></>}
          </div>
          <div className="camera-controls"><div className="mode-switch" role="group" aria-label="Face overlay mode">{(['mesh', 'regions', 'off'] as OverlayMode[]).map(option => <button key={option} className={session.mode === option ? 'selected' : ''} onClick={() => session.setMode(option)} disabled={!isActive}>{option === 'mesh' ? 'Face mesh' : option === 'regions' ? 'Regions' : 'No overlay'}</button>)}</div><button className="end-button" onClick={session.stop} disabled={!isActive}><X size={16} /> End camera</button></div>
        </section>

        <aside className="insight-column"><div className="insight-card"><div className="insight-kicker"><ScanFace size={17} /> LIVE INSIGHTS</div><h3>Face intelligence</h3><p className="insight-intro">A look at what your camera is detecting right now.</p><div className="metric-row"><span><Eye size={17} /> Face status</span><strong className={session.state.status === 'tracking' ? 'positive' : ''}>{session.state.status === 'tracking' ? 'Detected' : session.state.status === 'searching' ? 'Searching' : 'Waiting'}</strong></div><div className="metric-row"><span><Focus size={17} /> Landmarks</span><strong>{session.state.landmarkCount || '—'}</strong></div><div className="metric-row"><span><Aperture size={17} /> Tracking rate</span><strong>{session.state.framesPerSecond ? `${session.state.framesPerSecond} fps` : '—'}</strong></div><div className="insight-tip"><span>✦</span><p>{session.state.status === 'tracking' ? 'Nice! Turn your head gently to see the mesh follow your features.' : 'Sit in even lighting and keep your face inside the camera frame.'}</p></div></div>
          <div className="insight-card mapping-card"><div className="insight-kicker"><Focus size={17} /> FACIAL MAPPING</div><h3>Mapped regions</h3><p className="insight-intro">Switch to “Regions” to see these live anchors.</p><div className="region-list">{['Eyes', 'Lips', 'Cheeks', 'Nose', 'Forehead', 'Jaw'].map(region => <div key={region}><span className="region-dot" />{region}<Check size={15} /></div>)}</div><small>Region markers are landmark anchors, not makeup detection.</small></div>
          <div className="privacy-card"><ShieldCheck size={20} /><div><strong>Your camera, your control.</strong><p>Tracking runs in your browser. No video is saved or uploaded by NEYA.</p></div></div>
        </aside></div>
      </main>}
    </div>
    {storageError && <div className="storage-warning" role="alert">Browser storage is full or unavailable. Your latest changes may not be saved.</div>}
    {menuOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
  </div>;
}

export default App;
