/* ONWARD — Web Audio synthesiser. No audio files; nothing sampled.
 * The chimes are original figures written in each region's idiom. The UK chime uses
 * the opening of the Westminster Quarters (1793, public domain). Operator sound logos
 * (SNCF, SBB, JR departure melodies) are not reproduced.
 */
(function () {
  let ctx = null, master = null, verb = null, roomTone = null;
  let muted = true;
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  const NOTE = { C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83, C6: 84, Bb4: 70, Eb5: 75, Ab4: 68 };

  function impulse(seconds, decay) {
    const len = ctx.sampleRate * seconds, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    verb = ctx.createConvolver(); verb.buffer = impulse(3.2, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.35; verb.connect(wet); wet.connect(master);
  }

  /** Bell-ish tone: fundamental + inharmonic partials with exponential decay. */
  function bell(freq, t, dur = 2.2, vol = 0.22, partials = [[1, 1], [2.01, 0.35], [3.0, 0.12], [4.2, 0.06]]) {
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master); g.connect(verb);
    for (const [ratio, amp] of partials) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq * ratio; og.gain.value = amp;
      o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  function vibes(freq, t, dur = 2.6, vol = 0.2) { bell(freq, t, dur, vol, [[1, 1], [4, 0.18], [10.1, 0.04]]); }
  function pip(freq, t, dur = 0.09, vol = 0.12, type = 'square') {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = 3200;
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function click(t, vol = 0.18, tone = 1800, len = 0.012) {
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = tone; f.Q.value = 1.2; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const seq = (notes, step, fn, t0) => notes.forEach((n, i) => n && fn(N(NOTE[n]), t0 + i * step));

  const CUES = {
    'uk-rail': { announce: t => { seq(['E4', 'C4', 'D4', 'G3'], 0.62, (f, t) => bell(f, t, 2.4, 0.2), t); }, update: t => { click(t, 0.12, 900); click(t + 0.05, 0.08, 700); } },
    'us-airport': { announce: t => seq(['F4', 'A4', 'C5'], 0.5, (f, t) => bell(f, t, 2.6, 0.18, [[1, 1], [2, 0.25], [3, 0.08]]), t) },
    'jp-rail': {
      station: t => seq(['E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5', 'D5', 'E5', 'G5', 'E5', null, 'C5', 'D5', 'E5'], 0.16, (f, t) => pip(f, t, 0.14, 0.07, 'triangle'), t),
      update: t => { pip(1975, t, 0.05, 0.05); pip(1975, t + 0.12, 0.05, 0.05); }
    },
    'eu-rail': { announce: t => seq(['G4', 'E4', 'C4'], 0.55, (f, t) => vibes(f, t), t) },
    'nl-rail': { announce: t => seq(['C5', 'G4'], 0.6, (f, t) => vibes(f, t, 2.2, 0.18), t) },
    'de-rail': { announce: t => seq(['A4', 'F4', 'D4'], 0.42, (f, t) => bell(f, t, 2.0, 0.17), t) },
    'fr-rail': { announce: t => seq(['F4', 'A4', 'C5', 'F5'], 0.26, (f, t) => vibes(f, t, 2.4, 0.15), t) },
    'es-rail': { announce: t => seq(['C5', 'E5', 'G5', 'C5'], 0.3, (f, t) => bell(f, t, 1.8, 0.15), t) },
    'us-rail': { announce: t => seq(['C5', 'A4', 'F4'], 0.45, (f, t) => bell(f, t, 2.2, 0.17), t) },
    'solari-flap': {},
    'uk-airport': { announce: t => seq(['E5', 'C5'], 0.55, (f, t) => bell(f, t, 2.4, 0.17), t) },
    'nl-airport': { announce: t => seq(['G4', 'C5', 'E5'], 0.38, (f, t) => vibes(f, t, 2.4, 0.15), t) },
    'jp-airport': { announce: t => seq(['C5', 'E5', 'G5', 'C6'], 0.22, (f, t) => vibes(f, t, 2.0, 0.13), t) },
    'hk-airport': { announce: t => seq(['G4', 'D5', 'B4'], 0.42, (f, t) => bell(f, t, 2.2, 0.15), t) },
    'sg-airport': { announce: t => seq(['A4', 'C#5', 'E5'].map(n => n === 'C#5' ? 'D5' : n), 0.4, (f, t) => vibes(f, t, 2.4, 0.15), t) },
    'de-airport': { announce: t => seq(['A4', 'E5'], 0.5, (f, t) => bell(f, t, 2.0, 0.15), t) }
  };

  function flapClatter(chars) {
    const t0 = ctx.currentTime + 0.02, n = Math.min(chars, 160);
    for (let i = 0; i < n; i++) {
      const t = t0 + i * 0.035 + Math.random() * 0.012;
      click(t, 0.10 + Math.random() * 0.06, 2400 + Math.random() * 1600, 0.008);
      if (Math.random() < 0.4) click(t + 0.018, 0.05, 1200, 0.006);
    }
  }

  function startRoom() {
    if (roomTone) return;
    const len = ctx.sampleRate * 6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) { /* Paul Kellet pink-noise filter */
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.3;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.045; lfoG.gain.value = 0.06;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(master); g.connect(verb);
    src.start(); lfo.start();
    g.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 3);
    roomTone = { src, g, lfo };
  }
  function stopRoom() {
    if (!roomTone) return;
    const r = roomTone; roomTone = null;
    r.g.gain.cancelScheduledValues(ctx.currentTime);
    r.g.gain.setValueAtTime(r.g.gain.value, ctx.currentTime);
    r.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => { try { r.src.stop(); r.lfo.stop(); } catch (e) { } }, 1700);
  }

  window.AudioEngine = {
    unlock,
    get muted() { return muted; },
    setMuted(m) { muted = m; if (!m) unlock(); if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.05); if (m) stopRoom(); else if (window.ONWARD_SETTINGS && window.ONWARD_SETTINGS.roomTone) startRoom(); },
    setRoomTone(on) { if (!ctx || muted) return; on ? startRoom() : stopRoom(); },
    cue(theme, kind, arg) {
      if (muted || !ctx) return;
      if (theme === 'solari-flap' && kind === 'flap') return flapClatter(arg || 20);
      const c = CUES[theme] || {};
      const fn = c[kind] || (kind === 'station' ? c.announce : null);
      if (fn) fn(ctx.currentTime + 0.05);
    }
  };
})();
