/* ONWARD — airport FIDS engine.
 * Needs the user's own key for one of: AeroDataBox (RapidAPI), AirLabs, Aviationstack.
 * Quota guard: a monthly request budget the user sets. The refresh interval is
 * stretched so a board left running all month never exceeds that budget, and every
 * call is counted in localStorage. With no key, or a spent budget and stale cache,
 * the board shows a disruption notice. Statuses come only from the provider.
 */
(function () {
  const U = window.CU;
  const CACHE_KEY = 'onward.flightCache.v2'; /* v2: destination-name fix; v1 rows may hold bare airport codes */
  const USAGE_KEY = 'onward.flightUsage';
  const MONTH_MIN = 30 * 24 * 60;

  const AIRPORT_CITY = {
    ATL: 'Atlanta', AUS: 'Austin', BDL: 'Hartford', BNA: 'Nashville', BOS: 'Boston', BUF: 'Buffalo', BWI: 'Baltimore', CHS: 'Charleston', CLE: 'Cleveland', CLT: 'Charlotte',
    CMH: 'Columbus', CVG: 'Cincinnati', DAL: 'Dallas Love', DCA: 'Washington-National', DEN: 'Denver', DFW: 'Dallas/Ft Worth', DTW: 'Detroit', EWR: 'Newark', FLL: 'Fort Lauderdale',
    HNL: 'Honolulu', HOU: 'Houston Hobby', IAD: 'Washington-Dulles', IAH: 'Houston', IND: 'Indianapolis', JAX: 'Jacksonville', JFK: 'New York-JFK', LAS: 'Las Vegas', LAX: 'Los Angeles',
    LGA: 'New York-LaGuardia', MCI: 'Kansas City', MCO: 'Orlando', MDW: 'Chicago Midway', MEM: 'Memphis', MIA: 'Miami', MKE: 'Milwaukee', MSP: 'Minneapolis', MSY: 'New Orleans',
    OAK: 'Oakland', ORD: "Chicago O'Hare", ORF: 'Norfolk', PBI: 'West Palm Beach', PDX: 'Portland', PHL: 'Philadelphia', PHX: 'Phoenix', PIT: 'Pittsburgh', PVD: 'Providence',
    RDU: 'Raleigh/Durham', RIC: 'Richmond', RSW: 'Fort Myers', SAN: 'San Diego', SAT: 'San Antonio', SAV: 'Savannah', SEA: 'Seattle', SFO: 'San Francisco', SJC: 'San Jose',
    SJU: 'San Juan', SLC: 'Salt Lake City', SMF: 'Sacramento', SNA: 'Santa Ana', STL: 'St. Louis', TPA: 'Tampa', ANC: 'Anchorage', OGG: 'Kahului', BUR: 'Burbank', ONT: 'Ontario',
    SYR: 'Syracuse', ROC: 'Rochester', ALB: 'Albany', BTV: 'Burlington', PWM: 'Portland ME', MHT: 'Manchester NH', GSO: 'Greensboro', GSP: 'Greenville', BHM: 'Birmingham',
    OMA: 'Omaha', OKC: 'Oklahoma City', TUL: 'Tulsa', ABQ: 'Albuquerque', ELP: 'El Paso', TUS: 'Tucson', BOI: 'Boise', RNO: 'Reno', PSP: 'Palm Springs', EYW: 'Key West',
    YYZ: 'Toronto', YUL: 'Montreal', YVR: 'Vancouver', YOW: 'Ottawa', YYC: 'Calgary', MEX: 'Mexico City', CUN: 'Cancún', SJD: 'Los Cabos', PVR: 'Puerto Vallarta', GDL: 'Guadalajara',
    LHR: 'London-Heathrow', LGW: 'London-Gatwick', MAN: 'Manchester', DUB: 'Dublin', SNN: 'Shannon', EDI: 'Edinburgh', GLA: 'Glasgow', CDG: 'Paris-CDG', ORY: 'Paris-Orly',
    AMS: 'Amsterdam', FRA: 'Frankfurt', MUC: 'Munich', ZRH: 'Zurich', GVA: 'Geneva', MAD: 'Madrid', BCN: 'Barcelona', LIS: 'Lisbon', FCO: 'Rome', MXP: 'Milan', BRU: 'Brussels',
    CPH: 'Copenhagen', ARN: 'Stockholm', OSL: 'Oslo', HEL: 'Helsinki', KEF: 'Reykjavík', IST: 'Istanbul', ATH: 'Athens', VIE: 'Vienna', WAW: 'Warsaw', PRG: 'Prague', TLV: 'Tel Aviv',
    DXB: 'Dubai', DOH: 'Doha', AUH: 'Abu Dhabi', NRT: 'Tokyo-Narita', HND: 'Tokyo-Haneda', ICN: 'Seoul', PEK: 'Beijing', PVG: 'Shanghai', HKG: 'Hong Kong', TPE: 'Taipei',
    SIN: 'Singapore', MNL: 'Manila', SYD: 'Sydney', MEL: 'Melbourne', AKL: 'Auckland', DEL: 'Delhi', BOM: 'Mumbai', GRU: 'São Paulo', EZE: 'Buenos Aires', BOG: 'Bogotá',
    LIM: 'Lima', SCL: 'Santiago', PTY: 'Panama City', SAL: 'San Salvador', GUA: 'Guatemala City', SJO: 'San José CR', MBJ: 'Montego Bay', NAS: 'Nassau', AUA: 'Aruba',
    PUJ: 'Punta Cana', SDQ: 'Santo Domingo', STT: 'St. Thomas', BGI: 'Barbados', HAV: 'Havana', ADD: 'Addis Ababa', LOS: 'Lagos', ACC: 'Accra', CMN: 'Casablanca', JNB: 'Johannesburg',
    CAI: 'Cairo', SLK: 'Saranac Lake', TIA: 'Tirana', RMO: 'Chisinau', BFS: 'Belfast', PMI: 'Palma de Mallorca', AGP: 'Málaga', NBE: 'Enfidha', PSA: 'Pisa'
  };
  /** Curated city name for an airport code, or '' when the code is not in our tables. */
  const cityOnly = iata => AIRPORT_CITY[iata] || ((window.ONWARD_CITY_I18N || {})[iata] || [])[0] || '';
  /** City name, falling back to the bare code (used by providers that return no airport names). */
  const city = iata => cityOnly(iata) || iata || '';
  /** "Palma de Mallorca Airport" / "Belfast International" -> "Palma de Mallorca" / "Belfast". */
  const cleanApName = n => String(n || '').replace(/\s+(International|Intl\.?|Regional|Municipal|Airport|Airfield|Aeropuerto|Aeroporto|Flughafen)\b.*$/i, '').trim();

  const S = () => window.ONWARD_SETTINGS || {};
  function provider() {
    const s = S();
    if (s.adbKey) return 'aerodatabox';
    if (s.airlabsKey) return 'airlabs';
    if (s.avstackKey) return 'aviationstack';
    return null;
  }
  const monthKey = () => new Date().toISOString().slice(0, 7);
  function usage() { const u = U.load(USAGE_KEY, {}); return u[monthKey()] || 0; }
  function addUsage() { const u = U.load(USAGE_KEY, {}); const k = monthKey(); u[k] = (u[k] || 0) + 1; U.save(USAGE_KEY, u); }
  function budget() { return Math.max(10, +S().flightBudget || 100); }
  /** Minutes between calls so that one board running 24/7 stays inside the budget (with 10% headroom). */
  function intervalMin() { return Math.max(30, Math.ceil(MONTH_MIN / (budget() * 0.9))); }

  /* ── Provider adapters ──────────────────────────────────────────────── */
  const ADB_STATUS = { Boarding: 'BOARDING', GateClosed: 'GATE CLOSED', CheckIn: 'CHECK-IN', Departed: 'DEPARTED', EnRoute: 'DEPARTED', Canceled: 'CANCELLED', CanceledUncertain: 'CANCELLED', Delayed: 'DELAYED', Diverted: 'DIVERTED' };
  const parseUtc = s => s ? new Date(String(s).replace(' ', 'T').replace(/Z?$/, 'Z').replace(/(\+\d\d:\d\d)Z$/, '$1')) : null;

  async function adb(hub, iata) {
    const p = new URLSearchParams({ offsetMinutes: '-30', durationMinutes: '720', direction: 'Departure', withLeg: 'true', withCancelled: 'true', withCodeshared: 'false', withCargo: 'false', withPrivate: 'false', withLocation: 'false' });
    const d = await U.fetchJSON(`https://aerodatabox.p.rapidapi.com/flights/airports/iata/${iata}?${p}`, { headers: { 'X-RapidAPI-Key': S().adbKey, 'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com' } }, 20000);
    return (d.departures || []).map(f => {
      const dep = f.departure || f.movement || {};
      const arr = f.arrival || {};
      const sched = parseUtc((dep.scheduledTime || {}).utc || dep.scheduledTimeUtc);
      const rev = parseUtc((dep.revisedTime || {}).utc || dep.actualTimeUtc || (dep.runwayTime || {}).utc);
      const ap = arr.airport || f.movement && f.movement.airport || {};
      const num = (f.number || '').replace(/\s+/g, ' ');
      return {
        key: num + '|' + (sched && sched.toISOString()), sched, exp: rev, rt: true,
        airline: (f.airline || {}).iata || num.split(' ')[0], airlineName: (f.airline || {}).name || '',
        flight: num, dest: ap.municipalityName || ap.shortName || cityOnly(ap.iata) || cleanApName(ap.name || ap.fullName) || ap.iata || '', destCode: ap.iata || '',
        gate: dep.gate || '', terminal: dep.terminal || '', status: ADB_STATUS[f.status] || '', rawStatus: f.status || '',
        cancelled: /cancel/i.test(f.status || '')
      };
    });
  }

  async function airlabs(hub, iata) {
    const d = await U.fetchJSON(`https://airlabs.co/api/v9/schedules?dep_iata=${iata}&api_key=${encodeURIComponent(S().airlabsKey)}`);
    if (d.error) throw new Error(d.error.message || 'AirLabs error');
    return (d.response || []).filter(f => !f.cs_flight_iata).map(f => {
      const sched = parseUtc(f.dep_time_utc);
      const exp = parseUtc(f.dep_estimated_utc || f.dep_actual_utc);
      const st = (f.status || '').toLowerCase();
      return {
        key: f.flight_iata + '|' + f.dep_time_utc, sched, exp, rt: true,
        airline: f.airline_iata || '', flight: (f.airline_iata || '') + ' ' + (f.flight_number || ''), dest: city(f.arr_iata), destCode: f.arr_iata || '',
        gate: f.dep_gate || '', terminal: f.dep_terminal || '',
        status: st === 'cancelled' ? 'CANCELLED' : (st === 'active' || st === 'landed') ? 'DEPARTED' : (f.delayed > 5 ? 'DELAYED' : ''),
        cancelled: st === 'cancelled'
      };
    });
  }

  async function aviationstack(hub, iata) {
    const d = await U.fetchJSON(`https://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(S().avstackKey)}&dep_iata=${iata}&limit=100`);
    if (d.error) throw new Error(d.error.message || 'Aviationstack error');
    /* Aviationstack labels airport-local wall times as +00:00; read them as local time. */
    const local = s => s ? U.localStampToDate(s.slice(0, 16), hub.tz) : null;
    return (d.data || []).filter(f => !(f.flight && f.flight.codeshared)).map(f => {
      const dep = f.departure || {}, arr = f.arrival || {};
      const st = f.flight_status || '';
      return {
        key: (f.flight || {}).iata + '|' + dep.scheduled, sched: local(dep.scheduled), exp: local(dep.estimated), rt: true,
        airline: (f.airline || {}).iata || '', airlineName: (f.airline || {}).name || '', flight: ((f.airline || {}).iata || '') + ' ' + ((f.flight || {}).number || ''),
        dest: city(arr.iata) !== arr.iata ? city(arr.iata) : (arr.airport || arr.iata || ''), destCode: arr.iata || '',
        gate: dep.gate || '', terminal: dep.terminal || '',
        status: st === 'cancelled' ? 'CANCELLED' : (st === 'active' || st === 'landed') ? 'DEPARTED' : st === 'diverted' ? 'DIVERTED' : ((dep.delay || 0) > 5 ? 'DELAYED' : ''),
        cancelled: st === 'cancelled'
      };
    });
  }

  const ADAPTERS = { aerodatabox: adb, airlabs, aviationstack };
  const NAMES = { aerodatabox: 'AeroDataBox', airlabs: 'AirLabs', aviationstack: 'Aviationstack' };

  async function fetchFlights(hub, src) {
    const prov = provider();
    if (!prov) { const e = new Error('no flight-data key'); e.fatal = true; e.noKey = true; throw e; }
    const cache = U.load(CACHE_KEY, {});
    const c = cache[src.iata];
    const ageMin = c ? (Date.now() - c.t) / 60000 : Infinity;
    let rows, fetchedAt, fromCache = false;
    if (c && c.prov === prov && ageMin < intervalMin()) {
      rows = c.rows; fetchedAt = new Date(c.t); fromCache = true;
    } else if (usage() >= budget()) {
      if (!c || ageMin > 12 * 60) { const e = new Error('monthly budget spent'); e.fatal = true; e.budget = true; throw e; }
      rows = c.rows; fetchedAt = new Date(c.t); fromCache = true;
    } else {
      addUsage();
      try {
        rows = (await ADAPTERS[prov](hub, src.iata)).filter(r => r.sched);
      } catch (e) {
        if (c && ageMin < 12 * 60) { rows = c.rows; fetchedAt = new Date(c.t); fromCache = true; }
        else { e.fatal = true; throw e; }
      }
      if (!fromCache) {
        fetchedAt = new Date();
        cache[src.iata] = { t: fetchedAt.getTime(), prov, rows: rows.map(r => Object.assign({}, r, { sched: r.sched && r.sched.toISOString(), exp: r.exp && r.exp.toISOString() })) };
        U.save(CACHE_KEY, cache);
      }
    }
    rows = rows.map(r => Object.assign({}, r, { sched: new Date(r.sched), exp: r.exp ? new Date(r.exp) : null }));
    const age = (Date.now() - fetchedAt) / 60000;
    /* Hours-old "on time" is not a claim we can still make; older cached rows lose live wording. */
    for (const r of rows) {
      if (age > 60) r.rt = false;
      if (!r.status && r.rt) r.status = r.exp && (r.exp - r.sched) > 5 * 60000 ? 'DELAYED' : 'ON TIME';
      if (!r.status) r.status = 'SCHEDULED';
    }
    rows = rows.filter(r => r.status !== 'DEPARTED' || (Date.now() - (r.exp || r.sched)) < 10 * 60000);
    return {
      rows,
      meta: {
        source: NAMES[prov], live: !fromCache || age < 60, cached: fromCache, cachedAt: fetchedAt,
        usage: usage(), budget: budget(), intervalMin: intervalMin(), allowEmpty: true
      }
    };
  }

  window.FlightEngine = { fetch: fetchFlights, provider, usage, budget, intervalMin, NAMES };
})();
