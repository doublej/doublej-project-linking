# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Embeddable corner widget with path-based profile matching. The widget auto-detects the page URL and loads the appropriate profile configuration via API lookup.

**Key architecture**: Widget embeds use a single `<script>` tag with no attributes. The widget fetches its config from `/api/widget-config?domain=X&pathname=Y`, which matches the request against rules stored as JSON files and returns the winning profile.

## Build & Development Commands

```bash
# Install dependencies
bun install

# Development server (profile management UI)
bun run dev
# → http://localhost:5173

# Type checking
bun run check

# Production builds
bun run build              # Build SvelteKit app
bun run build:widget       # Build embeddable widget.js
```

## Widget System Architecture

### Two-Part System

1. **Management UI** (`src/routes/+page.svelte`)
   - Dashboard for creating/editing profiles
   - Configure matching rules (domain + path patterns)
   - SvelteKit SSR application

2. **Embeddable Widget** (`src/lib/widget/`)
   - Standalone IIFE bundle built with `vite.config.widget.ts`
   - Output: `dist/widget.js` (no CSS file, styles injected)
   - Runs on user's websites, not our origin

### Widget Initialization Flow

```
1. <script src="host.com/widget.js"></script> loads
2. mount.ts: fetchConfig() called
3. Detects window.location.hostname + pathname
4. Fetches from /api/widget-config?domain=X&pathname=Y
5. API uses matcher.ts to find best matching rule
6. Returns profile config OR null
7. If null: widget hides
   If config: Widget.svelte mounts in shadow DOM
```

### Path Matching System

**Specificity algorithm** (`src/lib/server/profiles/matcher.ts`):
- Exact path (no wildcards): +1000 + (100 per segment)
- Single wildcard `*`: matches one segment, +10 points
- Double wildcard `**`: matches multiple segments, +1 point

Examples:
- `/blog/featured` → 1200 (exact, 2 segments)
- `/blog/*` → 110 (1 segment + wildcard)
- `/blog/**` → 101 (1 segment + recursive wildcard)

**Rule matching**:
- Filter by domain (exact match)
- Filter by enabled status
- Match pathname against pathPattern
- Sort by priority (highest wins)

### Storage

**File-based JSON storage** in `profiles/` directory (gitignored):
- `profiles/profiles/*.json` - Profile configurations
- `profiles/rules/*.json` - Matching rules

No database. All CRUD operations use `storage.ts` (readFile/writeFile).

## API Endpoints

All in `src/routes/api/`:

### Widget Config (CORS enabled)
- `GET /api/widget-config?domain=X&pathname=Y` - Returns matching profile config or null
- CORS headers added in `src/hooks.server.ts` for cross-origin embedding

### Profile Management
- `GET /api/profiles` - List all profiles
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/[id]` - Update profile
- `DELETE /api/profiles/[id]` - Delete profile

### Rule Management
- `GET /api/rules?profileId=X` - List rules (optionally filtered)
- `POST /api/rules` - Create rule (auto-calculates priority)
- `PUT /api/rules/[id]` - Update rule (recalculates priority)
- `DELETE /api/rules/[id]` - Delete rule

### Short.io Integration
- `POST /api/shorten` - Shorten URL via Short.io API
- Requires `SHORTIO_API_KEY` and `SHORTIO_DOMAIN` in `.env`
- Used by management UI to shorten link URLs

## Environment Variables

Optional but required for URL shortening feature:

```bash
SHORTIO_API_KEY=your_api_key_here
SHORTIO_DOMAIN=l.jurrejan.com
```

Get API key from: https://app.short.io/settings/integrations/api-key

## Critical Implementation Details

### Widget CSS Injection

Widget uses `emitCss: false` and `css: 'injected'` in `vite.config.widget.ts` to bundle all styles into the JS file. This avoids requiring users to load a separate CSS file.

### Shadow DOM Isolation

Widget mounts into a shadow DOM (`mode: 'closed'`) to prevent style leakage from host page. The widget controls its own styling completely.

### Backward Compatibility

Widget still supports legacy attribute-based config for existing embeds:
```html
<script src="..." data-links='[...]' data-cta="..." data-color="..."></script>
```

`parseConfig()` in `config.ts` handles this fallback. Priority: API config → attribute config → hide.

### Icon Detection

`detectIcon()` in `config.ts` auto-detects icon type from URL:
- Contains `github.com` → github icon
- Contains `substack.com` → substack icon
- Otherwise → generic link icon

### Star Count Fetching

Widget optionally shows GitHub star count by fetching from `https://api.github.com/repos/{owner}/{repo}`. This is client-side, no auth required. Count is formatted via `formatCount()` (e.g., 15000 → "15k").

## Common Patterns

### Adding a New Icon Type

1. Add SVG to `src/lib/widget/icons.ts`
2. Add type to `IconKey` union in `config.ts`
3. Add to `iconMap` in `config.ts`
4. Update `detectIcon()` logic if auto-detection needed
5. Add option to `iconOptions` array in `+page.svelte`

### Modifying Specificity Algorithm

Edit `calculateSpecificity()` in `matcher.ts`. Remember: higher score = more specific. Changing this requires re-calculating priority for all existing rules (run UPDATE on all rules via PUT endpoints).

### Adding New Profile Fields

1. Update `ProfileConfig` type in `types.ts`
2. Update profile creation UI in `+page.svelte`
3. Update `Widget.svelte` to use new field
4. Existing profiles will have undefined fields (handle gracefully)

## Testing Widget Locally

1. Start dev server: `bun run dev`
2. Create a profile in UI at http://localhost:5173
3. Add a rule matching `localhost` domain
4. Build widget: `bun run build:widget`
5. Create test HTML file:
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Test page</h1>
  <script src="http://localhost:5173/widget.js"></script>
</body>
</html>
```
6. Open test file in browser (widget should appear)

Note: Widget fetches config from script src origin, so dev server must be running.

## Widget Embed Locations

Keep this list up to date when adding or removing the widget from a site. Each entry records where the `<script>` tag lives and which profile/rule it maps to.

| Site | Script tag location | Profile | Rule |
|---|---|---|---|
| [beads-kanban docs](https://doublej.github.io/beads-kanban/) | `docs/src/app.html` in [beads-kanban](https://github.com/doublej/beads-kanban) | `profiles/profiles/beads-kanban.json` | `profiles/rules/beads-kanban-rule.json` |
| [consult-user-mcp docs](https://doublej.github.io/consult-user-mcp/) | `docs/src/app.html` in [consult-user-mcp](https://github.com/doublej/consult-user-mcp) | `profiles/profiles/consult-user-mcp.json` | `profiles/rules/consult-user-mcp-rule.json` |
| [ccom docs](https://doublej.github.io/ccom/) | `docs/src/app.html` in [ccom](https://github.com/doublej/ccom) | `profiles/profiles/ccom.json` | `profiles/rules/ccom-rule.json` |

When embedding the widget on a new site:
1. Create a profile JSON in `profiles/profiles/`
2. Create a matching rule JSON in `profiles/rules/`
3. Add `<script defer src="https://doublej.github.io/doublej-project-linking/widget.js"></script>` to the target site
4. Update this table
