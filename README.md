# doublej-project-linking

Embeddable corner widget for linking to multiple projects with Short.io URL shortening integration.

## Features

- Configurable corner widget with custom CTA text and accent color
- Support for multiple link types (GitHub, Substack, generic links)
- Auto-detect icons from URLs
- Optional GitHub star button with live star count
- **Short.io URL shortening integration** - one-click URL shortening directly in the config interface

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Configure Short.io API (optional, for URL shortening feature):
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

4. Build the widget for production:
   ```bash
   bun run build:widget
   ```

## Using the URL Shortener

1. Navigate to http://localhost:5174
2. Add or edit a link in the "Links" section
3. Enter the full URL (e.g., `https://substack.com/my-article`)
4. (Optional) Set a label to auto-generate a slug
5. Click the ⚡ button next to the URL field
6. The URL will be automatically shortened using Short.io

**Note:** The slug is auto-generated from the label field. For example:
- Label: "Camera Diagnosing" → Slug: `camera-diagnosing`
- Label: "Ambient Light" → Slug: `ambient-light`

## Short.io API Integration

The integration uses a SvelteKit API route (`/api/shorten`) that:
- Accepts `originalURL` and optional `slug` parameters
- Calls the Short.io API with your credentials
- Returns the shortened URL
- Handles errors gracefully

## Project Structure

```
src/
├── lib/widget/          # Widget components
│   ├── Widget.svelte    # Main widget component
│   ├── LinkItem.svelte  # Individual link item
│   ├── config.ts        # Configuration types
│   ├── icons.ts         # SVG icons
│   └── mount.ts         # Widget initialization
├── routes/
│   ├── +page.svelte     # Config/demo page
│   └── api/shorten/
│       └── +server.ts   # Short.io API endpoint
```

## Embed the Widget

Copy the embed snippet from the config page and add it to your website:

```html
<script src="https://your-host.com/widget.js"
  data-links='[{"label":"My Project","url":"https://...","icon":"github"}]'
  data-cta="Projects"
  data-color="#e63946">
</script>
```

## License

MIT
