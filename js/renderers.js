/* ONWARD — board renderers. One generic table engine; each theme supplies its
 * column set, wording, clock style and disruption notice. Split-flap and the JR
 * bilingual board add their own behaviour on top.
 */
(function () {
  const U = window.CU;
  const esc = U.esc;
  const hm = (d, hub) => U.hm(d, hub.tz);
  const delayMin = r => (r.exp && r.sched) ? Math.round((r.exp - r.sched) / 60000) : (r.delayMin || 0);
  const bi = (ja, en) => `<span class="ja">${esc(ja)}</span><span class="en">${esc(en || ja)}</span>`;

  /* ── Column sets ─────────────────────────────────────────────────────── */
  const THEMES = {
    'uk-rail': {
      clock: 'led',
      cols: [
        { k: 'time', label: 'Time', v: (r, h) => hm(r.sched, h) },
        { k: 'dest', label: 'Destination', v: r => esc(r.dest) + (r.via ? ` <small>${esc(r.via)}</small>` : '') },
        { k: 'plat', label: 'Plat', v: r => esc(r.platform) },
        { k: 'exp', label: 'Expected', v: (r, h) => {
          if (r.cancelled) return '<b class="bad">Cancelled</b>';
          if (r.statusText && !/^\d/.test(r.statusText)) return /delay/i.test(r.statusText) ? '<b class="bad">Delayed</b>' : esc(r.statusText);
          if (!r.rt) return '';
          const d = delayMin(r);
          return d > 0 ? `<b class="bad">${hm(r.exp, h)}</b>` : 'On time';
        } }
      ],
      ticker: true,
      disruption: {
        head: 'We are sorry to announce',
        lines: ['that this information service', 'is subject to disruption.', 'Please listen for announcements.'],
        tick: 'Departure information is currently unavailable. We apologise for any inconvenience this may cause.'
      }
    },
    'jp-rail': {
      clock: 'led', bilingual: true,
      cols: [
        { k: 'type', label: bi('種別', 'Type'), v: r => `<span class="jp-type t-${r.jp.typeClass}">${bi(r.jp.type, r.jp.typeAlt)}</span>`, raw: true },
        { k: 'name', label: bi('列車名', 'Train'), v: r => bi(r.jp.name, r.jp.nameAlt || r.jp.name), raw: true },
        { k: 'time', label: bi('発車時刻', 'Dep.'), v: (r, h) => hm(r.sched, h) },
        { k: 'dest', label: bi('行先', 'For'), v: r => bi(r.dest, r.destAlt || r.dest), raw: true },
        { k: 'cars', label: bi('両数', 'Cars'), v: r => r.jp.cars ? bi(r.jp.cars + '両', r.jp.cars + ' cars') : '', raw: true }
      ],
      disruption: { head: bi('ただいま', 'We apologise'), lines: [bi('発車案内を見合わせております', 'Departure information is suspended'), bi('しばらくお待ちください', 'Please wait for announcements')], raw: true }
    },
    'eu-rail': {
      clock: 'analog',
      cols: [
        { k: 'cat', label: '', v: r => `<span class="cat-pill c-${esc((r.cat || '').replace(/[^A-Za-z]/g, ''))}">${esc(r.line || r.cat)}</span>` },
        { k: 'time', label: '', v: (r, h) => hm(r.sched, h) },
        { k: 'dest', label: '', v: r => `<div class="d1">${esc(r.dest)}</div>` + (r.calling && r.calling.length ? `<div class="d2">${esc(r.calling.slice(0, 3).join(' · '))}</div>` : '') },
        { k: 'rem', label: '', v: r => r.cancelled ? '<b class="bad">Ausfall</b>' : (delayMin(r) > 0 ? `<b class="warn">ca. +${delayMin(r)}'</b>` : '') },
        { k: 'plat', label: 'Gleis Voie', v: r => r.platform ? `<span class="plat${r.platformChanged ? ' changed' : ''}">${esc(r.platform)}</span>` : '' }
      ],
      disruption: { head: 'Störung · Dérangement · Perturbazione', lines: ['Fahrplaninformation zurzeit nicht verfügbar.', 'Information horaire momentanément indisponible.', 'Informazioni d’orario momentaneamente non disponibili.'] }
    },
    'nl-rail': {
      clock: 'digital',
      cols: [
        { k: 'time', label: 'Vertrek', v: (r, h) => hm(r.sched, h) + (delayMin(r) > 0 ? ` <b class="bad">+${delayMin(r)}</b>` : '') },
        { k: 'dest', label: 'Naar', v: r => `<div class="d1">${esc(r.dest)}</div>` + (r.cancelled ? '<div class="d2 bad">Rijdt niet</div>' : '') },
        { k: 'plat', label: 'Spoor', v: r => r.platform ? `<span class="plat${r.platformChanged ? ' changed' : ''}">${esc(r.platform)}</span>` : '' },
        { k: 'cat', label: 'Trein', v: r => esc(r.cat) + (r.operator && !/^NS/.test(r.operator) ? ` <small>${esc(r.operator)}</small>` : '') }
      ],
      disruption: { head: 'Geen actuele reisinformatie', lines: ['Reisinformatie is tijdelijk niet beschikbaar.', 'Let op omroepberichten.'] }
    },
    'de-rail': {
      clock: 'digital',
      cols: [
        { k: 'time', label: 'Zeit', v: (r, h) => hm(r.sched, h) + (delayMin(r) > 0 ? `<div class="d2 warn">ca. ${hm(r.exp, h)}</div>` : '') },
        { k: 'cat', label: 'Zug', v: r => `<span class="cat">${esc(r.cat)}</span>${r.number && !/^(S|U|RE|RB)\d/.test(r.cat) ? ' <small>' + esc(r.number.replace(/^0+(?=\d)/, '')) + '</small>' : ''}` },
        { k: 'dest', label: 'Nach', v: r => esc(r.dest) },
        { k: 'plat', label: 'Gleis', v: r => r.platform ? `<span class="plat${r.platformChanged ? ' changed' : ''}">${esc(r.platform)}</span>` : '' },
        { k: 'rem', label: 'Hinweis', v: r => r.cancelled ? '<b class="bad">Fällt aus</b>' : (delayMin(r) > 4 ? `<span class="warn">+${delayMin(r)} Min.</span>` : '') }
      ],
      disruption: { head: 'Information', lines: ['Zurzeit sind keine Abfahrtsinformationen verfügbar.', 'Bitte achten Sie auf Lautsprecherdurchsagen.'] }
    },
    'fr-rail': {
      clock: 'digital',
      cols: [
        { k: 'cat', label: 'Train', v: r => `<div class="d1">${esc(r.cat)}</div><div class="d2">${esc(r.number)}</div>` },
        { k: 'time', label: 'Heure', v: (r, h) => hm(r.sched, h) },
        { k: 'dest', label: 'Destination', v: r => esc(r.dest) },
        { k: 'info', label: 'Information', v: r => r.cancelled ? '<b class="bad">Supprimé</b>' : (delayMin(r) > 0 ? `<b class="warn">Retard ${delayMin(r)} min</b>` : (r.rt ? 'À l’heure' : '')) },
        { k: 'plat', label: 'Voie', v: r => r.platform ? `<span class="plat">${esc(r.platform)}</span>` : '' }
      ],
      disruption: { head: 'Information voyageurs', lines: ['Affichage momentanément indisponible.', 'Merci de votre compréhension.'] }
    },
    'es-rail': {
      clock: 'digital',
      cols: [
        { k: 'time', label: 'Hora', v: (r, h) => hm(r.sched, h) },
        { k: 'dest', label: 'Destino', v: r => esc(r.dest) },
        { k: 'cat', label: 'Tren', v: r => `<span class="cat">${esc(r.cat)}</span> ${esc(r.number)}` },
        { k: 'plat', label: 'Vía', v: r => esc(r.platform) },
        { k: 'rem', label: 'Observaciones', v: (r, h) => r.cancelled ? '<b class="bad">Suprimido</b>' : (delayMin(r) > 0 ? `<b class="warn">Retraso · ${hm(r.exp, h)}</b>` : '') }
      ],
      disruption: { head: 'Información no disponible', lines: ['Disculpen las molestias.', 'Atiendan a la megafonía.'] }
    },
    'solari-flap': {
      clock: 'flip', flaps: true,
      cols: [
        { k: 'cat', label: 'Treno', w: 9, v: r => `${(r.cat || '').slice(0, 3)} ${r.number || ''}`.trim() },
        { k: 'dest', label: 'Destinazione', w: 22, v: r => (r.dest || '').toUpperCase() },
        { k: 'time', label: 'Orario', w: 5, v: (r, h) => hm(r.sched, h) },
        { k: 'rit', label: 'Rit.', w: 3, v: r => r.cancelled ? 'SOP' : (delayMin(r) > 0 ? String(delayMin(r)) : '') },
        { k: 'plat', label: 'Bin.', w: 3, v: r => r.platform || '' }
      ],
      disruption: { lines: ['SERVIZIO', 'MOMENTANEAMENTE', 'SOSPESO', '', 'CI SCUSIAMO PER', 'IL DISAGIO'] }
    },
    'us-rail': {
      clock: 'digital',
      cols: [
        { k: 'time', label: 'Time', v: (r, h) => hm(r.sched, h).replace(/^0/, '') },
        { k: 'dest', label: 'Destination', v: r => esc(r.dest) },
        { k: 'cat', label: 'Train', v: r => `<span class="rr rr-${rrCode(r)}">${rrCode(r)}</span> ${esc(r.number || (/amtrak/i.test(r.operator) ? '' : r.cat) || '')}${/amtrak/i.test(r.operator) && r.cat && !/^\d+$/.test(r.cat) ? ` <small>${esc(r.cat)}</small>` : ''}` },
        { k: 'plat', label: 'Track', v: r => esc(r.platform) },
        { k: 'st', label: 'Status', v: (r, h) => r.cancelled ? '<b class="bad">CANCELLED</b>' : (!r.rt ? '' : (delayMin(r) > 2 ? `<b class="warn">LATE ${hm(r.exp, h)}</b>` : '<b class="ok">ON TIME</b>')) }
      ],
      disruption: { head: 'Service information delayed', lines: ['Departure information is temporarily unavailable.', 'Please listen for announcements.'] }
    },
    'us-airport': {
      clock: 'digital',
      cols: [
        { k: 'flt', label: 'Flight', v: r => `${airlineMark(r)} ${esc((r.flight || '').replace(/^\S+\s*/, ''))}` },
        { k: 'dest', label: 'Destination', v: r => esc(r.dest) + (r.destCode ? ` <small>${esc(r.destCode)}</small>` : '') + airlineTag(r) },
        { k: 'time', label: 'Departs', v: (r, h) => U.hm(r.sched, h.tz) },
        { k: 'gate', label: 'Gate', v: r => esc([r.terminal && !/^\d+$/.test(r.gate) ? r.terminal : '', r.gate].filter(Boolean).join(' ')) },
        { k: 'st', label: 'Status', v: (r, h) => {
          const s = r.status || '';
          const cls = { 'BOARDING': 'boarding', 'ON TIME': 'ontime', 'DELAYED': 'delayed', 'GATE CLOSED': 'closed', 'CANCELLED': 'cancelled', 'DEPARTED': 'departed', 'CHECK-IN': 'ontime', 'SCHEDULED': 'sched', 'DIVERTED': 'delayed' }[s] || 'sched';
          return `<span class="st st-${cls}">${esc(s === 'DELAYED' && r.exp ? 'NOW ' + U.hm(r.exp, h.tz) : s)}</span>`;
        } }
      ],
      disruption: { head: 'Flight information display delayed', lines: [] }
    }
  };


  /* ── International airport boards ────────────────────────────────────── */
  const LANG_IX = { en: 0, ja: 1, zh: 2, ko: 3 };
  const STATUS_I18N = {
    'BOARDING':    { en: 'Boarding', ja: '搭乗中', zh: '登機', ko: '탑승중', de: 'BOARDING' },
    'GATE CLOSED': { en: 'Gate closed', ja: '搭乗締切', zh: '閘口關閉', ko: '탑승마감', de: 'GATE GESCHL' },
    'CHECK-IN':    { en: 'Check-in open', ja: '手続中', zh: '辦理登機', ko: '수속중', de: 'CHECK-IN' },
    'DEPARTED':    { en: 'Departed', ja: '出発済', zh: '已起飛', ko: '출발', de: 'GESTARTET' },
    'CANCELLED':   { en: 'Cancelled', ja: '欠航', zh: '取消', ko: '결항', de: 'ANNULLIERT' },
    'DELAYED':     { en: 'Delayed', ja: '遅延', zh: '延誤', ko: '지연', de: 'VERSPAETET' },
    'DIVERTED':    { en: 'Diverted', ja: '目的地変更', zh: '改降', ko: '회항', de: 'UMGELEITET' },
    'ON TIME':     { en: 'On time', ja: '定刻', zh: '準時', ko: '정시', de: '' },
    'SCHEDULED':   { en: '', ja: '', zh: '', ko: '', de: '' }
  };
  const ST_CLASS = { 'BOARDING': 'boarding', 'ON TIME': 'ontime', 'DELAYED': 'delayed', 'GATE CLOSED': 'closed', 'CANCELLED': 'cancelled', 'DEPARTED': 'departed', 'CHECK-IN': 'ontime', 'SCHEDULED': 'sched', 'DIVERTED': 'delayed' };
  /** One span per board language; the board shows one language at a time. */
  function ml(vals) { return vals.length === 1 ? esc(vals[0]) : vals.map((v, i) => `<span class="ml" data-l="${i}">${esc(v)}</span>`).join(''); }
  /* Airline logos: third-party image service keyed on the 2-character IATA airline code.
   * Change window.ONWARD_LOGO_URL to switch provider. Logos that fail to load are remembered
   * (per session) and the board falls back to the plain carrier-code chip. */
  const LOGO_URL = () => window.ONWARD_LOGO_URL || 'https://pics.avs.io/120/60/{code}.png';
  const logoState = {};
  window.ONWARD_LOGO = function (code, ok, img) {
    logoState[code] = ok ? 'ok' : 'bad';
    if (!img) return;
    if (ok) { if (img.parentNode) img.parentNode.classList.add('ok'); } else img.remove();
  };
  function airlineMark(r) {
    const code = String(r.airline || '').toUpperCase();
    const chip = `<span class="al">${esc(r.airline || '')}</span>`;
    if ((window.ONWARD_SETTINGS || {}).airlineLogos === false || !/^[A-Z0-9]{2}$/.test(code) || logoState[code] === 'bad') return chip;
    const src = LOGO_URL().replace('{code}', encodeURIComponent(code));
    return `<span class="alwrap${logoState[code] === 'ok' ? ' ok' : ''}" title="${esc(r.airlineName || code)}"><img class="alogo" alt="${esc(r.airlineName || code)}" src="${esc(src)}" decoding="async" referrerpolicy="no-referrer" onload="ONWARD_LOGO('${code}',1,this)" onerror="ONWARD_LOGO('${code}',0,this)">${chip}</span>`;
  }
  const airlineTag = r => r.airlineName ? ` <small class="aln">${esc(r.airlineName)}</small>` : '';
  function cityName(r, lang) {
    const t = (window.ONWARD_CITY_I18N || {})[r.destCode];
    if (lang === 'de') return ((window.ONWARD_CITY_DE || {})[r.destCode]) || r.dest;
    if (lang === 'en' || !t) return r.dest || (t && t[0]) || r.destCode || '';
    return t[LANG_IX[lang]] || r.dest;
  }
  function apTheme(o) {
    const langs = o.langs || ['en'];
    const lab = k => ml(langs.map(l => (o.labels[k] || {})[l] || (o.labels[k] || {}).en || ''));
    const statusText = (r, h, l) => (o.status ? o.status(r, h, l) : null) ?? ((r.status === 'DELAYED' && r.exp) ? `${STATUS_I18N.DELAYED[l]} ${hm(r.exp, h)}` : (STATUS_I18N[r.status] || {})[l] || '');
    const COLS = {
      time: { k: 'time', label: lab('time'), v: (r, h) => hm(r.sched, h) },
      newtime: { k: 'newtime', label: lab('newtime'), v: (r, h) => (r.exp && delayMin(r) > 4 && !r.cancelled) ? hm(r.exp, h) : '' },
      dest: { k: 'dest', label: lab('dest'), v: r => ml(langs.map(l => cityName(r, l))) + (o.showCode !== false && r.destCode ? ` <small>${esc(r.destCode)}</small>` : '') + airlineTag(r) },
      flt: { k: 'flt', label: lab('flt'), v: r => `${airlineMark(r)} ${esc((r.flight || '').replace(/^\S+\s*/, ''))}` },
      gate: { k: 'gate', label: lab('gate'), v: r => r.gate ? `<span class="gate">${esc(o.terminal && r.terminal && !/^\d+$/.test(r.gate) ? r.terminal + ' ' + r.gate : r.gate)}</span>` : '' },
      term: { k: 'term', label: lab('term'), v: r => esc(r.terminal || '') },
      st: { k: 'st', label: lab('st'), v: (r, h) => { const t = langs.map(l => statusText(r, h, l)); return t.some(Boolean) ? `<span class="st st-${ST_CLASS[r.status] || 'sched'}">${ml(t)}</span>` : ''; } }
    };
    return {
      airport: true, langs, clock: o.clock || 'digital',
      title: ml(langs.map(l => o.title[l] || o.title.en)),
      cols: o.cols.map(k => COLS[k]),
      disruption: o.disruption
    };
  }
  const AP_LABELS = {
    time: { en: 'Time', ja: '定刻', zh: '時間', ko: '시각' }, newtime: { en: 'New time', ja: '変更', zh: '新時間', ko: '변경' },
    dest: { en: 'Destination', ja: '行先', zh: '目的地', ko: '목적지' }, flt: { en: 'Flight', ja: '便名', zh: '航班', ko: '편명' },
    gate: { en: 'Gate', ja: '搭乗口', zh: '閘口', ko: '탑승구' }, term: { en: 'Terminal' }, st: { en: 'Remarks', ja: '備考', zh: '狀況', ko: '비고' }
  };

  Object.assign(THEMES, {
    'uk-airport': apTheme({
      title: { en: 'Departures' }, cols: ['time', 'dest', 'flt', 'st', 'gate'],
      labels: Object.assign({}, AP_LABELS, { st: { en: 'Status' } }),
      /* Heathrow shows gates about 45 minutes before departure; until then passengers wait in the lounge. */
      status: (r, h) => {
        if (['BOARDING', 'GATE CLOSED', 'CANCELLED', 'DEPARTED', 'DIVERTED'].includes(r.status)) return null;
        if (r.status === 'DELAYED') return r.exp ? `Expected ${hm(r.exp, h)}` : 'Delayed';
        if (!r.rt) return '';
        return r.gate ? 'Go to gate' : 'Wait in lounge';
      },
      disruption: { head: 'Flight information', lines: ['Flight information is temporarily unavailable.', 'Please check with your airline.'] }
    }),
    'nl-airport': apTheme({
      title: { en: 'Departures' }, cols: ['time', 'dest', 'flt', 'gate', 'st'], labels: AP_LABELS,
      disruption: { head: 'Flight information unavailable', lines: ['Please check with your airline.'] }
    }),
    'jp-airport': apTheme({
      langs: ['ja', 'en', 'zh', 'ko'], title: { ja: '出発', en: 'Departures', zh: '出發', ko: '출발' },
      cols: ['time', 'newtime', 'dest', 'flt', 'gate', 'st'], labels: AP_LABELS, showCode: false,
      disruption: { head: ml(['ただいま運航情報を表示できません', 'Flight information is unavailable', '暫時無法顯示航班資訊', '운항 정보를 표시할 수 없습니다']), lines: [], raw: true }
    }),
    'hk-airport': apTheme({
      langs: ['zh', 'en'], title: { zh: '離港', en: 'Departures' }, cols: ['time', 'flt', 'dest', 'gate', 'st'],
      labels: Object.assign({}, AP_LABELS, { gate: { zh: '登機閘口', en: 'Gate' } }), showCode: false,
      disruption: { head: ml(['航班資料暫時未能顯示', 'Flight information is temporarily unavailable']), lines: [], raw: true }
    }),
    'sg-airport': apTheme({
      title: { en: 'Departures' }, cols: ['time', 'dest', 'flt', 'term', 'gate', 'st'], terminal: false,
      labels: Object.assign({}, AP_LABELS, { st: { en: 'Status' }, term: { en: 'Terminal' } }),
      disruption: { head: 'Flight information unavailable', lines: ['Please check with your airline.'] }
    }),
    'de-airport': {
      airport: true, clock: 'flip', flaps: true, title: 'Abflug <small>Departures</small>',
      cols: [
        { k: 'time', label: 'Zeit', w: 5, v: (r, h) => hm(r.sched, h) },
        { k: 'flt', label: 'Flug', w: 7, v: r => (r.flight || '').replace(/\s+/g, ' ') },
        { k: 'dest', label: 'Nach / To', w: 17, v: r => cityName(r, 'de') },
        { k: 'gate', label: 'Gate', w: 4, v: r => r.gate || '' },
        { k: 'rem', label: 'Bemerkung', w: 11, v: (r, h) => r.status === 'DELAYED' && r.exp ? `NEU ${hm(r.exp, h)}` : (STATUS_I18N[r.status] || {}).de || '' },
        { k: 'lamp', label: '', lamp: true }
      ],
      disruption: { lines: ['FLUGINFORMATION', 'ZURZEIT NICHT', 'VERFUEGBAR', '', 'BITTE WENDEN SIE', 'SICH AN IHRE AIRLINE'] }
    }
  });

  function rrCode(r) {
    const o = r.operator || '';
    if (/amtrak/i.test(o)) return 'AMTK';
    if (/long island/i.test(o)) return 'LIRR';
    if (/nj transit/i.test(o)) return 'NJT';
    if (/marc/i.test(o) || /us-md-MTA-marc/.test(r.tripId || '')) return 'MARC';
    if (/virginia railway/i.test(o)) return 'VRE';
    return esc(o.split(/\s+/).map(w => w[0]).join('').slice(0, 4).toUpperCase());
  }

  /* ── Clocks ──────────────────────────────────────────────────────────── */
  function buildClock(el, kind) {
    el.className = 'bh-clock clock-' + kind;
    if (kind === 'analog') {
      let ticks = '';
      for (let i = 0; i < 60; i++) {
        const big = i % 5 === 0;
        ticks += `<rect x="${big ? 47.6 : 49.1}" y="3" width="${big ? 4.8 : 1.8}" height="${big ? 13 : 4.5}" transform="rotate(${i * 6} 50 50)" />`;
      }
      el.innerHTML = `<svg viewBox="0 0 100 100" aria-label="Station clock"><circle cx="50" cy="50" r="49" class="face"/><g class="ticks">${ticks}</g>
        <rect class="h-hand" x="47" y="22" width="6" height="34" rx="0.5"/><rect class="m-hand" x="47.9" y="6.5" width="4.2" height="49.5" rx="0.4"/>
        <g class="s-hand"><rect x="49.4" y="14" width="1.2" height="49"/><circle cx="50" cy="14" r="2.4" class="s-ring"/></g><circle cx="50" cy="50" r="1.6" class="pin"/></svg>`;
    } else if (kind === 'flip') {
      el.innerHTML = '<span class="ff"></span><span class="ff"></span><i>:</i><span class="ff"></span><span class="ff"></span>';
    } else el.innerHTML = '<span class="t"></span>';
  }
  function tickClock(el, hub, now) {
    if (el.classList.contains('clock-analog')) {
      const p = U.parts(now, hub.tz);
      const ms = now.getMilliseconds() + p.s * 1000;
      const sec = Math.min(ms / 58500, 1) * 360; /* sweep in 58.5 s, rest at 12 */
      const min = p.mi * 6, hr = (p.h % 12) * 30 + p.mi * 0.5;
      const svg = el.querySelector('svg');
      svg.querySelector('.s-hand').setAttribute('transform', `rotate(${sec} 50 50)`);
      svg.querySelector('.m-hand').setAttribute('transform', `rotate(${min} 50 50)`);
      svg.querySelector('.h-hand').setAttribute('transform', `rotate(${hr} 50 50)`);
    } else if (el.classList.contains('clock-flip')) {
      const s = U.hm(now, hub.tz).replace(':', '');
      el.querySelectorAll('.ff').forEach((f, i) => { if (f.textContent !== s[i]) { f.textContent = s[i]; f.classList.remove('flipnow'); void f.offsetWidth; f.classList.add('flipnow'); } });
    } else {
      el.querySelector('.t').textContent = el.closest('[data-theme="uk-rail"]') ? U.hms(now, hub.tz) : U.hm(now, hub.tz);
    }
  }

  /* ── Split-flap tiles ────────────────────────────────────────────────── */
  const FLAP_SET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-:/\'ÀÈÉÌÒÙ';
  function flapRow(th) { return `<div class="frow">${th.cols.map(c => c.lamp ? '<div class="c c-lamp"><i class="lg"></i><i class="lr"></i></div>' : `<div class="c c-${c.k}">${flapCell(c.w)}</div>`).join('')}</div>`; }
  function flapCell(width) { return `<span class="flaps">${'<span class="fl"><span class="ch"> </span></span>'.repeat(width)}</span>`; }
  /** Set text on a flap cell; returns number of tiles that flipped. */
  function setFlaps(cell, text, width, stagger) {
    const s = (text || '').toUpperCase().normalize('NFC').padEnd(width).slice(0, width);
    const tiles = cell.querySelectorAll('.fl');
    let flipped = 0;
    tiles.forEach((t, i) => {
      const ch = t.querySelector('.ch');
      const target = s[i];
      if (ch.textContent === target) return;
      flipped++;
      const steps = 2 + Math.floor(Math.random() * 3);
      const start = stagger + i * 35;
      for (let k = 1; k <= steps; k++) {
        setTimeout(() => {
          const c = k === steps ? target : FLAP_SET[Math.floor(Math.random() * FLAP_SET.length)];
          ch.textContent = c;
          t.classList.remove('flip'); void t.offsetWidth; t.classList.add('flip');
        }, start + k * 70);
      }
    });
    return flipped;
  }

  /* ── Board build / update ────────────────────────────────────────────── */
  function build(root, hub) {
    const th = THEMES[hub.theme];
    const meta = window.ONWARD_THEME_META[hub.theme];
    const title = th.title || (meta.titleAlt ? (th.bilingual ? bi(meta.title, meta.titleAlt) : `${esc(meta.title)} <small>${esc(meta.titleAlt)}</small>`) : esc(meta.title));
    const station = th.bilingual ? bi(hub.local || hub.short, hub.name) : (th.langs && th.langs.length > 1 && hub.localNames ? ml(th.langs.map(l => hub.localNames[l] || hub.name)) : esc(hub.name));
    const head = th.flaps
      ? `<div class="cols flap-head">${th.cols.map(c => `<div class="c c-${c.k}" style="--w:${c.w || 2}">${esc(c.label)}</div>`).join('')}</div>`
      : `<div class="cols">${th.cols.map(c => `<div class="c c-${c.k}">${c.label}</div>`).join('')}</div>`;
    root.innerHTML = `
      <div class="board-glass"></div>
      <header class="board-head"><div class="bh-title">${title}</div><div class="bh-station">${station}</div><div class="bh-clock"></div></header>
      ${head}
      <div class="rows"></div>
      <footer class="board-foot"><div class="ticker"><span class="ticker-text"></span></div></footer>`;
    buildClock(root.querySelector('.bh-clock'), th.clock);
    root.classList.toggle('flapboard', !!th.flaps);
    root.style.setProperty('--ncol', th.cols.length);
    root.dataset.li = '0';
    root._state = { prev: new Map(), flapRows: [] };
  }

  function rowCapacity(root) {
    const rows = root.querySelector('.rows');
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--row-h)';
    rows.appendChild(probe);
    const rh = probe.getBoundingClientRect().height || 60;
    probe.remove();
    return Math.max(3, Math.floor(rows.clientHeight / rh));
  }

  function update(root, hub, rows, meta) {
    const th = THEMES[hub.theme];
    const box = root.querySelector('.rows');
    const n = rowCapacity(root);
    const show = rows.slice(0, n);
    const events = { newFirst: false, platformChange: false, boarding: false, flapped: 0 };
    const prev = root._state.prev;
    if (show[0] && !prev.has(show[0].key)) events.newFirst = prev.size > 0 || !root._state.seeded;
    for (const r of show) {
      const p = prev.get(r.key);
      if (p && p.platform !== r.platform && r.platform) events.platformChange = true;
      if (r.status === 'BOARDING' && (!p || p.status !== 'BOARDING')) events.boarding = !!p;
    }
    root._state.prev = new Map(show.map(r => [r.key, { platform: r.platform, status: r.status }]));
    root._state.seeded = true;
    root.classList.remove('is-disrupted');

    if (th.flaps) {
      if (box.children.length !== n || !box.querySelector('.frow')) {
        box.innerHTML = Array.from({ length: n }, () => flapRow(th)).join('');
      }
      [...box.children].forEach((rowEl, i) => {
        const r = show[i];
        th.cols.forEach((c, j) => {
          if (c.lamp) { rowEl.children[j].classList.toggle('blink', !!(r && r.status === 'BOARDING')); return; }
          events.flapped += setFlaps(rowEl.children[j], r ? c.v(r, hub) : '', c.w, i * 60);
        });
      });
    } else {
      box.innerHTML = show.map((r, i) => `<div class="row${r.cancelled ? ' cancelled' : ''}${i === 0 ? ' first' : ''}">${th.cols.map(c => `<div class="c c-${c.k}">${c.v(r, hub)}</div>`).join('')}</div>`).join('')
        || `<div class="empty">${th.bilingual ? bi('本日の列車は終了しました', 'No further departures') : 'No further departures'}</div>`;
    }

    /* Footer ticker */
    const tick = root.querySelector('.ticker-text');
    let text = '';
    if (th.ticker && show[0]) {
      const r = show[0];
      const calls = r.calling && r.calling.length ? r.calling : null;
      text = calls ? `${hm(r.sched, hub)} ${r.dest} — Calling at: ${calls.join(', ')}${calls.length > 1 ? '' : ' only'}.` : '';
      if (r.operator) text += (text ? '  ' : '') + `This is a ${r.operator} service.`;
      if (r.coaches) text += ` This train is formed of ${r.coaches} coaches.`;
      if (r.delayReason) text += ` ${r.delayReason}.`;
    }
    if (meta && meta.messages && meta.messages.length) text += (text ? '   ✦   ' : '') + meta.messages.join('   ✦   ');
    setTicker(root, text);
    return events;
  }

  function setTicker(root, text) {
    const tick = root.querySelector('.ticker-text');
    root.classList.toggle('no-ticker', !text);
    if (tick.textContent === text) return;
    tick.textContent = text;
    tick.style.animation = 'none'; void tick.offsetWidth;
    const secs = Math.max(14, text.length * 0.16);
    tick.style.animation = text ? `ticker ${secs}s linear infinite` : 'none';
  }

  function disruption(root, hub, reason) {
    const th = THEMES[hub.theme];
    const d = th.disruption;
    const box = root.querySelector('.rows');
    root.classList.add('is-disrupted');
    root._state.prev = new Map();
    if (th.flaps) {
      const n = Math.max(rowCapacity(root), d.lines.length);
      box.innerHTML = Array.from({ length: n }, () => flapRow(th)).join('');
      const di = th.cols.findIndex(c => c.k === 'dest');
      [...box.children].forEach((rowEl, i) => {
        const line = d.lines[i] || '';
        th.cols.forEach((c, j) => { if (!c.lamp) setFlaps(rowEl.children[j], j === di ? line : (line ? '- - -'.slice(0, c.w) : ''), c.w, i * 80); });
      });
      return;
    }
    let lines = d.lines.map(l => `<div class="dl">${d.raw ? l : esc(l)}</div>`).join('');
    if (th.airport && reason && hub.theme !== 'us-airport') {
      const note = reason === 'nokey' ? 'Add a flight-data key in Settings to restore this board.' : reason === 'budget' ? 'Monthly data allowance reached.' : '';
      if (note) lines += `<div class="dl dl-note">${esc(note)}</div>`;
    }
    if (hub.theme === 'us-airport') {
      const msg = reason === 'nokey' ? 'Add a flight-data key in Settings to restore service.' : reason === 'budget' ? 'Monthly data allowance reached. Service resumes next month.' : 'Please see an agent or check with your airline.';
      lines = ['ALL FLIGHTS', 'SEE AGENT', 'INFORMATION DELAYED'].map((t, i) => `<div class="row"><div class="c c-flt"><span class="al">--</span></div><div class="c c-dest">${t}</div><div class="c c-time">--:--</div><div class="c c-gate">--</div><div class="c c-st"><span class="st st-delayed">${i === 2 ? 'DELAYED' : 'SEE AGENT'}</span></div></div>`).join('')
        + `<div class="dl dl-note">${esc(msg)}</div>`;
    }
    box.innerHTML = `<div class="disrupt">${d.head ? `<div class="dh">${d.raw ? d.head : esc(d.head)}</div>` : ''}${lines}</div>`;
    setTicker(root, th.disruption.tick || '');
  }

  window.Renderers = { THEMES, build, update, disruption, tickClock, setTicker, ml };
})();
