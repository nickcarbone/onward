/* ONWARD — app shell: hub selection, polling, HUD, auto-roam, audio cues. */
(function () {
  const U = window.CU, R = window.Renderers, A = window.AudioEngine;
  const HUBS = window.ONWARD_HUBS;
  const SKEY = 'onward.settings';
  const DEFAULTS = { rdmKey: '', rdmUrl: '', adbKey: '', airlabsKey: '', avstackKey: '', flightBudget: 100, hub: 'PAD', roam: 0, rush: true, sound: false, roomTone: false, airlineLogos: true };
  const S = window.ONWARD_SETTINGS = Object.assign({}, DEFAULTS, U.load(SKEY, {}));
  const persist = () => U.save(SKEY, S);

  const POLL = { darwin: 60e3, sbb: 60e3, transitous: 120e3, flights: 60e3 };
  const board = document.getElementById('board');
  const badge = document.getElementById('badge');
  const sel = document.getElementById('hubSelect');

  let hub = null, rows = [], meta = null, pollTimer = null, gen = 0, lastChime = 0, failCount = 0;

  /* ── Hub selector ────────────────────────────────────────────────────── */
  const byCountry = {};
  HUBS.forEach(h => (byCountry[h.country] = byCountry[h.country] || []).push(h));
  sel.innerHTML = Object.entries(byCountry).map(([c, hs]) => `<optgroup label="${U.esc(c)}">${hs.map(h => `<option value="${h.id}">${U.esc(h.name)}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => selectHub(sel.value));

  function selectHub(id, opts = {}) {
    const next = HUBS.find(h => h.id === id) || HUBS[0];
    const myGen = ++gen;
    clearTimeout(pollTimer);
    board.classList.add('swap');
    setTimeout(() => {
      if (myGen !== gen) return;
      hub = next; rows = []; meta = null; failCount = 0;
      S.hub = hub.id; persist();
      sel.value = hub.id;
      if (location.hash.slice(1) !== hub.id) history.replaceState(null, '', '#' + hub.id);
      document.body.dataset.theme = hub.theme;
      board.classList.remove('lang-en');
      R.build(board, hub);
      R.tickClock(board.querySelector('.bh-clock'), hub, new Date());
      setBadge('loading');
      board.classList.remove('swap');
      A.cue(hub.theme, 'station');
      poll(myGen);
    }, opts.instant ? 0 : 450);
  }

  /* ── Polling ─────────────────────────────────────────────────────────── */
  async function poll(myGen) {
    if (myGen !== gen) return;
    const h = hub;
    let delay = POLL[(h.sources[0] || {}).type] || 120e3;
    try {
      const res = await window.Sources.fetchHub(h);
      if (myGen !== gen) return;
      rows = res.rows; meta = res.meta; failCount = 0;
      delay = POLL[meta.type] || delay;
      if (h.theme === 'uk-rail') await fillCalling(rows);
      render(true);
    } catch (e) {
      if (myGen !== gen) return;
      failCount++;
      const all = (e.all || [e.message]).join(' ');
      const reason = /no flight-data key/.test(all) ? 'nokey' : /budget/.test(all) ? 'budget' : 'down';
      console.warn('[onward]', h.id, all);
      /* Keep showing the last good board through a single failed poll. */
      if (!rows.length || failCount > 1 || reason !== 'down') {
        rows = []; meta = null;
        R.disruption(board, h, reason);
        setBadge('nofeed', reason === 'nokey' ? 'NO KEY · airport data' : reason === 'budget' ? 'BUDGET SPENT' : 'NO FEED');
      }
      delay = reason === 'down' ? Math.min(30e3 * failCount, 180e3) : 300e3;
    }
    pollTimer = setTimeout(() => poll(myGen), delay);
  }

  async function fillCalling(list) {
    for (const r of list.slice(0, 2)) {
      if (r.calling && r.calling.length) continue;
      try { r.calling = await window.Sources.transitousCalling(r); } catch (e) { r.calling = []; }
    }
  }

  function render(fresh) {
    if (!hub || !meta) return;
    const now = Date.now();
    const visible = rows.filter(r => (r.exp || r.sched) > now - 60e3);
    const ev = R.update(board, hub, visible, meta);
    if (fresh) setBadgeFromMeta();
    cue(ev);
  }

  function cue(ev) {
    const now = Date.now(), t = hub.theme;
    const can = gap => now - lastChime > gap;
    const th = R.THEMES[t];
    if (th.flaps) { if (ev.flapped) A.cue('solari-flap', 'flap', ev.flapped); if (!th.airport) return; }
    if (th.airport) { if (ev.boarding && can(60e3)) { A.cue(t, 'announce'); lastChime = now; } return; }
    if (t === 'jp-rail') { if (ev.newFirst) A.cue(t, 'update'); return; }
    if (t === 'uk-rail' && ev.newFirst && can(90e3)) { A.cue(t, 'announce'); lastChime = now; setTimeout(() => A.cue(t, 'update'), 2600); return; }
    if (ev.platformChange && can(60e3)) { A.cue(t, 'announce'); lastChime = now; return; }
    if (ev.newFirst && can(300e3)) { A.cue(t, 'announce'); lastChime = now; }
  }

  /* ── Badge ───────────────────────────────────────────────────────────── */
  function setBadge(kind, text, href) {
    badge.className = kind;
    badge.querySelector('.txt').textContent = text || (kind === 'loading' ? 'CONNECTING…' : '');
    badge.href = href || 'https://transitous.org/sources/';
  }
  function setBadgeFromMeta() {
    if (!meta) return;
    if (meta.cached) return setBadge('timetable', `CACHED ${U.hm(meta.cachedAt, hub.tz)} · ${meta.source} · ${meta.usage}/${meta.budget} calls`);
    if (R.THEMES[hub.theme].airport) return setBadge('live', `LIVE API · ${meta.source} · ${meta.usage}/${meta.budget} calls`);
    if (meta.live) return setBadge('live', `LIVE · ${meta.source}`, meta.sourceUrl);
    if (meta.partialLive) return setBadge('timetable', `TIMETABLE + SOME LIVE · ${meta.source}`, meta.sourceUrl);
    return setBadge('timetable', `TIMETABLE · ${meta.source}`, meta.sourceUrl);
  }

  /* ── Ticks: clock every frame-second, re-render every 20 s, JP language swap every 6 s ── */
  let lastSec = -1, lastRender = Date.now();
  (function frame() {
    const now = new Date();
    if (hub) {
      const clock = board.querySelector('.bh-clock');
      if (clock && (clock.classList.contains('clock-analog') || now.getSeconds() !== lastSec)) { R.tickClock(clock, hub, now); lastSec = now.getSeconds(); }
      if (Date.now() - lastRender > 20e3) { lastRender = Date.now(); if (meta) render(false); }
    }
    requestAnimationFrame(frame);
  })();
  setInterval(() => {
    if (!hub) return;
    if (hub.theme === 'jp-rail') board.classList.toggle('lang-en');
    const langs = R.THEMES[hub.theme].langs;
    if (langs && langs.length > 1) board.dataset.li = String(((+board.dataset.li || 0) + 1) % langs.length);
  }, 6000);
  window.addEventListener('resize', () => { if (meta) { if (R.THEMES[hub.theme].flaps) board.querySelector('.rows').innerHTML = ''; render(false); } });

  /* ── HUD auto-hide ───────────────────────────────────────────────────── */
  let idleTimer;
  function wake() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (!document.getElementById('settings').classList.contains('open') && !document.querySelector('#hud :focus')) document.body.classList.add('idle'); }, 4000);
  }
  ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, wake, { passive: true }));
  wake();

  /* ── Audio controls (first click unlocks Web Audio) ─────────────────── */
  const soundBtn = document.getElementById('soundBtn'), roomBtn = document.getElementById('roomBtn');
  function syncAudioButtons() {
    soundBtn.setAttribute('aria-pressed', String(S.sound)); soundBtn.textContent = S.sound ? '🔊 Sound' : '🔇 Sound';
    roomBtn.setAttribute('aria-pressed', String(S.roomTone));
  }
  soundBtn.addEventListener('click', () => { S.sound = !S.sound; persist(); A.setMuted(!S.sound); if (S.sound && hub) A.cue(hub.theme, 'station'); syncAudioButtons(); });
  roomBtn.addEventListener('click', () => { S.roomTone = !S.roomTone; persist(); if (S.roomTone && !S.sound) { S.sound = true; persist(); A.setMuted(false); } A.setRoomTone(S.roomTone); syncAudioButtons(); });
  /* Browsers need a gesture before audio: restore a saved "sound on" at the first click. */
  window.addEventListener('pointerdown', function once() { window.removeEventListener('pointerdown', once); if (S.sound) { A.setMuted(false); } }, { once: true });
  syncAudioButtons();

  document.getElementById('fsBtn').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { });
  });

  /* ── Auto-roam ───────────────────────────────────────────────────────── */
  const roamSel = document.getElementById('roamSelect'), rushBox = document.getElementById('rushToggle');
  let roamTimer = null;
  function isRush(h) {
    const p = U.parts(new Date(), h.tz);
    const dow = new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay();
    const x = p.h + p.mi / 60;
    return dow > 0 && dow < 6 && ((x >= 7 && x < 9.5) || (x >= 16.5 && x < 19));
  }
  function roamNext() {
    const pool = HUBS.filter(h => h !== hub && (!R.THEMES[h.theme].airport || window.FlightEngine.provider()));
    const weights = pool.map(h => (S.rush && isRush(h) ? 5 : 1) * (U.localHour(h.tz) >= 1 && U.localHour(h.tz) < 5 ? 0.15 : 1));
    let x = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { x -= weights[i]; if (x <= 0) return selectHub(pool[i].id); }
  }
  function setRoam() {
    clearInterval(roamTimer);
    if (S.roam > 0) roamTimer = setInterval(roamNext, S.roam * 60e3);
  }
  roamSel.value = String(S.roam); rushBox.checked = !!S.rush;
  roamSel.addEventListener('change', () => { S.roam = +roamSel.value; persist(); setRoam(); });
  rushBox.addEventListener('change', () => { S.rush = rushBox.checked; persist(); });
  setRoam();

  /* ── Settings modal ──────────────────────────────────────────────────── */
  const modal = document.getElementById('settings');
  const fields = ['rdmKey', 'rdmUrl', 'adbKey', 'airlabsKey', 'avstackKey', 'flightBudget'];
  function openSettings() {
    fields.forEach(f => { document.getElementById(f).value = S[f] || ''; });
    document.getElementById('airlineLogos').checked = S.airlineLogos !== false;
    const FE = window.FlightEngine;
    document.getElementById('usageLine').textContent = `This month: ${FE.usage()} of ${FE.budget()} flight requests used. One airport board refreshes every ${FE.intervalMin()} minutes at this budget.`;
    modal.classList.add('open');
  }
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('closeSettings').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  document.getElementById('saveSettings').addEventListener('click', () => {
    fields.forEach(f => { const v = document.getElementById(f).value.trim(); S[f] = f === 'flightBudget' ? Math.max(10, +v || 100) : v; });
    S.airlineLogos = document.getElementById('airlineLogos').checked;
    persist(); modal.classList.remove('open'); selectHub(hub.id, { instant: true });
  });
  document.getElementById('clearCache').addEventListener('click', () => { localStorage.removeItem('onward.flightCache'); localStorage.removeItem('onward.flightCache.v2'); });

  /* ── Keyboard: ← → cycle hubs, F fullscreen, S settings ─────────────── */
  window.addEventListener('keydown', e => {
    if (modal.classList.contains('open') || /INPUT|SELECT/.test(document.activeElement.tagName)) return;
    const i = HUBS.indexOf(hub);
    if (e.key === 'ArrowRight') selectHub(HUBS[(i + 1) % HUBS.length].id);
    if (e.key === 'ArrowLeft') selectHub(HUBS[(i - 1 + HUBS.length) % HUBS.length].id);
    if (e.key === 'f') document.getElementById('fsBtn').click();
  });
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1).toUpperCase(); if (hub && id && id !== hub.id) selectHub(id); });

  selectHub((location.hash.slice(1) || S.hub).toUpperCase(), { instant: true });
})();
