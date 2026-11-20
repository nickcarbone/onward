/* Shared helpers: time zones, formatting, storage, fetch with timeout. */
(function () {
  const fmtCache = {};
  function fmt(tz, opts) {
    const k = tz + JSON.stringify(opts);
    if (!fmtCache[k]) fmtCache[k] = new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: tz, hourCycle: 'h23' }, opts));
    return fmtCache[k];
  }

  /** Wall-clock parts of `date` in time zone `tz`. */
  function parts(date, tz) {
    const o = {};
    for (const p of fmt(tz, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date)) o[p.type] = p.value;
    return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second };
  }

  /** Offset in ms between tz wall clock and UTC at `date`. */
  function offset(date, tz) {
    const p = parts(date, tz);
    return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(date.getTime() / 1000) * 1000;
  }

  /** "HH:MM" wall time in tz -> Date, choosing the day closest to now (boards look ~-6h..+18h). */
  function hhmmToDate(hhmm, tz, now = new Date()) {
    const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
    if (!m) return null;
    const p = parts(now, tz);
    const off = offset(now, tz);
    let t = Date.UTC(p.y, p.mo - 1, p.d, +m[1], +m[2]) - off;
    const diff = t - now.getTime();
    if (diff < -6 * 3600e3) t += 86400e3;
    else if (diff > 18 * 3600e3) t -= 86400e3;
    return new Date(t);
  }

  /** "YYYY-MM-DD HH:MM" local wall time in tz -> Date. */
  function localStampToDate(s, tz) {
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s || '');
    if (!m) return null;
    const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    const off = offset(new Date(guess), tz);
    return new Date(guess - off);
  }

  const U = {
    parts, offset, hhmmToDate, localStampToDate,
    hm(date, tz) { return date ? fmt(tz, { hour: '2-digit', minute: '2-digit' }).format(date) : ''; },
    hms(date, tz) { return fmt(tz, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date); },
    localHour(tz, now = new Date()) { const p = parts(now, tz); return p.h + p.mi / 60; },
    minutesBetween(a, b) { return Math.round((b - a) / 60000); },
    esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    load(key, dflt) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : dflt; } catch (e) { return dflt; } },
    save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ } },
    async fetchJSON(url, opts = {}, timeoutMs = 15000) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        const r = await fetch(url, Object.assign({ signal: ctl.signal, referrerPolicy: 'strict-origin-when-cross-origin' }, opts));
        if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
        return await r.json();
      } finally { clearTimeout(t); }
    },
    titleCase(s) {
      if (!s) return s;
      if (s !== s.toUpperCase() || /[^\x00-ɏ]/.test(s)) return s;
      return s.toLowerCase().replace(/(^|[\s\-/(.'])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
    }
  };
  window.CU = U;
})();
