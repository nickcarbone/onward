/* ONWARD — hub catalogue.
 * Every hub lists its data sources in priority order. The first source that
 * answers wins; if every source fails, the board shows a "service disruption"
 * notice instead of made-up departures.
 *
 * Source types (see js/sources.js):
 *   darwin     — UK National Rail live (Rail Data Marketplace key, else Huxley2 community proxy)
 *   sbb        — Swiss live stationboard (transport.opendata.ch, no key)
 *   transitous — published timetables worldwide, with live updates where operators provide them
 *   amtraker   — Amtrak live overlay on top of a transitous board
 *   flights    — airport FIDS (needs a user key: AeroDataBox, AirLabs or Aviationstack)
 *
 * Transitous options: stopId, radius (metres, pulls in sibling platforms),
 * modes (allowed MOTIS modes), excludeAgencies (regex), bilingual (jp only).
 */
const RAIL_MODES = ['HIGHSPEED_RAIL', 'LONG_DISTANCE', 'NIGHT_RAIL', 'REGIONAL_FAST_RAIL', 'REGIONAL_RAIL', 'SUBURBAN', 'RAIL'];
const MAINLINE = ['HIGHSPEED_RAIL', 'LONG_DISTANCE', 'NIGHT_RAIL', 'REGIONAL_FAST_RAIL', 'REGIONAL_RAIL'];

