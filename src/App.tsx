import { useState } from 'react';
import {
  Aperture, ArrowRight, Camera, CameraOff, Check, ChevronDown, CircleHelp,
  Eye, Focus, LayoutGrid, LockKeyhole, Menu, ScanFace, Settings2, ShieldCheck,
  Sparkles, Video, X,
} from 'lucide-react';
import { useFaceSession } from './hooks/useFaceSession';
import type { OverlayMode } from './vision/drawFace';

const displayStatus = {
  idle: 'Camera off', requesting: 'Requesting access', 'loading-model': 'Loading face tracker',
  searching: 'Looking for your face', tracking: 'Face tracking active', error: 'Camera needs attention',
};

function App() {
  const session = useFaceSession();
  const [view, setView] = useState<'dashboard' | 'studio'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = !['idle', 'error'].includes(session.state.status);

  const openStudio = () => { setView('studio'); setMenuOpen(false); };
  const backHome = () => { session.stop(); setView('dashboard'); setMenuOpen(false); };

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
        <button className="nav-item unavailable" disabled title="Available in a later phase"><Sparkles size={18} /> Explore looks <span>SOON</span></button>
      </nav>
      <div className="sidebar-caption tools-caption">YOUR TOOLS</div>
      <nav aria-label="Future tools" className="nav-list">
        <button className="nav-item unavailable" disabled><Aperture size={18} /> My collection <span>SOON</span></button>
        <button className="nav-item unavailable" disabled><Settings2 size={18} /> Beauty profile <span>SOON</span></button>
      </nav>
      <div className="sidebar-bottom">
        <div className="privacy-note"><ShieldCheck size={19} /><div><strong>Privacy comes first</strong><p>Camera frames stay on your device during tracking.</p></div></div>
        <div className="avatar-line"><div className="avatar">N</div><div><strong>Welcome to NEYA</strong><small>Phase 1 · Face intelligence</small></div><ChevronDown size={15} /></div>
      </div>
    </aside>

    <div className="main-column">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={22} /></button>
        <div className="breadcrumb">YOUR SPACE <span>/</span> <strong>{view === 'dashboard' ? 'DASHBOARD' : 'FACE STUDIO'}</strong></div>
        <div className="topbar-right"><span className="phase-pill"><span /> PHASE 1 FOUNDATION</span><button className="help-button" title="About Phase 1" onClick={() => document.getElementById('about-phase')?.scrollIntoView({ behavior: 'smooth' })}><CircleHelp size={19} /></button></div>
      </header>

      {view === 'dashboard' ? <main className="page dashboard">
        <div className="welcome-line"><span>YOUR PERSONAL BEAUTY SPACE</span><span>✦ &nbsp; MADE FOR YOUR FACE</span></div>
        <section className="hero">
          <div className="hero-content"><div className="eyebrow"><Sparkles size={14} /> THE BEAUTY OF BEING YOU</div><h1>Meet your<br /><em>personal</em> makeup artist.</h1><p>Discover what works for your face, starting with precise, real-time face tracking.</p><button className="primary-button" onClick={openStudio}>Open face studio <ArrowRight size={18} /></button><div className="hero-foot"><span className="star">✳</span> A more personal way to do makeup starts here.</div></div>
          <div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-face"><div className="art-hair" /><div className="art-neck" /><div className="art-head"><i className="art-brow left" /><i className="art-brow right" /><i className="art-eye left" /><i className="art-eye right" /><i className="art-nose" /><i className="art-mouth" /></div></div><div className="art-spark one">✦</div><div className="art-spark two">✧</div><div className="art-tag tag-one">FACE MAPPING</div><div className="art-tag tag-two">REAL-TIME TRACKING</div></div>
        </section>

        <section className="section-head"><div><div className="section-kicker">LET'S BEGIN</div><h2>What would you like to do?</h2></div><span>YOUR JOURNEY, YOUR WAY</span></section>
        <div className="feature-grid">
          <button className="feature-card available" onClick={openStudio}><div className="feature-icon coral"><ScanFace size={25} /></div><div className="feature-label"><span>01 · AVAILABLE NOW</span><ArrowRight size={19} /></div><h3>Start face tracking</h3><p>Open your camera and see a live face mesh that moves with you.</p><div className="feature-foot">OPEN STUDIO <ArrowRight size={15} /></div></button>
          <div className="feature-card future"><div className="feature-icon lilac"><Sparkles size={25} /></div><div className="feature-label"><span>02 · COMING NEXT</span><LockKeyhole size={16} /></div><h3>Try on looks</h3><p>Preview shades, techniques and complete looks right on your face.</p><div className="feature-foot muted">PHASE 2</div></div>
          <div className="feature-card future"><div className="feature-icon peach"><Aperture size={25} /></div><div className="feature-label"><span>03 · COMING LATER</span><LockKeyhole size={16} /></div><h3>My collection</h3><p>Bring your favorite products together in one personal beauty space.</p><div className="feature-foot muted">FUTURE PHASE</div></div>
        </div>
        <div id="about-phase" className="foundation-strip"><div className="strip-icon"><Focus size={21} /></div><div><strong>We're starting with the foundation.</strong><p>Phase 1 focuses on camera access, live facial landmarks and region mapping. Makeup previews and AI guidance arrive in later phases.</p></div><span>PHASE 01 / 06</span></div>
      </main> : <main className="page studio-page">
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
    {menuOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
  </div>;
}

export default App;
