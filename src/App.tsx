import { useEffect, useRef, useState } from 'react';
import {
  Aperture, ArrowRight, Bookmark, ChevronDown, CircleHelp, Focus, LayoutGrid, Menu, ScanFace, Settings2, ShieldCheck, Sparkles,
} from 'lucide-react';
import heroPortrait from './assets/hero-portrait.png';
import { ExplorePage } from './ExplorePage';
import { CollectionPage } from './CollectionPage';
import { ProfilePage } from './ProfilePage';
import { SavedLooksPage } from './SavedLooksPage';
import { clearBeautyData, emptyData, loadBeautyData, saveBeautyData, type BeautyData, type SavedLook } from './data/beauty';
import { cloud, cloudSafeData, isBeautyData, mergeBeautyData } from './cloud';

function App() {
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

  const openStudio = () => { setView('studio'); setMenuOpen(false); };
  const navigate = (next: typeof view) => { setView(next); setMenuOpen(false); };
  const backHome = () => { setView('dashboard'); setMenuOpen(false); };
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
        <button className={`nav-item ${view === 'studio' ? 'active' : ''}`} onClick={openStudio}><ScanFace size={18} /> Live makeup <span className="nav-live" /></button>
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
        <div className="breadcrumb">YOUR SPACE <span>/</span> <strong>{({ dashboard: 'DASHBOARD', studio: 'LIVE MAKEUP', explore: 'EXPLORE LOOKS', collection: 'MY COLLECTION', profile: 'BEAUTY PROFILE', looks: 'SAVED LOOKS' } as const)[view]}</strong></div>
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
          <button className="feature-card available" onClick={openStudio}><div className="feature-icon coral"><ScanFace size={25} /></div><div className="feature-label"><span>01 · LIVE MAKEUP</span><ArrowRight size={19} /></div><h3>Start live makeup</h3><p>Open your camera, try products on your moving face, and switch shades as you go.</p><div className="feature-foot">OPEN LIVE STUDIO <ArrowRight size={15} /></div></button>
          <button className="feature-card available" onClick={() => navigate('explore')}><div className="feature-icon lilac"><Sparkles size={25} /></div><div className="feature-label"><span>02 · VIRTUAL STUDIO</span><ArrowRight size={19} /></div><h3>Try on looks</h3><p>Preview shades and complete looks right on your face.</p><div className="feature-foot">EXPLORE LOOKS <ArrowRight size={15} /></div></button>
          <button className="feature-card available" onClick={() => navigate('collection')}><div className="feature-icon peach"><Aperture size={25} /></div><div className="feature-label"><span>03 · YOUR PRODUCTS</span><ArrowRight size={19} /></div><h3>My collection</h3><p>Bring your favorite products together in one personal beauty space.</p><div className="feature-foot">OPEN COLLECTION <ArrowRight size={15} /></div></button>
        </div>
        <div id="about-phase" className="foundation-strip"><div className="strip-icon"><Focus size={21} /></div><div><strong>Your space is taking shape.</strong><p>Try-on and collection tools work now. Sign in under Beauty Profile for free cloud sync. AI services are off to avoid billing.</p></div><span>NEYA STUDIO</span></div>
      </main> : view === 'explore' || view === 'studio' ? <ExplorePage key={view} autoCamera={view === 'studio'} data={beauty} onSaveLook={look => setBeauty(previous => ({ ...previous, looks: [look, ...previous.looks] }))} onAddProduct={product => setBeauty(previous => ({ ...previous, products: [product, ...previous.products] }))} initialLook={initialLook} onClearInitialLook={() => setInitialLook(null)} /> : view === 'collection' ? <CollectionPage products={beauty.products} onChange={products => setBeauty(previous => ({ ...previous, products }))} /> : view === 'profile' ? <ProfilePage data={beauty} onChange={profile => setBeauty(previous => ({ ...previous, profile }))} onDeleteAll={deleteAll} cloudConnected={cloudReady} cloudAvailable={Boolean(cloud)} accountEmail={cloudUser?.email} onSignIn={signIn} onSignOut={signOut} cloudError={cloudError} /> : view === 'looks' ? <SavedLooksPage looks={beauty.looks} onOpen={openLook} onChange={looks => setBeauty(previous => ({ ...previous, looks }))} /> : null}
    </div>
    {storageError && <div className="storage-warning" role="alert">Browser storage is full or unavailable. Your latest changes may not be saved.</div>}
    {menuOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
  </div>;
}

export default App;
