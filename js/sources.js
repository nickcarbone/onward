/* ONWARD — data connectors.
 * Every connector returns { rows, meta } where rows are normalised departures:
 *   { key, sched:Date, exp:Date|null, rt:bool, cancelled:bool, dest, destAlt, via,
 *     platform, platformChanged, cat, number, name, nameAlt, operator, mode,
 *     statusText, calling:[names], tripId }
 * Nothing here invents a service: rows come only from the feeds named in meta.source.
 */
(function () {
  const U = window.CU;
  const TRANSITOUS = 'https://api.transitous.org/api/v5';
  const HUXLEY = 'https://huxley2.azurewebsites.net';
  const RDM_DEFAULT = 'https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepBoardWithDetails';

  const settings = () => window.ONWARD_SETTINGS || {};

  /* ── Japanese train names → Romaji, and service type ─────────────────── */
  const JP_NAMES = {
    'のぞみ': 'Nozomi', 'ひかり': 'Hikari', 'こだま': 'Kodama', 'みずほ': 'Mizuho', 'さくら': 'Sakura', 'つばめ': 'Tsubame',
    'はやぶさ': 'Hayabusa', 'はやて': 'Hayate', 'やまびこ': 'Yamabiko', 'なすの': 'Nasuno', 'こまち': 'Komachi', 'つばさ': 'Tsubasa',
    'とき': 'Toki', 'たにがわ': 'Tanigawa', 'かがやき': 'Kagayaki', 'はくたか': 'Hakutaka', 'あさま': 'Asama', 'つるぎ': 'Tsurugi',
    'サンダーバード': 'Thunderbird', 'はるか': 'Haruka', 'くろしお': 'Kuroshio', 'びわこエクスプレス': 'Biwako Express',
    'きのさき': 'Kinosaki', 'はしだて': 'Hashidate', 'まいづる': 'Maizuru', 'ひだ': 'Hida', 'しなの': 'Shinano', 'らくラクやまと': 'Raku Raku Yamato',
    'あずさ': 'Azusa', 'かいじ': 'Kaiji', '富士回遊': 'Fuji Excursion', '成田エクスプレス': "Narita Express", '湘南': 'Shonan',
    'スーパーはくと': 'Super Hakuto', 'はまかぜ': 'Hamakaze', 'やくも': 'Yakumo', 'ひたち': 'Hitachi', 'ときわ': 'Tokiwa', '踊り子': 'Odoriko',
    'サフィール踊り子': 'Saphir Odoriko', 'スペーシア': 'Spacia', 'ロマンスカー': 'Romancecar'
  };
  const SHINKANSEN = new Set(['のぞみ', 'ひかり', 'こだま', 'みずほ', 'さくら', 'つばめ', 'はやぶさ', 'はやて', 'やまびこ', 'なすの', 'こまち', 'つばさ', 'とき', 'たにがわ', 'かがやき', 'はくたか', 'あさま', 'つるぎ']);
  /* Operator labels for trains whose feed gives no service type (we never guess 普通/Local). */
  const JP_OPS = [[/^JR/, 'JR', 'JR'], [/近畿日本鉄道/, '近鉄', 'Kintetsu'], [/東京都交通局/, '都営', 'Toei'], [/東京地下鉄|東京メトロ/, 'メトロ', 'Metro'],
    [/小田急/, '小田急', 'Odakyu'], [/京王/, '京王', 'Keio'], [/西武/, '西武', 'Seibu'], [/京阪/, '京阪', 'Keihan'], [/阪急/, '阪急', 'Hankyu'], [/京都市交通局/, '地下鉄', 'Subway']];
  function jpTrain(display, mode, agency) {
    const out = { name: '', nameAlt: '', type: '', typeAlt: '', typeClass: 'op', cars: '' };
    if (!display || /^\d+$/.test(display)) {
      if (mode === 'HIGHSPEED_RAIL') { out.type = '新幹線'; out.typeAlt = 'Shinkansen'; out.typeClass = 'shinkansen'; }
      else { const op = JP_OPS.find(o => o[0].test(agency || '')); out.type = op ? op[1] : (agency || ''); out.typeAlt = op ? op[2] : (agency || ''); }
      return out;
    }
    const d = display.normalize('NFKC');
    const m = /^(.+?)(\d+)号$/.exec(d);
    const base = m ? m[1] : d, num = m ? m[2] : '';
    out.name = display;
    if (/快速/.test(base)) {
      const special = /新快速/.test(base);
      out.type = special ? '新快速' : base; out.typeAlt = special ? 'Special Rapid' : (/^[A-Z]快速/.test(base) ? base[0] + ' Rapid' : 'Rapid');
      out.typeClass = 'rapid'; out.name = num ? `${num}` : ''; out.nameAlt = out.name;
      return out;
    }
    const rom = JP_NAMES[base];
    out.nameAlt = rom ? (rom + (num ? ' ' + num : '')).toUpperCase() : '';
    if (SHINKANSEN.has(base) || mode === 'HIGHSPEED_RAIL') { out.type = '新幹線'; out.typeAlt = 'Shinkansen'; out.typeClass = 'shinkansen'; }
    else { out.type = '特急'; out.typeAlt = 'Ltd. Exp.'; out.typeClass = 'express'; }
    if (base === 'のぞみ') out.cars = '16'; /* every Nozomi runs as a 16-car N700 set */
    return out;
  }

  /* ── Transitous (MOTIS 2) ─────────────────────────────────────────────── */
  function splitCat(dn, rsn, rln, tsn) {
    let m = /^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .]*?)\s+(\d{2,6})$/.exec(dn || '');
    if (m) return { cat: m[1], number: m[2] };
    const num = (tsn || '').match(/(\d{2,6})\s*$/);
    if (/^\d+$/.test(dn || '') && rln) return { cat: rln, number: dn };
    return { cat: rsn || dn || '', number: num ? num[1] : '' };
  }

  async function transitousRaw(src, lang) {
    const p = new URLSearchParams({ stopId: src.stopId, n: String(src.n || 60) });
    if (src.radius) p.set('radius', String(src.radius));
    if (src.modes) p.set('mode', src.modes.join(','));
    if (lang) p.set('language', lang);
    return U.fetchJSON(`${TRANSITOUS}/stoptimes?${p}`);
  }

  function normTransitous(st, hub, src) {
    const pl = st.place || {};
    const sched = new Date(pl.scheduledDeparture || pl.departure);
    const exp = pl.departure ? new Date(pl.departure) : null;
    const hs = st.headsign && !/^\d+$/.test(st.headsign) ? st.headsign : (st.tripTo && st.tripTo.name) || '';
    const c = splitCat(st.displayName, st.routeShortName, st.routeLongName, st.tripShortName);
    const row = {
      key: st.tripId + '|' + (pl.scheduledDeparture || ''),
      tripId: st.tripId, stopId: pl.stopId,
      sched, exp: st.realTime ? exp : null, rt: !!st.realTime,
      cancelled: !!(pl.cancelled || st.tripCancelled || st.cancelled),
      dest: U.titleCase(hs), destAlt: '', via: '',
      platform: pl.track || pl.scheduledTrack || '',
      platformChanged: !!(st.realTime && pl.track && pl.scheduledTrack && pl.track !== pl.scheduledTrack),
      cat: c.cat, number: c.number, name: '', nameAlt: '',
      operator: st.agencyName || '', mode: st.mode, statusText: '', calling: [],
      routeColor: st.routeColor ? '#' + st.routeColor : '', imp: (st.tripTo && st.tripTo.importance) || 0
    };
    /* Open-access operators label their trains by brand on station boards. */
    const brand = /ouigo/i.test(row.operator) ? 'OUIGO' : /iryo|ilsa/i.test(row.operator) ? 'iryo' : '';
    if (brand && hub.theme === 'es-rail') row.cat = brand;
    if (hub.theme === 'de-rail') row.dest = row.dest.replace(/^(S\+U|S|U)\s+/, '').replace(/\s*\(Berlin\)$/, '').replace(/,?\s+(Bhf|Bahnhof)$/, '');
    if (hub.theme === 'jp-rail') Object.assign(row, { jp: jpTrain(st.displayName, st.mode, st.agencyName) });
    return row;
  }

  async function transitous(hub, src) {
    const data = await transitousRaw(src, src.bilingual ? 'ja' : 'en');
    const allowed = src.modes ? new Set(src.modes) : null;
    const seen = new Set();
    let rows = [];
    for (const st of data.stopTimes || []) {
      if (allowed && !allowed.has(st.mode)) continue;
      if (src.excludeAgencies && new RegExp(src.excludeAgencies, 'i').test(st.agencyName || '')) continue;
      if (!st.place || !(st.place.scheduledDeparture || st.place.departure)) continue;
      const r = normTransitous(st, hub, src);
      const dupe = r.sched.getTime() + '|' + r.cat + r.number + '|' + r.dest;
      if (seen.has(r.key) || seen.has(dupe)) continue;
      seen.add(r.key); seen.add(dupe);
      /* One train published as several trips (e.g. Renfe segments): keep the run to the major destination. */
      const nz = v => String(v || '').replace(/^0+(?=\d)/, '');
      const twin = !r.number ? -1 : rows.findIndex(x => x.sched.getTime() === r.sched.getTime() && x.number &&
        (nz(x.number) === nz(r.number) || (x.dest === r.dest && (nz(x.number).endsWith(nz(r.number)) || nz(r.number).endsWith(nz(x.number))))));
      if (twin >= 0) {
        const x = rows[twin], codeshare = o => /codesharing/i.test(o.operator);
        if ((codeshare(x) && !codeshare(r)) || (codeshare(x) === codeshare(r) && r.imp > x.imp)) rows[twin] = r;
        continue;
      }
      rows.push(r);
    }
    if (src.bilingual) {
      try {
        const en = await transitousRaw(src, 'en');
        const map = new Map((en.stopTimes || []).map(s => [s.tripId, s]));
        for (const r of rows) {
          const e = map.get(r.tripId);
          if (e) r.destAlt = U.titleCase(e.headsign || (e.tripTo && e.tripTo.name) || '');
        }
      } catch (e) { /* English names are optional */ }
    }
    if (src.amtrak) rows = await amtrakOverlay(rows, src.amtrak).catch(() => rows);
    const rtShare = rows.length ? rows.filter(r => r.rt).length / rows.length : 0;
    return { rows, meta: { source: 'Transitous', sourceUrl: 'https://transitous.org/sources/', live: rtShare > 0.3, partialLive: rtShare > 0 && rtShare <= 0.3 } };
  }

  /** Calling points for one trip (used for the UK "Calling at" ticker). */
  const tripCache = new Map();
  async function transitousCalling(row) {
    if (!row.tripId) return [];
    if (tripCache.has(row.tripId)) return tripCache.get(row.tripId);
    const d = await U.fetchJSON(`${TRANSITOUS}/trip?${new URLSearchParams({ tripId: row.tripId })}`);
    const leg = (d.legs || [])[0];
    let names = [];
    if (leg) {
      const stops = [leg.from, ...(leg.intermediateStops || []), leg.to];
      const i = stops.findIndex(s => s && s.stopId === row.stopId);
      names = stops.slice(i >= 0 ? i + 1 : 1).map(s => s && s.name).filter(Boolean);
    }
    tripCache.set(row.tripId, names);
    if (tripCache.size > 50) tripCache.delete(tripCache.keys().next().value);
    return names;
  }

  /* ── Amtrak live overlay (Amtraker) ───────────────────────────────────── */
  const amtrakCache = { station: {}, train: {} };
  async function amtrakOverlay(rows, code) {
    const now = Date.now();
    let st = amtrakCache.station[code];
    if (!st || now - st.t > 180e3) {
      const d = await U.fetchJSON(`https://api-v3.amtraker.com/v3/stations/${code}`);
      st = { t: now, ids: ((d[code] || {}).trains || []) };
      amtrakCache.station[code] = st;
    }
    const amtrakRows = rows.filter(r => /amtrak/i.test(r.operator) && r.number).slice(0, 10);
    await Promise.all(amtrakRows.map(async r => {
      const id = st.ids.find(x => x.split('-')[0] === String(+r.number));
      if (!id) return;
      let tr = amtrakCache.train[id];
      if (!tr || now - tr.t > 180e3) {
        const d = await U.fetchJSON(`https://api-v3.amtraker.com/v3/trains/${id}`).catch(() => null);
        tr = { t: now, data: d && Object.values(d)[0] && Object.values(d)[0][0] };
        amtrakCache.train[id] = tr;
      }
      const t = tr.data;
      if (!t) return;
      const s = (t.stations || []).find(x => x.code === code);
      if (!s) return;
      const sch = s.schDep ? new Date(s.schDep) : null;
      if (sch && Math.abs(sch - r.sched) > 3 * 3600e3) return; /* a different day's run */
      if (s.dep) { r.exp = new Date(s.dep); r.rt = true; }
      if (s.status === 'Departed') r.departed = true;
      r.source = 'Amtraker';
    }));
    return rows.filter(r => !r.departed);
  }

  /* ── UK National Rail (Darwin) ────────────────────────────────────────── */
  function normDarwin(ts, hub) {
    const sched = U.hhmmToDate(ts.std, hub.tz);
    const etd = ts.etd || '';
    const exp = /^\d{1,2}:\d{2}$/.test(etd) ? U.hhmmToDate(etd, hub.tz) : (/on time/i.test(etd) ? sched : null);
    const dest = (ts.destination || []).map(d => d.locationName).join(' & ');
    const via = (ts.destination || []).map(d => d.via).filter(Boolean).join(' ');
    const cps = ((ts.subsequentCallingPoints || [])[0] || {}).callingPoint || [];
    return {
      key: ts.serviceIdUrlSafe || ts.serviceID || (ts.std + dest),
      sched, exp, rt: true, cancelled: !!ts.isCancelled || /cancel/i.test(etd),
      dest, via, destAlt: '', platform: ts.platform || '', platformChanged: false,
      cat: '', number: '', operator: ts.operator || '', mode: 'RAIL',
      statusText: etd, delayReason: ts.delayReason || ts.cancelReason || '',
      calling: cps.map(c => c.locationName), coaches: ts.length || 0
    };
  }

  async function darwin(hub, src) {
    const key = settings().rdmKey;
    let data, via;
    if (key) {
      const base = settings().rdmUrl || RDM_DEFAULT;
      data = await U.fetchJSON(`${base}/${src.crs}?numRows=14`, { headers: { 'x-apikey': key } });
      via = 'National Rail Darwin (Rail Data Marketplace)';
    } else {
      data = await U.fetchJSON(`${HUXLEY}/departures/${src.crs}/14?expand=true`);
      via = 'National Rail Darwin via Huxley2 (community proxy)';
    }
    const rows = (data.trainServices || []).map(t => normDarwin(t, hub)).filter(r => r.sched);
    const messages = (data.nrccMessages || []).map(m => (m.value || m.xhtmlMessage || m.Value || '').replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    return { rows, meta: { source: via, sourceUrl: 'https://www.nationalrail.co.uk/', live: true, messages } };
  }

  /* ── Switzerland (transport.opendata.ch) ──────────────────────────────── */
  async function sbb(hub, src) {
    const d = await U.fetchJSON(`https://transport.opendata.ch/v1/stationboard?station=${src.station}&limit=24&transportations[]=train`);
    const rows = (d.stationboard || []).map(s => {
      const sched = new Date(s.stop.departureTimestamp * 1000);
      const delay = s.stop.delay;
      const prog = s.stop.prognosis || {};
      const passing = (s.passList || []).slice(1, -1).map(p => p.station && p.station.name).filter(Boolean);
      return {
        key: s.name + '|' + s.stop.departureTimestamp,
        sched, exp: delay != null ? new Date(sched.getTime() + delay * 60000) : null, rt: delay != null,
        cancelled: false, dest: s.to, destAlt: '', via: '', calling: passing,
        platform: prog.platform || s.stop.platform || '', platformChanged: !!(prog.platform && s.stop.platform && prog.platform !== s.stop.platform),
        cat: s.category || '', number: (s.number || '').replace(/^0+/, ''), operator: s.operator || '', mode: 'RAIL', statusText: '',
        delayMin: delay || 0
      };
    });
    /* Borrow line labels (S16, IR37, IC 1) from the published timetable when it is reachable. */
    const fb = hub.sources.find(x => x.type === 'transitous');
    if (fb) {
      try {
        const t = await transitous(hub, Object.assign({}, fb, { n: 50 }));
        for (const r of rows) {
          const m = t.rows.find(x => Math.abs(x.sched - r.sched) < 60e3 && x.dest && r.dest && x.dest.split(/[ ,]/)[0] === r.dest.split(/[ ,]/)[0]);
          if (m && m.cat && /^[A-Z]{1,4} ?\d/.test(m.cat)) r.line = m.cat.replace(/\s+/g, '');
        }
      } catch (e) { /* labels are cosmetic */ }
    }
    const live = rows.some(r => r.rt);
    return { rows, meta: { source: 'SBB via transport.opendata.ch', sourceUrl: 'https://transport.opendata.ch/', live } };
  }

  const CONNECTORS = {
    transitous, darwin, sbb,
    flights: (hub, src) => window.FlightEngine.fetch(hub, src)
  };

  /** Try each source in order. Throws only when every source fails. */
  async function fetchHub(hub) {
    const errors = [];
    const srcs = hub.sources || [];
    for (let i = 0; i < srcs.length; i++) {
      const src = srcs[i];
      try {
        const res = await CONNECTORS[src.type](hub, src);
        const upcoming = res.rows.filter(r => (r.exp || r.sched) > Date.now() - 90e3);
        if (!upcoming.length && i < srcs.length - 1 && !res.meta.allowEmpty) { errors.push(src.type + ': no departures'); continue; }
        res.rows = upcoming.sort((a, b) => (a.sched - b.sched));
        res.meta.type = src.type;
        res.meta.fallback = i > 0;
        res.meta.fetchedAt = new Date();
        return res;
      } catch (e) {
        errors.push(src.type + ': ' + (e.message || e));
        if (e.fatal) break;
      }
    }
    const err = new Error(errors.join(' · '));
    err.all = errors;
    throw err;
  }

  window.Sources = { fetchHub, transitousCalling, jpTrain };
})();
