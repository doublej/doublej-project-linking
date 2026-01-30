<script lang="ts">
	import Widget from '$lib/widget/Widget.svelte';
	import type { WidgetLink } from '$lib/widget/config.js';
	import { type IconKey, iconMap, detectIcon, formatCount } from '$lib/widget/config.js';

	type LinkEntry = {
		label: string;
		url: string;
		icon: IconKey;
		manualIcon: boolean;
		shortening?: boolean;
		shortenError?: string;
	};

	let entries = $state<LinkEntry[]>([
		{ label: 'user/repo1', url: 'https://github.com/user/repo1', icon: 'github', manualIcon: false },
		{ label: 'user/repo2', url: 'https://github.com/user/repo2', icon: 'github', manualIcon: false }
	]);
	let ctaText = $state('Projects');
	let accentColor = $state('#e63946');
	let showStar = $state(true);
	let starCount = $state<string | null>(null);
	let lastFetchedUrl = $state<string | null>(null);

	let links = $derived<WidgetLink[]>(
		entries.map((e) => ({ label: e.label, url: e.url, icon: iconMap[e.icon] }))
	);

	let starUrl = $derived(entries.find((e) => e.icon === 'github')?.url ?? null);

	$effect(() => {
		if (!showStar || !starUrl) {
			starCount = null;
			lastFetchedUrl = null;
			return;
		}
		if (starUrl === lastFetchedUrl) return;
		const match = starUrl.match(/github\.com\/([^/]+\/[^/]+)/);
		if (!match) {
			starCount = null;
			lastFetchedUrl = starUrl;
			return;
		}
		const repoPath = match[1];
		const url = starUrl;
		lastFetchedUrl = url;
		starCount = null;
		fetch(`https://api.github.com/repos/${repoPath}`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((data) => {
				if (lastFetchedUrl === url) {
					starCount = formatCount(data.stargazers_count);
				}
			})
			.catch(() => {
				if (lastFetchedUrl === url) starCount = null;
			});
	});

	let snippet = $derived.by(() => {
		const attrs: string[] = [];
		if (ctaText !== 'Projects') attrs.push(`data-cta="${ctaText}"`);
		if (accentColor !== '#e63946') attrs.push(`data-color="${accentColor}"`);
		if (!showStar) attrs.push(`data-star="false"`);
		const json = JSON.stringify(entries.map((e) => ({ label: e.label, url: e.url, icon: e.icon })));
		attrs.push(`data-links='${json}'`);
		const attrStr = '\n  ' + attrs.join('\n  ');
		return `<script src="https://your-host.com/widget.js"${attrStr}><\/script>`;
	});

	let copied = $state(false);

	function copySnippet() {
		navigator.clipboard.writeText(snippet);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	function onUrlChange(entry: LinkEntry) {
		if (!entry.manualIcon) {
			entry.icon = detectIcon(entry.url);
		}
	}

	function onIconChange(entry: LinkEntry) {
		entry.manualIcon = true;
	}

	function addEntry() {
		entries.push({ label: '', url: '', icon: 'link', manualIcon: false });
	}

	function removeEntry(index: number) {
		entries.splice(index, 1);
	}

	async function shortenUrl(entry: LinkEntry) {
		if (!entry.url || entry.url === '') {
			entry.shortenError = 'URL is required';
			return;
		}

		entry.shortening = true;
		entry.shortenError = undefined;

		try {
			const response = await fetch('/api/shorten', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					originalURL: entry.url,
					slug: entry.label
						? entry.label
								.toLowerCase()
								.replace(/[^a-z0-9]+/g, '-')
								.replace(/^-+|-+$/g, '')
						: undefined
				})
			});

			if (!response.ok) {
				const error = await response.json();
				entry.shortenError = error.message || 'Failed to shorten URL';
				return;
			}

			const data = await response.json();
			entry.url = data.shortURL;
		} catch (err) {
			entry.shortenError = 'Network error';
		} finally {
			entry.shortening = false;
		}
	}

	const iconOptions: IconKey[] = ['github', 'substack', 'link', 'star'];
</script>