window.ONWARD_HUBS = [
  /* ── United Kingdom — National Rail dot-matrix ───────────────────────── */
  { id: 'PAD', name: 'London Paddington', short: 'Paddington', country: 'United Kingdom', theme: 'uk-rail', tz: 'Europe/London', lat: 51.5160, lon: -0.1770,
    sources: [{ type: 'darwin', crs: 'PAD' }, { type: 'transitous', stopId: 'gb-national-rail_910GPADTON', modes: RAIL_MODES }] },
  { id: 'KGX', name: "London King's Cross", short: "King's Cross", country: 'United Kingdom', theme: 'uk-rail', tz: 'Europe/London', lat: 51.5320, lon: -0.1233,
    sources: [{ type: 'darwin', crs: 'KGX' }, { type: 'transitous', stopId: 'gb-national-rail_910GKNGX', modes: RAIL_MODES }] },
  { id: 'WAT', name: 'London Waterloo', short: 'Waterloo', country: 'United Kingdom', theme: 'uk-rail', tz: 'Europe/London', lat: 51.5031, lon: -0.1132,
    sources: [{ type: 'darwin', crs: 'WAT' }, { type: 'transitous', stopId: 'gb-national-rail_910GWATRLMN', modes: RAIL_MODES }] },
  { id: 'MAN', name: 'Manchester Piccadilly', short: 'Manchester Piccadilly', country: 'United Kingdom', theme: 'uk-rail', tz: 'Europe/London', lat: 53.4774, lon: -2.2309,
    sources: [{ type: 'darwin', crs: 'MAN' }, { type: 'transitous', stopId: 'gb-national-rail_910GMNCRPIC', modes: RAIL_MODES }] },
  { id: 'EDB', name: 'Edinburgh Waverley', short: 'Edinburgh', country: 'United Kingdom', theme: 'uk-rail', tz: 'Europe/London', lat: 55.9520, lon: -3.1880,
    sources: [{ type: 'darwin', crs: 'EDB' }, { type: 'transitous', stopId: 'gb-national-rail_910GEDINBUR', modes: RAIL_MODES }] },

  /* ── Japan — JR LED boards (published timetables) ────────────────────── */
  { id: 'TYO', name: 'Tokyo — Shinkansen', short: '東京 Tokyo', local: '東京', country: 'Japan', theme: 'jp-rail', tz: 'Asia/Tokyo', lat: 35.6810, lon: 139.7680,
    sources: [{ type: 'transitous', stopId: 'jp-japan-rail_1748', modes: ['HIGHSPEED_RAIL'], bilingual: true }] },
  { id: 'SJK', name: 'Shinjuku', short: '新宿 Shinjuku', local: '新宿', country: 'Japan', theme: 'jp-rail', tz: 'Asia/Tokyo', lat: 35.6900, lon: 139.7003,
    sources: [{ type: 'transitous', stopId: 'jp-japan-rail_5304', modes: RAIL_MODES, bilingual: true }] },
  { id: 'KYO', name: 'Kyoto', short: '京都 Kyoto', local: '京都', country: 'Japan', theme: 'jp-rail', tz: 'Asia/Tokyo', lat: 34.9846, lon: 135.7584,
    sources: [{ type: 'transitous', stopId: 'jp-japan-rail_2784', modes: RAIL_MODES, excludeAgencies: '京都市交通局', bilingual: true }] },
  { id: 'OSA', name: 'Shin-Osaka — Shinkansen', short: '新大阪 Shin-Osaka', local: '新大阪', country: 'Japan', theme: 'jp-rail', tz: 'Asia/Tokyo', lat: 34.7337, lon: 135.5011,
    sources: [{ type: 'transitous', stopId: 'jp-japan-rail_2815', modes: ['HIGHSPEED_RAIL'], bilingual: true }] },

  /* ── Switzerland — SBB style ─────────────────────────────────────────── */
  { id: 'ZRH', name: 'Zürich HB', short: 'Zürich HB', country: 'Switzerland', theme: 'eu-rail', tz: 'Europe/Zurich', lat: 47.3782, lon: 8.5402,
    sources: [{ type: 'sbb', station: '8503000' }, { type: 'transitous', stopId: 'at-Railway-Current-Reference-Data-2026_ch:23026:688:91:3', radius: 300, modes: RAIL_MODES }] },
  { id: 'BRN', name: 'Bern', short: 'Bern', country: 'Switzerland', theme: 'eu-rail', tz: 'Europe/Zurich', lat: 46.9490, lon: 7.4390,
    sources: [{ type: 'sbb', station: '8507000' }, { type: 'transitous', stopId: 'de-DELFI_ch:1:sloid:7000', radius: 300, modes: RAIL_MODES }] },
  { id: 'GVA', name: 'Genève Cornavin', short: 'Genève', country: 'Switzerland', theme: 'eu-rail', tz: 'Europe/Zurich', lat: 46.2100, lon: 6.1420,
    sources: [{ type: 'sbb', station: '8501008' }, { type: 'transitous', stopId: 'ch-opentransportdataswiss26_Parentch:1:sloid:1008', radius: 300, modes: RAIL_MODES }] },
  { id: 'LUZ', name: 'Luzern', short: 'Luzern', country: 'Switzerland', theme: 'eu-rail', tz: 'Europe/Zurich', lat: 47.0500, lon: 8.3100,
    sources: [{ type: 'sbb', station: '8505000' }, { type: 'transitous', stopId: 'ch-opentransportdataswiss26_Parentch:1:sloid:5000', radius: 300, modes: RAIL_MODES }] },

  /* ── Netherlands — NS (live via Transitous / NS realtime feed) ───────── */
  { id: 'ASD', name: 'Amsterdam Centraal', short: 'Amsterdam C.', country: 'Netherlands', theme: 'nl-rail', tz: 'Europe/Amsterdam', lat: 52.3789, lon: 4.9003,
    sources: [{ type: 'transitous', stopId: 'de-DELFI_000008400058', radius: 250, modes: RAIL_MODES }] },
  { id: 'UT', name: 'Utrecht Centraal', short: 'Utrecht C.', country: 'Netherlands', theme: 'nl-rail', tz: 'Europe/Amsterdam', lat: 52.0894, lon: 5.1101,
    sources: [{ type: 'transitous', stopId: 'de-DELFI_000008400621', radius: 250, modes: RAIL_MODES }] },

  /* ── Germany — DB style ──────────────────────────────────────────────── */
  { id: 'BLS', name: 'Berlin Hbf', short: 'Berlin Hbf', country: 'Germany', theme: 'de-rail', tz: 'Europe/Berlin', lat: 52.5251, lon: 13.3694,
    sources: [{ type: 'transitous', stopId: 'at-Railway-Current-Reference-Data-2026_de:11000:900003200:2:52', radius: 300, modes: RAIL_MODES }] },
  { id: 'FFM', name: 'Frankfurt (Main) Hbf', short: 'Frankfurt Hbf', country: 'Germany', theme: 'de-rail', tz: 'Europe/Berlin', lat: 50.1070, lon: 8.6630,
    sources: [{ type: 'transitous', stopId: 'at-Railway-Current-Reference-Data-2026_de:06412:10:16:16', radius: 300, modes: RAIL_MODES }] },

  /* ── France — SNCF style ─────────────────────────────────────────────── */
  { id: 'PNO', name: 'Paris Gare du Nord', short: 'Paris Nord', country: 'France', theme: 'fr-rail', tz: 'Europe/Paris', lat: 48.8809, lon: 2.3553,
    sources: [{ type: 'transitous', stopId: 'fr-horaires-sncf_FR::LMU:ab071640-cb0a-11e8-8bfa-f784c1c7c611:', modes: MAINLINE }] },
  { id: 'PLY', name: 'Paris Gare de Lyon', short: 'Paris Gare de Lyon', country: 'France', theme: 'fr-rail', tz: 'Europe/Paris', lat: 48.8443, lon: 2.3743,
    sources: [{ type: 'transitous', stopId: 'fr-horaires-sncf_FR::LMU:6451bcf0-cb0a-11e8-8bfa-f784c1c7c611:', modes: MAINLINE }] },

  /* ── Spain — Adif style ──────────────────────────────────────────────── */
  { id: 'MAD', name: 'Madrid Puerta de Atocha', short: 'Madrid Atocha', country: 'Spain', theme: 'es-rail', tz: 'Europe/Madrid', lat: 40.4065, lon: -3.6893,
    sources: [{ type: 'transitous', stopId: 'es-RENFE-Larga-Distancia-y-AVE_60000', radius: 300, modes: ['HIGHSPEED_RAIL', 'LONG_DISTANCE', 'NIGHT_RAIL'] }] },
  { id: 'BCN', name: 'Barcelona Sants', short: 'Barcelona Sants', country: 'Spain', theme: 'es-rail', tz: 'Europe/Madrid', lat: 41.3790, lon: 2.1400,
    sources: [{ type: 'transitous', stopId: 'es-Ouigo_007171801', radius: 300, modes: ['HIGHSPEED_RAIL', 'LONG_DISTANCE', 'NIGHT_RAIL'] }] },

  /* ── Italy — classic split-flap ──────────────────────────────────────── */
  { id: 'MIL', name: 'Milano Centrale', short: 'Milano Centrale', country: 'Italy', theme: 'solari-flap', tz: 'Europe/Rome', lat: 45.4860, lon: 9.2040,
    sources: [{ type: 'transitous', stopId: 'it-trenitalia_01700:station', radius: 200, modes: RAIL_MODES }] },
  { id: 'ROM', name: 'Roma Termini', short: 'Roma Termini', country: 'Italy', theme: 'solari-flap', tz: 'Europe/Rome', lat: 41.9010, lon: 12.5010,
    sources: [{ type: 'transitous', stopId: 'it-trenitalia_08409:station', radius: 200, modes: RAIL_MODES }] },

  /* ── United States — rail ────────────────────────────────────────────── */
  { id: 'NYP', name: 'New York Penn Station', short: 'Penn Station', country: 'United States', theme: 'us-rail', tz: 'America/New_York', lat: 40.7506, lon: -73.9935,
    sources: [{ type: 'transitous', stopId: 'us-Amtrak_NYP', radius: 350, modes: RAIL_MODES, amtrak: 'NYP' }] },
  { id: 'WAS', name: 'Washington Union Station', short: 'Union Station', country: 'United States', theme: 'us-rail', tz: 'America/New_York', lat: 38.8973, lon: -77.0063,
    sources: [{ type: 'transitous', stopId: 'us-Amtrak_WAS', radius: 300, modes: RAIL_MODES, amtrak: 'WAS' }] },

  /* ── International airports (need a flight-data key) ────────────────── */
  { id: 'LHR', name: 'London Heathrow', short: 'Heathrow', country: 'United Kingdom', theme: 'uk-airport', tz: 'Europe/London', lat: 51.4700, lon: -0.4543, sources: [{ type: 'flights', iata: 'LHR' }] },
  { id: 'LGW', name: 'London Gatwick', short: 'Gatwick', country: 'United Kingdom', theme: 'uk-airport', tz: 'Europe/London', lat: 51.1537, lon: -0.1821, sources: [{ type: 'flights', iata: 'LGW' }] },
  { id: 'AMS', name: 'Amsterdam Schiphol', short: 'Schiphol', country: 'Netherlands', theme: 'nl-airport', tz: 'Europe/Amsterdam', lat: 52.3105, lon: 4.7683, sources: [{ type: 'flights', iata: 'AMS' }] },
  { id: 'FRA', name: 'Frankfurt Airport — Terminal 1', short: 'Frankfurt Airport', country: 'Germany', theme: 'de-airport', tz: 'Europe/Berlin', lat: 50.0379, lon: 8.5622, sources: [{ type: 'flights', iata: 'FRA' }] },
  { id: 'HND', name: 'Tokyo Haneda', short: 'Haneda', country: 'Japan', theme: 'jp-airport', tz: 'Asia/Tokyo', lat: 35.5494, lon: 139.7798, sources: [{ type: 'flights', iata: 'HND' }],
    localNames: { ja: '東京国際空港(羽田)', en: 'Tokyo International Airport (Haneda)', zh: '東京國際機場(羽田)', ko: '도쿄 국제공항(하네다)' } },
  { id: 'NRT', name: 'Tokyo Narita', short: 'Narita', country: 'Japan', theme: 'jp-airport', tz: 'Asia/Tokyo', lat: 35.7720, lon: 140.3929, sources: [{ type: 'flights', iata: 'NRT' }],
    localNames: { ja: '成田国際空港', en: 'Narita International Airport', zh: '成田國際機場', ko: '나리타 국제공항' } },
  { id: 'HKG', name: 'Hong Kong International', short: 'Hong Kong', country: 'Hong Kong', theme: 'hk-airport', tz: 'Asia/Hong_Kong', lat: 22.3080, lon: 113.9185, sources: [{ type: 'flights', iata: 'HKG' }],
    localNames: { zh: '香港國際機場', en: 'Hong Kong International Airport' } },
  { id: 'SIN', name: 'Singapore Changi', short: 'Changi', country: 'Singapore', theme: 'sg-airport', tz: 'Asia/Singapore', lat: 1.3644, lon: 103.9915, sources: [{ type: 'flights', iata: 'SIN' }] },

  /* ── United States — airports (needs a flight-data key) ──────────────── */
  { id: 'JFK', name: 'New York JFK', short: 'JFK', country: 'United States', theme: 'us-airport', tz: 'America/New_York', lat: 40.6413, lon: -73.7781, sources: [{ type: 'flights', iata: 'JFK' }] },
  { id: 'DCA', name: 'Washington National (DCA)', short: 'DCA', country: 'United States', theme: 'us-airport', tz: 'America/New_York', lat: 38.8512, lon: -77.0402, sources: [{ type: 'flights', iata: 'DCA' }] },
  { id: 'ORD', name: "Chicago O'Hare", short: 'ORD', country: 'United States', theme: 'us-airport', tz: 'America/Chicago', lat: 41.9742, lon: -87.9073, sources: [{ type: 'flights', iata: 'ORD' }] },
  { id: 'ATL', name: 'Atlanta Hartsfield-Jackson', short: 'ATL', country: 'United States', theme: 'us-airport', tz: 'America/New_York', lat: 33.6407, lon: -84.4277, sources: [{ type: 'flights', iata: 'ATL' }] },
  { id: 'LAX', name: 'Los Angeles LAX', short: 'LAX', country: 'United States', theme: 'us-airport', tz: 'America/Los_Angeles', lat: 33.9416, lon: -118.4085, sources: [{ type: 'flights', iata: 'LAX' }] },
  { id: 'EWR', name: 'Newark Liberty', short: 'EWR', country: 'United States', theme: 'us-airport', tz: 'America/New_York', lat: 40.6895, lon: -74.1745, sources: [{ type: 'flights', iata: 'EWR' }] },
  { id: 'IAD', name: 'Washington Dulles', short: 'IAD', country: 'United States', theme: 'us-airport', tz: 'America/New_York', lat: 38.9531, lon: -77.4565, sources: [{ type: 'flights', iata: 'IAD' }] },
  { id: 'BOS', name: 'Boston Logan', short: 'BOS', country: 'United States', theme: 'us-airport', tz: 'America/New_York', lat: 42.3656, lon: -71.0096, sources: [{ type: 'flights', iata: 'BOS' }] },
  { id: 'MIA', name: 'Miami International', short: 'MIA', country: 'United States', theme: 'us-airport', tz: 'America/New_York', lat: 25.7959, lon: -80.2870, sources: [{ type: 'flights', iata: 'MIA' }] },
  { id: 'SEA', name: 'Seattle-Tacoma', short: 'SEA', country: 'United States', theme: 'us-airport', tz: 'America/Los_Angeles', lat: 47.4502, lon: -122.3088, sources: [{ type: 'flights', iata: 'SEA' }] },
  { id: 'SFO', name: 'San Francisco SFO', short: 'SFO', country: 'United States', theme: 'us-airport', tz: 'America/Los_Angeles', lat: 37.6213, lon: -122.3790, sources: [{ type: 'flights', iata: 'SFO' }] }
];

