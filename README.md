# Onward

An ambient departure board for a second monitor. Pick a station or airport and the board takes on that country's signage style, showing real departures.

**Rule: nothing is invented.** Every row comes from a published feed. When a board is live, the corner badge says `LIVE`. When it is showing the operator's published timetable, the badge says `TIMETABLE`. When every source for a hub is down, the board shows a service-disruption notice in the local style rather than placeholder trains.

## Deploy

1. Upload the whole folder to a GitHub repository, keeping the structure as it is.
2. In the repository, go to **Settings → Pages**, set the source to the `main` branch, root folder.
3. Open `https://<user>.github.io/<repo>/`. Deep-link a hub with a hash, e.g. `#ZRH` or `#NYP`.

The page also works when opened straight from disk (no build step, no server needed).

## Hubs and data sources

| Board style | Hubs | Source | Live? |
|---|---|---|---|
| UK dot-matrix | London Paddington, King's Cross, Waterloo, Manchester Piccadilly, Edinburgh | National Rail Darwin via the Huxley2 community proxy, or directly with a Rail Data Marketplace key | Live |
| JR LED (bilingual) | Tokyo (Shinkansen), Shinjuku, Kyoto, Shin-Osaka (Shinkansen) | Transitous (published timetables) | Timetable |
| SBB | Zürich HB, Bern, Genève, Luzern | transport.opendata.ch | Live |
| NS | Amsterdam Centraal, Utrecht Centraal | Transitous (NS real-time feed) | Live |
| DB | Berlin Hbf, Frankfurt Hbf | Transitous (DB real-time where published) | Mostly live |
| SNCF | Paris Gare du Nord, Paris Gare de Lyon | Transitous | Timetable |
| Adif | Madrid Atocha, Barcelona Sants | Transitous | Timetable |
| Split-flap | Milano Centrale, Roma Termini | Transitous | Timetable |
| US rail | New York Penn, Washington Union Station | Transitous (LIRR live) + Amtraker (Amtrak live overlay) | Partly live |
| US airport FIDS | JFK, EWR, DCA, IAD, BOS, MIA, ORD, ATL, LAX, SFO, SEA | AeroDataBox, AirLabs or Aviationstack, with your key | Live with a key |
| Heathrow style (BAA black & yellow) | London Heathrow, London Gatwick | same | Live with a key |
| Schiphol style (blue, yellow for departures) | Amsterdam Schiphol | same | Live with a key |
| Frankfurt T1 split-flap, with boarding lamps | Frankfurt | same | Live with a key |
| Haneda style (Japanese / English / Chinese / Korean rotation) | Tokyo Haneda, Tokyo Narita | same | Live with a key |
| Hong Kong (Chinese / English alternation) | Hong Kong | same | Live with a key |
| Changi style (yellow primary, blue secondary) | Singapore Changi | same | Live with a key |

Hubs, stop IDs and source order live in `data/hubs.js`. Add a hub by copying an entry; find Transitous stop IDs with `https://api.transitous.org/api/v1/geocode?text=<name>`.

## Keys (Settings, ⚙)

- **UK:** optional. Boards are already live through Huxley2. A free Rail Data Marketplace key (product “Live Departure Board”) connects straight to Darwin. If your key's endpoint URL differs from the default, paste it from the product's Specification tab.
- **Airports:** one key needed. AeroDataBox via RapidAPI has an instant free tier; AirLabs and Aviationstack also work. Set your monthly request budget: the board spaces its refreshes so a board left running all month stays inside it, counts every call, and falls back to cached data, then to a service notice. At the default budget of 100 calls, one airport refreshes every 8 hours, so raise the budget to match your plan.

Keys stay in your browser's localStorage and are only sent to their own provider.

Airport board styles follow each airport's published signage palette and, where documented, its board conventions (Frankfurt's 1972 split-flap boards with green and red boarding lamps; Haneda's four-language screens). Destination names in Japanese, Chinese and Korean come from `data/airport-i18n.js`; airports not listed there show the provider's English name.

## What the board will and won't claim

- Statuses (“On time”, “Boarding”, “Gate closed”, delays, platform changes) are shown only when a live source reports them. Timetable rows have an empty status column.
- Cached flight data more than an hour old drops to “SCHEDULED”.
- Heathrow-style boards say “Wait in lounge” only when live data has no gate yet, and “Go to gate” once one is assigned.
- Japanese service types come from the train name (e.g. のぞみ → Shinkansen, 新快速 → Special Rapid). Where the feed gives only a number, the board shows the operator rather than guessing “Local”. “16 cars” is shown only for Nozomi, all of which run as 16-car sets.
- The spec's coach-position (A–D sector) bar is left out: none of the free Swiss sources publish train formations.

## Sound

Off by default; click 🔇 Sound. Everything is synthesised with Web Audio. The UK chime uses the opening of the Westminster Quarters (1793, public domain). The others are original figures in each region's idiom. Operator sound logos (SNCF, SBB, JR departure melodies) are trademarked or copyrighted and are deliberately not reproduced. “Room tone” adds low, filtered concourse noise.

## Controls

The control bar hides after 4 seconds without mouse movement. ← / → cycle hubs, `F` toggles fullscreen. Auto-roam moves to a new hub every 10, 20 or 30 minutes; with “Rush hour” ticked it favours hubs in their local weekday rush.

## Attribution

- Timetables: [Transitous](https://transitous.org/sources/) and its sources; map data © OpenStreetMap contributors. Transitous is volunteer-run and free for open-source, non-commercial projects. Keep this repository public and licensed as below.
- UK: National Rail Enquiries / Rail Delivery Group (Darwin), via [Huxley2](https://github.com/jpsingleton/Huxley2).
- Switzerland: [transport.opendata.ch](https://transport.opendata.ch/).
- Amtrak: [Amtraker](https://amtraker.com/).
- Fonts: Google Fonts (Doto, DotGothic16, Inter, Roboto Condensed and others).

Board styles are evocations of national signage. They don't copy any operator's logos or proprietary typefaces, and the station clock is a generic railway clock.

## Licence

MIT. See `LICENSE`.
