<script lang="ts">
	import Widget from '$lib/widget/Widget.svelte';
	import type { WidgetLink } from '$lib/widget/config.js';
	import { githubIcon, substackIcon, linkIcon } from '$lib/widget/icons.js';

	let githubEnabled = $state(true);
	let githubValue = $state('user/repo');
	let substackEnabled = $state(false);
	let substackValue = $state('my-newsletter');
	let accentColor = $state('#e63946');
	let customLinksText = $state('');

	let links = $derived.by(() => {
		const result: WidgetLink[] = [];

		if (githubEnabled && githubValue) {
			result.push({
				label: githubValue,
				url: `https://github.com/${githubValue}`,
				icon: githubIcon
			});
		}

		if (substackEnabled && substackValue) {
			result.push({
				label: substackValue,
				url: `https://${substackValue}.substack.com`,
				icon: substackIcon
			});
		}

		if (customLinksText.trim()) {
			try {
				const parsed: { label: string; url: string }[] = JSON.parse(customLinksText);
				for (const item of parsed) {
					if (item.label && item.url) {
						result.push({ label: item.label, url: item.url, icon: linkIcon });
					}
				}
			} catch {
				// ignore while typing
			}
		}

		return result;
	});

	let snippet = $derived.by(() => {
		const attrs: string[] = [];
		if (githubEnabled && githubValue) attrs.push(`data-github="${githubValue}"`);
		if (substackEnabled && substackValue) attrs.push(`data-substack="${substackValue}"`);
		if (accentColor !== '#e63946') attrs.push(`data-color="${accentColor}"`);
		if (customLinksText.trim()) {
			try {
				JSON.parse(customLinksText);
				attrs.push(`data-links='${customLinksText.trim()}'`);
			} catch {
				// skip invalid JSON
			}
		}
		const attrStr = attrs.length ? '\n  ' + attrs.join('\n  ') : '';
		return `<script src="https://your-host.com/widget.js"${attrStr}><\/script>`;
	});

	let copied = $state(false);

	function copySnippet() {
		navigator.clipboard.writeText(snippet);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<main>
	<h1>doublej-project-linking</h1>
	<p>Configure your embeddable corner widget below. Hover the bottom-right corner to preview.</p>

	<section class="controls">
		<fieldset>
			<legend>GitHub</legend>
			<label>
				<input type="checkbox" bind:checked={githubEnabled} />
				Enable
			</label>
			{#if githubEnabled}
				<input type="text" bind:value={githubValue} placeholder="user/repo" />
			{/if}
		</fieldset>

		<fieldset>
			<legend>Substack</legend>
			<label>
				<input type="checkbox" bind:checked={substackEnabled} />
				Enable
			</label>
			{#if substackEnabled}
				<input type="text" bind:value={substackValue} placeholder="my-newsletter" />
			{/if}
		</fieldset>

		<fieldset>
			<legend>Accent Color</legend>
			<input type="color" bind:value={accentColor} />
			<code>{accentColor}</code>
		</fieldset>

		<fieldset>
			<legend>Custom Links (JSON)</legend>
			<textarea bind:value={customLinksText} rows="3"
				placeholder='[{{"label":"My Tool","url":"https://..."}}]'
			></textarea>
		</fieldset>
	</section>

	<section class="snippet">
		<h2>Embed Snippet</h2>
		<pre><code>{snippet}</code></pre>
		<button onclick={copySnippet}>
			{copied ? 'Copied!' : 'Copy'}
		</button>
	</section>
</main>

{#if links.length > 0}
	<Widget {links} color={accentColor} />
{/if}

<style>
	main {
		max-width: 640px;
		margin: 2rem auto;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
	}

	h1 {
		margin-bottom: 0.25rem;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 1.5rem 0;
	}

	fieldset {
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	legend {
		font-weight: 600;
		font-size: 0.9rem;
	}

	input[type='text'],
	textarea {
		flex: 1;
		padding: 0.4rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.85rem;
	}

	textarea {
		width: 100%;
		resize: vertical;
	}

	code {
		font-size: 0.85rem;
	}

	.snippet {
		margin-top: 2rem;
	}

	.snippet pre {
		background: #1a1a2e;
		color: #eee;
		padding: 1rem;
		border-radius: 6px;
		overflow-x: auto;
		font-size: 0.8rem;
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
</style>
