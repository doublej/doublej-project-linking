<script lang="ts">
	import Widget from '$lib/widget/Widget.svelte';
	import type { WidgetLink } from '$lib/widget/config.js';
	import { githubIcon, substackIcon, linkIcon } from '$lib/widget/icons.js';

	let ctaText = $state('Projects');
	let githubEnabled = $state(true);
	let githubValue = $state('user/repo1, user/repo2');
	let substackEnabled = $state(false);
	let substackValue = $state('my-newsletter');
	let accentColor = $state('#e63946');
	let projectsText = $state('');

	let links = $derived.by(() => {
		const result: WidgetLink[] = [];

		if (githubEnabled && githubValue) {
			for (const repo of githubValue.split(',')) {
				const trimmed = repo.trim();
				if (trimmed) {
					result.push({
						label: trimmed,
						url: `https://github.com/${trimmed}`,
						icon: githubIcon
					});
				}
			}
		}

		if (substackEnabled && substackValue) {
			for (const slug of substackValue.split(',')) {
				const trimmed = slug.trim();
				if (trimmed) {
					result.push({
						label: trimmed,
						url: `https://${trimmed}.substack.com`,
						icon: substackIcon
					});
				}
			}
		}

		if (projectsText.trim()) {
			try {
				const parsed: { label: string; url: string }[] = JSON.parse(projectsText);
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
		if (ctaText !== 'Projects') attrs.push(`data-cta="${ctaText}"`);
		if (githubEnabled && githubValue) attrs.push(`data-github="${githubValue}"`);
		if (substackEnabled && substackValue) attrs.push(`data-substack="${substackValue}"`);
		if (accentColor !== '#e63946') attrs.push(`data-color="${accentColor}"`);
		if (projectsText.trim()) {
			try {
				JSON.parse(projectsText);
				attrs.push(`data-projects='${projectsText.trim()}'`);
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
	<p>Configure the embeddable corner widget. Hover the bottom-right corner to preview.</p>

	<section class="controls">
		<fieldset>
			<legend>CTA Text</legend>
			<input type="text" bind:value={ctaText} placeholder="Projects" />
		</fieldset>

		<fieldset>
			<legend>GitHub</legend>
			<label>
				<input type="checkbox" bind:checked={githubEnabled} />
				Enable
			</label>
			{#if githubEnabled}
				<input type="text" bind:value={githubValue} placeholder="user/repo1, user/repo2" />
			{/if}
		</fieldset>

		<fieldset>
			<legend>Substack</legend>
			<label>
				<input type="checkbox" bind:checked={substackEnabled} />
				Enable
			</label>
			{#if substackEnabled}
				<input type="text" bind:value={substackValue} placeholder="slug1, slug2" />
			{/if}
		</fieldset>

		<fieldset>
			<legend>Accent Color</legend>
			<input type="color" bind:value={accentColor} />
			<code>{accentColor}</code>
		</fieldset>

		<fieldset>
			<legend>Custom Projects (JSON)</legend>
			<textarea bind:value={projectsText} rows="3"
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
	<Widget {links} color={accentColor} cta={ctaText} />
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
