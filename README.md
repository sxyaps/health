# HealthPulse — Daily Wellness Tracker PWA

A production-ready, privacy-first Progressive Web App for daily health check-ins and personalized wellness insights. Built with vanilla JavaScript, fully offline-capable, and installable on iOS and Android.

---

## Features

- **Daily Check-in System** — Rate mood, physical condition, sleep, nutrition, stress (1–5 scale), and log symptoms as free text.
- **Metrics Tracking** — Manually record weight (kg), sleep hours, and workout minutes.
- **Smart Insights Engine** — After 7+ check-ins, view trends, receive rule-based advice, and discover patterns in your data.
- **Chat Interface** — Ask natural-language questions about your health data and receive data-driven responses.
- **Monthly Reports** — After 30 days, generate a comprehensive report covering habits, improvements, warnings, and suggestions.
- **Daily Reminders** — Schedule push notifications via the Web Notifications API.
- **Bilingual** — Full English and Dutch (NL) support with language switching.
- **Offline-First** — Service Worker caches all assets; the app works completely without internet.
- **Privacy-First** — All data stays on your device. No backend, no tracking, no external API calls.

---

## Quick Start

### Option A: Local Server (Recommended)

PWAs require HTTP for Service Worker registration. Use any local server:

```bash
# Python 3
cd heatlh
python -m http.server 8080

# Node.js (npx, no install needed)
cd heatlh
npx serve .

# PHP
cd heatlh
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

### Option B: Direct File Opening

Open `index.html` directly in a browser. Core features work, but Service Worker caching and notifications require HTTP.

### Installing as a PWA

1. Open the app in Chrome, Edge, or Safari.
2. Look for the "Install" or "Add to Home Screen" prompt.
3. On iOS Safari: tap Share → "Add to Home Screen".
4. The app will appear as a standalone app on your device.

---

## File Structure

```
heatlh/
├── index.html      — App shell HTML, screen containers, meta tags
├── styles.css      — Complete stylesheet with CSS variables for theming
├── app.js          — Main controller: init, routing, screens, events
├── storage.js      — Data layer: IndexedDB + localStorage wrapper
├── insights.js     — Analysis engine: trends, advice, patterns, reports, chat
├── ui.js           — UI helpers: translations, components, icons
├── sw.js           — Service Worker: offline caching
├── manifest.json   — PWA manifest for installability
├── icon.svg        — App icon (heart + pulse line)
└── README.md       — This file
```

### Architecture

```
┌───────────────────────────────┐
│          index.html           │  ← App shell (minimal HTML)
├───────────────────────────────┤
│            app.js             │  ← Controller (routing, events, rendering)
├──────────┬──────────┬─────────┤
│  ui.js   │insights.js│        │  ← View helpers │ Analysis engine
├──────────┴──────────┴─────────┤
│          storage.js           │  ← Data persistence layer
├───────────────────────────────┤
│      IndexedDB + localStorage │  ← Browser storage APIs
└───────────────────────────────┘
```

**Separation of concerns:**
- **UI Layer** (`ui.js`) — Translations, component builders, screen management. No data logic.
- **Logic Layer** (`insights.js`) — Pure functions for analysis. No DOM access.
- **Data Layer** (`storage.js`) — IndexedDB/localStorage operations. No UI or analysis logic.
- **Controller** (`app.js`) — Orchestrates all layers. Handles user interaction.

---

## How Data is Stored

### IndexedDB (Structured Data)

Two object stores inside the `healthpulse_db` database:

**`checkins` store:**
```json
{
  "id": 1,
  "date": "2026-02-15",
  "mood": 4,
  "physical": 3,
  "sleep": 4,
  "nutrition": 3,
  "stress": 2,
  "symptoms": "slight headache",
  "timestamp": 1739577600000
}
```

**`metrics` store:**
```json
{
  "id": 1,
  "date": "2026-02-15",
  "weight": 75.5,
  "sleepHours": 7.5,
  "workoutMinutes": 30,
  "timestamp": 1739577600000
}
```

Both stores use a `date` index (unique) for upsert-by-date behavior — one record per day.

### localStorage (Preferences)

Stored with `hp_` prefix:
- `hp_language` — `"en"` or `"nl"`
- `hp_onboarded` — `true` after first language selection
- `hp_reminders` — `true`/`false`
- `hp_reminderTime` — `"09:00"` (HH:MM format)

---

## How the Logic Works

### Trend Detection (`insights.js → analyzeTrends`)

For each metric field (mood, physical, sleep, nutrition, stress):
1. Collect all historical values.
2. Split into first-half and second-half.
3. Compare averages with a threshold of ±0.3.
4. Classify as **improving**, **declining**, or **stable**.
5. Stress is inverted (lower stress = improving).

### Advice Generation (`insights.js → generateAdvice`)

Rule-based system with 12+ rules. Each rule checks a condition and outputs bilingual advice:

| Rule | Condition | Type |
|------|-----------|------|
| Low mood | Mood avg < 2.5 | Warning |
| Mood improving | Trend = improving | Positive |
| Poor sleep | Sleep avg < 2.5 | Warning |
| High stress | Stress avg > 3.5 | Warning |
| Low nutrition | Nutrition avg < 2.5 | Warning |
| Good overall | Wellness score > 3.5 | Positive |
| Stress-sleep link | High stress + low sleep | Info |
| Low exercise | Workout avg < 15 min | Info |
| Short sleep | Sleep hours < 7 | Warning |
| Healthy sleep | Sleep hours 7–9 | Positive |

### Pattern Detection (`insights.js → detectPatterns`)

Examines data for:
- **Weekend vs weekday mood** differences (>0.5 threshold)
- **Mood-physical correlation** (Pearson r > 0.6)
- **Persistent high stress** (5+ of last 7 days ≥ 4)
- **Frequent symptoms** (7+ of last 14 days)
- **Low nutrition streak** (4+ of last 7 days ≤ 2)
- **Multi-area improvement** (3+ fields improving)

### Chat Processing (`insights.js → processChat`)

Keyword matching maps user intent to data queries:

| Keywords | Response |
|----------|----------|
| mood, stemming, feeling | Mood average + trend + recent values |
| sleep, slaap, tired | Sleep quality + hours if available |
| stress, spanning | Stress level + management tip |
| nutrition, voeding | Nutrition score + advice |
| physical, workout | Physical condition + exercise stats |
| summary, progress | Full multi-metric summary |
| advice, tip, help | Top 4 advice items |
| weight, gewicht | Weight change over time |

### Monthly Report (`insights.js → generateReport`)

Generated after 30+ check-ins. Four sections:

1. **Habits** — Check-in count, per-field averages, metric averages.
2. **Improvements** — Fields with improving trends.
3. **Warnings** — Declining fields, persistently low mood alert.
4. **Suggestions** — Actionable advice based on weak areas.

---

## How to Extend

### Adding a New Check-in Field

1. **`ui.js`** — Add scale labels to both `en` and `nl` in `TRANSLATIONS` (e.g., `energy_1` through `energy_5`).
2. **`app.js`** — Add entry to `CHECKIN_STEPS` array:
   ```js
   { field: 'energy', questionKey: 'checkin_energy', type: 'rating' }
   ```
3. **`insights.js`** — Add `'energy'` to the `CHECKIN_FIELDS` array. Trend detection and advice rules will automatically include it. Add specific advice rules as needed.

### Adding New Advice Rules

In `insights.js → generateAdvice()`, add a new rule block:

```js
if (trends.yourField.average < threshold) {
  advice.push({
    type: 'warning',  // 'warning', 'positive', or 'info'
    en: 'English advice text.',
    nl: 'Dutch advice text.'
  });
}
```

### Adding a New Chat Intent

In `insights.js → processChat()`, add a new regex match block:

```js
if (q.match(/keyword1|keyword2|dutchkeyword/)) {
  // Calculate response from checkIns/metrics
  return l === 'nl' ? 'Dutch response' : 'English response';
}
```

### Adding a Third Language

1. Add a new key to `TRANSLATIONS` in `ui.js` (e.g., `fr: { ... }`).
2. Add bilingual advice text in `insights.js` (add `fr` property to each advice object).
3. Add a language button in the onboarding screen.
4. Update `setLanguage()` validation in `ui.js`.

### Customizing the Theme

All visual properties are CSS custom properties in `styles.css`:

```css
:root {
  --color-primary: #2a9d8f;     /* Change main accent color */
  --color-bg: #f0f7f4;          /* Change background */
  --radius-lg: 16px;            /* Change card roundness */
  --font-family: 'Your Font';   /* Change typography */
}
```

---

## Browser Support

- Chrome 80+ (Android & Desktop)
- Safari 14+ (iOS & macOS)
- Firefox 80+
- Edge 80+

---

## Privacy

- **Zero network requests** — No analytics, no tracking, no API calls.
- **All data on-device** — IndexedDB and localStorage only.
- **Export available** — Download your data as JSON anytime.
- **Clear available** — Delete all data with one tap.

---

## License

MIT — Free to use, modify, and distribute.
