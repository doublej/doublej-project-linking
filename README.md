# doublej-project-linking

Embeddable corner widget with path-based profile matching and Short.io URL shortening integration.

## Features

- **Path-based profile system** - Widget auto-detects URL and loads matching profile
- **Profile management UI** - Dashboard for managing multiple widget profiles
- **Domain + path matching rules** - Define where each profile appears using patterns
- **Short.io integration** - One-click URL shortening in the config interface
- Configurable CTA text, accent color, and links
- Multiple link types (GitHub, Substack, generic links)
- Auto-detect icons from URLs
- Optional GitHub star button with live star count

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Configure Short.io API (optional, for URL shortening):
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Short.io API key:
   - Get your API key from: https://app.short.io/settings/integrations/api-key
   - Update `SHORTIO_API_KEY` with your actual key
   - Update `SHORTIO_DOMAIN` with your custom domain (default: `l.jurrejan.com`)

3. Start the dev server:
   ```bash
   bun run dev
   ```

4. Open http://localhost:5173 to access the profile management UI

5. Build for production:
   ```bash
   bun run build
   bun run build:widget
   ```

## How It Works

### Profile System

The widget uses a path-matching system to determine which profile to display:

1. **Profiles** - Widget configurations stored in `profiles/profiles/*.json`
2. **Matching Rules** - Domain + path patterns that determine when a profile appears
3. **API Lookup** - Widget fetches config from `/api/widget-config?domain=X&pathname=Y`
4. **Specificity** - Most specific rule wins (exact paths beat wildcards)

### Path Pattern Examples

```
/blog/featured     → Exact path (priority: 1200)
/blog/*            → Single-level wildcard (priority: 110)
/blog/**           → Multi-level wildcard (priority: 101)
/**                → Catch-all (priority: 1)
```

## Management UI

Access the dashboard at http://localhost:5173 to:

- **Create profiles** - Define widget appearance and links
- **Configure rules** - Set domain and path patterns for each profile
- **Test URLs** - Verify which profile matches a given URL
- **Get embed code** - Single-line script tag with no configuration needed

## Embed the Widget

### Modern (Path-Based)

Single line, no configuration - widget auto-detects URL:

```html
<script src="https://your-host.com/widget.js"></script>
```

The widget will:
1. Detect the current page domain and path
2. Call `/api/widget-config?domain=example.com&pathname=/blog/post`
3. Load the matching profile configuration
4. Hide itself if no profile matches

### Legacy (Attribute-Based)

Still supported for backward compatibility:

```html
<script src="https://your-host.com/widget.js"
  data-links='[{"label":"My Project","url":"https://...","icon":"github"}]'
  data-cta="Projects"
  data-color="#e63946">
</script>
```

## Project Structure

```
src/
├── lib/
│   ├── server/profiles/      # Backend profile system
│   │   ├── types.ts           # TypeScript types
│   │   ├── storage.ts         # JSON file storage
│   │   └── matcher.ts         # Path matching + specificity
│   └── widget/                # Widget components
│       ├── Widget.svelte      # Main widget UI
│       ├── LinkItem.svelte    # Link item component
│       ├── config.ts          # Config parsing
│       ├── icons.ts           # SVG icons
│       └── mount.ts           # Widget initialization
├── routes/
│   ├── +page.svelte           # Profile management UI
│   └── api/
│       ├── widget-config/     # Widget config endpoint
│       ├── profiles/          # Profile CRUD
│       ├── rules/             # Rule CRUD
│       └── shorten/           # Short.io integration
└── hooks.server.ts            # CORS for widget embedding

profiles/
├── profiles/                  # Profile JSON files
└── rules/                     # Rule JSON files
```

## API Endpoints

- `GET /api/widget-config?domain=X&pathname=Y` - Get matching profile config
- `GET /api/profiles` - List all profiles
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/[id]` - Update profile
- `DELETE /api/profiles/[id]` - Delete profile
- `GET /api/rules?profileId=X` - List rules for profile
- `POST /api/rules` - Create rule
- `PUT /api/rules/[id]` - Update rule
- `DELETE /api/rules/[id]` - Delete rule
- `POST /api/shorten` - Shorten URL via Short.io

## License

MIT
