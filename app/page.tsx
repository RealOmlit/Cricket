'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, CircleHelp, Crosshair, Flag, Maximize, Pause, Play, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { createGame, type GameController, type GameEvent } from '@/lib/cricket-game';

export default function Home() {
  const mount = useRef<HTMLDivElement>(null), game = useRef<GameController | null>(null), meter = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [started, setStarted] = useState(false), [paused, setPaused] = useState(false), [help, setHelp] = useState(false), [muted, setMuted] = useState(false), [loft, setLoft] = useState(false), [direction, setDirection] = useState(0), [camera, setCamera] = useState(false);
  const [state, setState] = useState<GameEvent>({ runs: 0, wickets: 0, balls: 0, history: [], phase: 'ready', message: 'Make every ball count.', detail: '24 runs. 12 balls. Your moment.', speed: 0, timing: '', best: 0 });
  useEffect(() => {
    let disposed = false;
    createGame(mount.current!, (event) => { if (!disposed) setState(event); }, (v) => { if (meter.current) meter.current.style.left = `${Math.min(100, v * 100)}%`; })
      .then((g) => { if (disposed) g.destroy(); else { game.current = g; setReady(true); } })
      .catch(() => setError('The 3D stadium could not load. Enable WebGL in your browser and reload to play.'));
    return () => { disposed = true; game.current?.destroy(); };
  }, []);
  const start = () => { game.current?.start(); setStarted(true); setPaused(false); setLoft(false); setDirection(0); };
  const togglePause = () => { if (!started || state.phase === 'over') return; setPaused(p => { game.current?.pause(!p); return !p; }); };
  const aim = (d: number) => { const n = Math.max(-2, Math.min(2, d)); setDirection(n); game.current?.aim(n); };
  const shot = (l: boolean) => { setLoft(l); game.current?.loft(l); };
  const changeCamera = () => { setCamera(c => { game.current?.camera(!c); return !c; }); };
  const showHelp = (open: boolean) => { setHelp(open); if (started && state.phase !== 'over') { setPaused(open); game.current?.pause(open); } };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (help || (e.target instanceof HTMLElement && ['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))) return;
      if (['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      if (e.code === 'Space') { if (!started) { if (ready) start(); } else if (!paused) game.current?.swing(); }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') aim(direction - 1);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') aim(direction + 1);
      if (e.code === 'KeyL' || e.code === 'ArrowUp') shot(!loft);
      if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
      if (e.code === 'KeyC') changeCamera();
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });
  const remaining = 12 - state.balls, needed = Math.max(0, 24 - state.runs), done = state.phase === 'over';
  return <main className="cricket-app">
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Cricket Masters home"><span className="brand-mark">CM<span>✦</span></span><span>CRICKET <b>MASTERS</b></span></Link>
      <div className="topnav"><span className="active"><span className="live-dot"/> PLAY</span><span className="edition">THE CHASE SERIES <span>01</span></span></div>
      <button className="icon-button" onClick={() => showHelp(true)} aria-label="How to play"><CircleHelp size={19}/><span>How to play</span></button>
    </header>
    <div className="game-layout">
      <section className="arena" aria-label="3D cricket stadium">
        <div ref={mount} className="canvas-mount"/><div className="arena-shade"/>
        <div className="venue"><span className="live-dot"/> MASTERS OVAL <span className="venue-separator">/</span><span> DAY MATCH</span></div>
        <div className="view-tools"><button className="glass-button" onClick={changeCamera} title="Change camera (C)"><Crosshair size={16}/><span>{camera ? 'Broadcast' : 'Batting'} view</span></button><button className="glass-button square" aria-label={muted ? 'Enable sound' : 'Mute sound'} onClick={() => setMuted(m => { game.current?.mute(!m); return !m; })}>{muted ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button><button className="glass-button square fullscreen" aria-label="Full screen" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); }}><Maximize size={16}/></button></div>
        {!started && <div className="intro"><div className="eyebrow"><span/> THE TWO-OVER CHALLENGE</div><h1>CHASE THE<br/><em>MOMENT.</em></h1><p>The field is set. The crowd is waiting.<br/>Chase 24 in 12 balls and make it yours.</p><button className="primary start-button" onClick={start} disabled={!ready}>{ready ? 'Step onto the pitch' : 'Preparing the stadium…'}<ArrowUpRight size={21}/></button>{error ? <p className="load-error">{error}</p> : <div className="intro-meta"><span>3D MATCHPLAY</span><i/> KEYBOARD + TOUCH</div>}</div>}
        {started && !done && <><div className="onfield-score"><span>YOU <b>{state.runs}<i>/{state.wickets}</i></b></span><span className="score-overs">{Math.floor(state.balls / 6)}.{state.balls % 6}<small> / 2 OV</small></span></div><div className={`ball-call ${state.phase === 'result' ? 'result-call' : ''}`} aria-live="polite"><span className="eyebrow">{state.phase === 'delivery' ? 'WATCH THE BALL' : state.phase === 'flight' ? 'BALL IN PLAY' : 'AT THE CREASE'}</span><h2>{state.message}</h2><p>{state.detail}</p></div><button className="pause-button glass-button square" aria-label={paused ? 'Resume match' : 'Pause match'} onClick={togglePause}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button></>}
        {paused && !help && <div className="pause-overlay"><span className="eyebrow">TAKE A BREATHER</span><h2>Match paused</h2><button className="primary" onClick={togglePause}><Play size={18}/> Back to the crease</button></div>}
        {done && <div className="finish-overlay"><div className="finish-card"><Trophy size={35}/><span className="eyebrow">{needed === 0 ? 'CHASE COMPLETE' : 'INNINGS COMPLETE'}</span><h2>{needed === 0 ? 'Moment mastered.' : 'One more innings?'}</h2><div className="finish-score">{state.runs}<span>/{state.wickets}</span></div><p>{needed === 0 ? `You won with ${remaining} ${remaining === 1 ? 'ball' : 'balls'} to spare.` : `${needed} ${needed === 1 ? 'run' : 'runs'} short of the target. Time your next shot in the green zone.`}</p><button className="primary" onClick={start}><RotateCcw size={17}/> Play again</button></div></div>}
        <div className="arena-bottom"><span><span className="weather-sun">☀</span> 24° <i/> DRY PITCH</span><span>CRICKET MASTERS <b>™</b></span></div>
      </section>
      <aside className="match-panel">
        <div className="panel-heading"><span>MATCH CENTRE</span><span className="live-badge"><i/> {started && !done ? 'LIVE' : done ? 'FINAL' : 'READY'}</span></div>
        <div className="competition">MASTERS CHALLENGE <span>•</span> 2 OVERS</div>
        <div className="team"><span className="team-icon home">M</span><div><h3>Masters XI</h3><span>YOU · BATTING</span></div><strong>{state.runs}<small>/{state.wickets}</small></strong></div>
        <div className="team opponent"><span className="team-icon away">R</span><div><h3>Royals XI</h3><span>INNINGS COMPLETE</span></div><strong>23<small>/2</small></strong></div>
        <div className="chase-box"><div><Flag size={15}/><span>TARGET</span><strong>24</strong></div><p>{done ? needed === 0 ? 'A chase to remember.' : 'The Royals take this one.' : <><b>{needed} runs</b> needed from <b>{remaining} balls</b></>}</p><div className="chase-track"><div style={{width:`${Math.min(100, state.runs / 24 * 100)}%`}}/></div></div>
        <div className="match-stats"><div><span>OVERS</span><strong>{Math.floor(state.balls / 6)}.{state.balls % 6}<small> / 2</small></strong></div><div><span>REQ. RATE</span><strong>{remaining && needed ? (needed * 6 / remaining).toFixed(2) : '—'}</strong></div></div>
        <div className="over-section"><div className="section-label">{done ? 'LAST OVER' : 'THIS OVER'}<span>{Math.min(2, Math.floor(state.balls / 6) + 1)} OF 2</span></div><div className="ball-history">{Array.from({length:6},(_,i) => { const offset = state.balls > 6 ? 6 : 0, b=state.history[offset+i]; return <span key={i} className={b === undefined ? 'empty-ball' : b==='W' ? 'wicket-ball' : Number(b)>=4 ? 'boundary-ball' : 'played-ball'}>{b === undefined ? '·' : b}</span>; })}</div></div>
        <div className="bowler-info"><div className="section-label">AT THE OTHER END</div><h3>A. Mitchell <span>RFM</span></h3><p>Right-arm fast medium</p><div className="speed"><strong>{state.speed || '—'}</strong><span>km/h<br/>LAST DELIVERY</span></div></div>
        <div className="tip"><span className="tip-icon">✦</span><div><h4>Find the gap.</h4><p>A well-timed ground shot is safer. Go lofted when you need the boundary.</p></div></div>
        <div className="personal-best"><Trophy size={15}/><span>PERSONAL BEST</span><b>{state.best} runs</b></div>
      </aside>
    </div>
    <footer className="controls">
      <div className="aim-controls"><div className="control-label">SHOT DIRECTION <span>A / D</span></div><div className="aim-row"><button aria-label="Aim left" onClick={() => aim(direction-1)} disabled={direction===-2}><ChevronLeft size={18}/></button><span>{['Cover','Extra cover','Straight','Mid-wicket','Square leg'][direction+2]}</span><button aria-label="Aim right" onClick={() => aim(direction+1)} disabled={direction===2}><ChevronRight size={18}/></button></div></div>
      <div className="shot-controls"><div className="control-label">SHOT TYPE <span>L</span></div><div className="shot-buttons"><button className={!loft?'selected':''} onClick={() => shot(false)}>Ground</button><button className={loft?'selected':''} onClick={() => shot(true)}>Lofted <ArrowUpRight size={14}/></button></div></div>
      <div className="timing-controls"><div className="control-label">{state.timing || 'TIMING IS EVERYTHING'}<span>HIT IN THE GREEN</span></div><div className="timing-track"><div className="perfect-zone"/><div className="timing-pointer" ref={meter}/></div><div className="timing-labels"><span>EARLY</span><span>PERFECT</span><span>LATE</span></div></div>
      <button className="primary swing-button" disabled={!started || paused || state.phase !== 'delivery'} onClick={() => game.current?.swing()}><span>Play shot</span><kbd>SPACE</kbd></button>
    </footer>
    <Dialog open={help} onOpenChange={showHelp}><DialogContent className="help-dialog"><DialogTitle>Own the crease.</DialogTitle><DialogDescription>Chase 24 runs in two overs. Ten wickets stand between you and the Royals.</DialogDescription><div className="help-steps"><p><kbd>A</kbd><kbd>D</kbd><span>Aim at a gap between fielders. Arrow keys work too.</span></p><p><kbd>L</kbd><span>Switch between a safe ground shot and an attacking lofted shot.</span></p><p><kbd>SPACE</kbd><span>Swing when the marker reaches the green zone. Touch players: tap Play shot.</span></p><p><kbd>P</kbd><span>Pause or resume. Press C to change your camera.</span></p></div><p className="help-note">Boundaries score 4, or 6 before the first bounce. Fielders chase and catch the ball. Runs between wickets are automatic. An early or late swing can cost your wicket.</p><button className="primary" onClick={() => showHelp(false)}>Got it. Let&apos;s play.<ArrowUpRight size={18}/></button></DialogContent></Dialog>
  </main>;
}

