// Every sound is synthesized with the Web Audio API, so there are no files to load.
// The iPhone handling is copied from GGROBAR / Witch's Brew (see Witch's Brew's git history for why).
export const Sound = (() => {
  let ctx = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem('comets-cocoa-muted') === '1'; } catch {}

  const rand = (lo, hi) => lo + Math.random() * (hi - lo);

  function silentWavUrl() {
    const samples = 4410;
    const b = new DataView(new ArrayBuffer(44 + samples));
    const str = (o, s) => [...s].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); b.setUint32(4, 36 + samples, true); str(8, 'WAVE');
    str(12, 'fmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
    b.setUint32(24, 44100, true); b.setUint32(28, 44100, true); b.setUint16(32, 1, true); b.setUint16(34, 8, true);
    str(36, 'data'); b.setUint32(40, samples, true);
    for (let i = 0; i < samples; i++) b.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  }

  // iPhones silence Web Audio with the ring/silent switch unless the page is playing "media".
  let keepAlive = null;
  function asMedia() {
    try {
      if (navigator.audioSession) { navigator.audioSession.type = 'playback'; return; }
    } catch {}
    if (!/iPhone|iPad|iPod/.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent))) return;
    if (!keepAlive) {
      keepAlive = new Audio(silentWavUrl());
      keepAlive.loop = true;
      keepAlive.setAttribute('playsinline', '');
    }
    if (keepAlive.paused) keepAlive.play().catch(() => {});
  }

  // Browsers only allow audio after a tap or key press, so this runs on every one.
  function unlock() {
    asMedia();
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.6;
      master.connect(ctx.destination);
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    makeNoise();
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    src.connect(ctx.destination);
    src.start(0);
  }

  const ready = () => ctx && ctx.state === 'running' && !muted;

  function tone(freq, dur, { type = 'sine', vol = 0.15, to = null, at = 0, attack = 0.005 } = {}) {
    if (!ready()) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  let noiseBuf = null;
  function makeNoise() {
    if (noiseBuf || !ctx) return;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function noise(dur, { vol = 0.15, filter = 'lowpass', freq = 1000, to = null, q = 1, at = 0 } = {}) {
    if (!ready()) return;
    makeNoise();
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // A little bell: a few inharmonic partials that ring out.
  function bell(freq, at = 0, vol = 0.06, dur = 0.5) {
    tone(freq, dur, { at, vol });
    tone(freq * 2.76, dur * 0.6, { at, vol: vol * 0.5 });
    tone(freq * 5.4, dur * 0.3, { at, vol: vol * 0.25 });
  }

  return {
    unlock,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('comets-cocoa-muted', muted ? '1' : '0'); } catch {}
      if (master) master.gain.value = muted ? 0 : 0.6;
      return muted;
    },
    tap() { tone(rand(700, 800), 0.05, { vol: 0.05, type: 'triangle' }); },
    clink() { bell(rand(1900, 2200), 0, 0.04, 0.25); },
    // Pouring: a short gurgle, repeated while you hold Pour.
    pour() { noise(0.18, { vol: 0.07, filter: 'bandpass', freq: rand(300, 500), to: rand(600, 900), q: 4 }); },
    spill() {
      noise(0.5, { vol: 0.16, filter: 'lowpass', freq: 1400, to: 200 });
      tone(400, 0.4, { to: 120, vol: 0.06, type: 'triangle' });
    },
    plop() { const f = rand(380, 460); tone(f, 0.09, { to: f * 1.8, vol: 0.08, type: 'sine' }); },
    squirt() { noise(0.25, { vol: 0.08, filter: 'highpass', freq: 2500, to: 1200 }); },
    shake() { for (let i = 0; i < 4; i++) noise(0.04, { vol: 0.06, filter: 'bandpass', freq: 5000, q: 2, at: i * 0.06 }); },
    splash() { noise(0.4, { vol: 0.12, filter: 'bandpass', freq: 1200, to: 300, q: 0.8 }); },
    drain() { noise(0.7, { vol: 0.1, filter: 'bandpass', freq: 600, to: 250, q: 1 }); },
    ready() { bell(1568, 0, 0.05, 0.4); bell(2093, 0.12, 0.05, 0.5); },
    trash() { noise(0.15, { vol: 0.1, freq: 700, to: 200 }); tone(200, 0.15, { to: 90, vol: 0.06, type: 'triangle' }); },
    arrive() { bell(1319, 0, 0.04, 0.4); bell(1047, 0.1, 0.04, 0.5); },
    perfect() { [1047, 1319, 1568, 2093].forEach((f, i) => bell(f, i * 0.07, 0.05, 0.5)); },
    good() { bell(1319, 0, 0.05, 0.4); bell(1568, 0.1, 0.05, 0.5); },
    bad() { [330, 262].forEach((f, i) => tone(f, 0.22, { vol: 0.06, at: i * 0.15, type: 'triangle' })); },
    wrong() { tone(260, 0.2, { to: 200, vol: 0.06, type: 'square' }); },
    grumble() { tone(180, 0.18, { to: 140, vol: 0.05, type: 'sawtooth' }); tone(150, 0.2, { to: 120, vol: 0.04, type: 'triangle', at: 0.14 }); },
    leave() { tone(392, 0.3, { to: 196, vol: 0.06, type: 'triangle' }); },
    dayStart() { for (let i = 0; i < 8; i++) { const f = rand(2600, 3400); tone(f, 0.15, { at: i * 0.09, vol: 0.03 }); } },
    dayWon() { [523, 659, 784, 1047].forEach((f, i) => bell(f, i * 0.15, 0.07, 0.8)); },
    dayLost() { [523, 440, 349, 262].forEach((f, i) => tone(f, 0.4, { vol: 0.07, at: i * 0.25, type: 'triangle' })); },
  };
})();