/* Board titles in each vernacular. */
window.ONWARD_THEME_META = {
  'uk-rail':     { title: 'Departures', label: 'UK National Rail' },
  'jp-rail':     { title: '発車案内', titleAlt: 'Departures', label: 'Japan · JR' },
  'eu-rail':     { title: 'Abfahrt · Départ · Partenza', label: 'Switzerland · SBB' },
  'nl-rail':     { title: 'Vertrek', titleAlt: 'Departures', label: 'Netherlands · NS' },
  'de-rail':     { title: 'Abfahrt', titleAlt: 'Departure', label: 'Germany · DB' },
  'fr-rail':     { title: 'Départs', titleAlt: 'Departures', label: 'France · SNCF' },
  'es-rail':     { title: 'Salidas', titleAlt: 'Departures', label: 'Spain · Adif' },
  'solari-flap': { title: 'Partenze', titleAlt: 'Departures', label: 'Italy · Split-flap' },
  'us-rail':     { title: 'Departures', label: 'US Rail' },
  'us-airport':  { title: 'Departures', label: 'US Airport FIDS' },
  'uk-airport':  { title: 'Departures', label: 'Heathrow-style (BAA black & yellow)' },
  'nl-airport':  { title: 'Departures', label: 'Schiphol-style (blue & yellow)' },
  'de-airport':  { title: 'Abflug', titleAlt: 'Departures', label: 'Frankfurt T1 split-flap' },
  'jp-airport':  { title: '出発', titleAlt: 'Departures', label: 'Haneda-style (4 languages)' },
  'hk-airport':  { title: '離港', titleAlt: 'Departures', label: 'Hong Kong (Chinese / English)' },
  'sg-airport':  { title: 'Departures', label: 'Changi-style (yellow & blue)' }
};