<div class="page">
	<div class="config">
		<h1>doublej-project-linking</h1>
		<p class="subtitle">Configure the embeddable corner widget.</p>

		<section class="row">
			<fieldset>
				<legend>CTA Text</legend>
				<input type="text" bind:value={ctaText} placeholder="Projects" />
			</fieldset>
			<fieldset>
				<legend>Accent Color</legend>
				<div class="color-field">
					<input type="color" bind:value={accentColor} />
					<code>{accentColor}</code>
				</div>
			</fieldset>
		</section>

		<section class="toggle-row">
			<label>
				<input type="checkbox" bind:checked={showStar} />
				Show Star on GitHub
			</label>
		</section>

		<section class="link-list">
			<h2>Links</h2>
			{#each entries as entry, i}
				<div class="link-row">
					<select
						bind:value={entry.icon}
						onchange={() => onIconChange(entry)}
						aria-label="Icon"
					>
						{#each iconOptions as opt}
							<option value={opt}>{opt}</option>
						{/each}
					</select>
					<input
						type="text"
						bind:value={entry.label}
						placeholder="Label"
						class="label-input"
					/>
					<input
						type="url"
						bind:value={entry.url}
						placeholder="https://..."
						class="url-input"
						oninput={() => onUrlChange(entry)}
					/>
					<button
						class="shorten-btn"
						onclick={() => shortenUrl(entry)}
						disabled={entry.shortening || !entry.url}
						title={entry.shortenError || 'Shorten URL with Short.io'}
					>
						{entry.shortening ? '...' : '⚡'}
					</button>
					<button class="remove-btn" onclick={() => removeEntry(i)} aria-label="Remove link">
						&times;
					</button>
				</div>
			{/each}
			<button class="add-btn" onclick={addEntry}>+ Add Link</button>
		</section>

		<section class="snippet">
			<h2>Embed Snippet</h2>
			<pre><code>{snippet}</code></pre>
			<button onclick={copySnippet}>
				{copied ? 'Copied!' : 'Copy'}
			</button>
		</section>
	</div>

	<div class="preview">
		<div class="phone-frame">
			<div class="frame-content">
				<div class="placeholder-line" style="width: 70%"></div>
				<div class="placeholder-line" style="width: 50%"></div>
				<div class="placeholder-line" style="width: 85%"></div>
				<div class="placeholder-line" style="width: 40%"></div>
			</div>
			{#if links.length > 0}
				<div class="widget-wrap">
					<Widget {links} color={accentColor} cta={ctaText} {starUrl} {showStar} {starCount} />
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.page {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 2rem;
		max-width: 1100px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		font-family: system-ui, sans-serif;
		overflow: hidden;
	}

	.config {
		min-width: 0;
	}

	@media (max-width: 800px) {
		.page {
			grid-template-columns: 1fr;
		}
		.preview {
			order: -1;
		}
		.row {
			flex-wrap: wrap;
		}
		.link-row {
			flex-wrap: wrap;
		}
	}

	h1 {
		margin: 0 0 0.25rem;
	}

	h2 {
		font-size: 1rem;
		margin: 0 0 0.75rem;
	}

	.subtitle {
		margin: 0 0 1.5rem;
		color: #666;
	}

	/* CTA + Color row */
	.row {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.row fieldset {
		flex: 1;
		min-width: 0;
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 0.75rem;
	}

	.row legend {
		font-weight: 600;
		font-size: 0.85rem;
	}

	.row input[type='text'] {
		width: 100%;
		padding: 0.4rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.85rem;
		box-sizing: border-box;
	}

	.color-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-field code {
		font-size: 0.85rem;
	}

	/* Toggle */
	.toggle-row {
		margin-bottom: 1rem;
	}

	.toggle-row label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	/* Link list */
	.link-list {
		margin-bottom: 1.5rem;
	}

	.link-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
		min-width: 0;
	}

	.link-row select {
		flex: 0 0 auto;
		width: 90px;
		min-width: 0;
		padding: 0.4rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.8rem;
		background: white;
	}

	.label-input {
		flex: 1 1 120px;
		min-width: 60px;
		padding: 0.4rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.85rem;
	}

	.url-input {
		flex: 2 1 160px;
		min-width: 80px;
		padding: 0.4rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.85rem;
		font-family: monospace;
	}

	.shorten-btn {
		padding: 0.3rem 0.6rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		color: #666;
		transition: all 0.2s;
	}

	.shorten-btn:hover:not(:disabled) {
		background: #f0f7ff;
		border-color: #4a90e2;
		color: #4a90e2;
	}

	.shorten-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.shorten-btn[title*='Failed'],
	.shorten-btn[title*='error'],
	.shorten-btn[title*='Error'] {
		border-color: #e94444;
		color: #e94444;
	}

	.remove-btn {
		padding: 0.3rem 0.6rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		color: #999;
	}

	.remove-btn:hover {
		background: #fee;
		color: #c00;
		border-color: #c00;
	}

	.add-btn {
		padding: 0.4rem 1rem;
		border: 1px dashed #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 0.85rem;
		color: #666;
	}

	.add-btn:hover {
		background: #f8f8f8;
		border-color: #999;
	}

	/* Snippet */
	.snippet pre {
		background: #1a1a2e;
		color: #eee;
		padding: 1rem;
		border-radius: 6px;
		overflow-x: auto;
		font-size: 0.8rem;
		max-width: 100%;
		box-sizing: border-box;
	}

	.snippet button {
		margin-top: 0.5rem;
		padding: 0.4rem 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.snippet button:hover {
		background: #f0f0f0;
	}

	/* Preview */
	.preview {
		position: sticky;
		top: 2rem;
		align-self: start;
	}

	.phone-frame {
		position: relative;
		background: #f5f5f5;
		border-radius: 12px;
		border: 1px solid #ddd;
		min-height: 500px;
		overflow: hidden;
	}

	.frame-content {
		padding: 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.placeholder-line {
		height: 12px;
		background: #e0e0e0;
		border-radius: 6px;
	}

	.widget-wrap {
		position: absolute;
		bottom: 0;
		right: 0;
		pointer-events: auto;
	}

	/* Override widget fixed positioning inside the preview */
	.widget-wrap :global(.widget) {
		position: absolute;
		bottom: 16px;
		right: 0;
	}
</style>
