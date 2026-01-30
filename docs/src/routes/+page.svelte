<script lang="ts">
	import { base } from '$app/paths';

	const features = [
		{
			title: 'Path-Based Profiles',
			description: 'Widget auto-detects the page URL and loads the matching profile. Define rules with domain + path patterns and specificity-based priority.'
		},
		{
			title: 'Management Dashboard',
			description: 'Create and manage widget profiles through a modern SaaS-style dashboard with a slide-over editor.'
		},
		{
			title: 'Smart Matching',
			description: 'Specificity algorithm ranks exact paths over single wildcards over recursive wildcards. Most specific rule always wins.'
		},
		{
			title: 'Zero-Config Embed',
			description: 'Single script tag with no attributes needed. Widget fetches its own config from the API based on the current page URL.'
		},
		{
			title: 'Static Deployment',
			description: 'Deploy to GitHub Pages or any static host. The widget falls back to a static manifest when no API is available.'
		},
		{
			title: 'Shadow DOM Isolation',
			description: 'Widget mounts in a closed shadow DOM to prevent style leakage. Works reliably on any host page without CSS conflicts.'
		}
	];

	const steps = [
		{
			title: 'Install dependencies',
			description: 'Clone the repository and install with Bun.',
			code: 'bun install'
		},
		{
			title: 'Start the dev server',
			description: 'Launch the management UI and widget API.',
			code: 'bun run dev'
		},
		{
			title: 'Create a profile',
			description: 'Open http://localhost:5173 and create a widget profile with your desired links, CTA text, and accent color.'
		},
		{
			title: 'Add matching rules',
			description: 'Define domain and path patterns to control where the profile appears. Use exact paths, single wildcards (*), or recursive wildcards (**).'
		},
		{
			title: 'Embed the widget',
			description: 'Add a single script tag to your site. The widget handles the rest.',
			code: '<script src="https://your-host.com/widget.js"><\/script>'
		}
	];

	const deploySteps = [
		{
			title: 'Build the static assets',
			description: 'Generate the manifest and widget bundle.',
			code: 'bun run build:static'
		},
		{
			title: 'Deploy the dist/ folder',
			description: 'Upload widget.js and widget-manifest.json to any static host (GitHub Pages, Netlify, Vercel, S3, etc.).'
		},
		{
			title: 'Embed on your site',
			description: 'The widget tries the API first and falls back to the static manifest automatically.',
			code: '<script src="https://your-pages-site.github.io/widget.js"><\/script>'
		}
	];

	let copied = $state(false);

	function copyInstall() {
		navigator.clipboard.writeText('bun install');
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>doublej-project-linking</title>
	<meta name="description" content="Embeddable corner widget with path-based profile matching and Short.io URL shortening integration." />
</svelte:head>

<main>
	<section class="hero">
		<div class="container">
			<h1>doublej-project-linking</h1>
			<p class="description">Embeddable corner widget with path-based profile matching and Short.io URL shortening integration.</p>
		</div>
	</section>

	<section class="install">
		<div class="container">
			<div class="install-box">
				<code>bun install</code>
				<button onclick={copyInstall}>{copied ? 'Copied!' : 'Copy'}</button>
			</div>
		</div>
	</section>

	<section class="features">
		<div class="container">
			<h2>Features</h2>
			<div class="grid">
				{#each features as feature, i}
					<div class="feature-card" style="animation-delay: {i * 200}ms">
						<h3>{feature.title}</h3>
						<p>{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="getting-started">
		<div class="container">
			<h2>Getting Started</h2>
			<div class="steps">
				{#each steps as step, i}
					<div class="step" style="animation-delay: {(i + 3) * 200}ms">
						<div class="step-number">{i + 1}</div>
						<div class="step-content">
							<h3>{step.title}</h3>
							<p>{step.description}</p>
							{#if step.code}
								<pre><code>{step.code}</code></pre>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="getting-started">
		<div class="container">
			<h2>Static Deployment</h2>
			<p class="section-description">Deploy the widget to any static host — no server required.</p>
			<div class="steps">
				{#each deploySteps as step, i}
					<div class="step" style="animation-delay: {(i + 8) * 200}ms">
						<div class="step-number">{i + 1}</div>
						<div class="step-content">
							<h3>{step.title}</h3>
							<p>{step.description}</p>
							{#if step.code}
								<pre><code>{step.code}</code></pre>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="install">
		<div class="container">
			<h2>Quick Install</h2>
			<p class="section-description">One-liner to clone, install, and set up the project.</p>
			<div class="install-box">
				<code>bash &lt;(curl -fsSL https://raw.githubusercontent.com/jurrejan/doublej-project-linking/main/install.sh)</code>
			</div>
		</div>
	</section>

	<section class="patterns">
		<div class="container">
			<h2>Path Matching</h2>
			<p class="section-description">The specificity algorithm ensures the most specific rule always wins.</p>
			<div class="pattern-grid">
				<div class="pattern-card">
					<code>/blog/featured</code>
					<span class="priority">Priority: 1200</span>
					<p>Exact path match</p>
				</div>
				<div class="pattern-card">
					<code>/blog/*</code>
					<span class="priority">Priority: 110</span>
					<p>Single-level wildcard</p>
				</div>
				<div class="pattern-card">
					<code>/blog/**</code>
					<span class="priority">Priority: 101</span>
					<p>Multi-level wildcard</p>
				</div>
				<div class="pattern-card">
					<code>/**</code>
					<span class="priority">Priority: 1</span>
					<p>Catch-all fallback</p>
				</div>
			</div>
		</div>
	</section>

	<footer>
		<div class="container">
			<p>MIT License</p>
		</div>
	</footer>
</main>

<style>
	.container {
		max-width: var(--container-max-width);
		margin: 0 auto;
		padding: 0 var(--container-padding);
	}

	/* Hero */
	.hero {
		padding: var(--section-padding) var(--container-padding);
		padding-top: 80px;
		text-align: center;
		animation: fadeSlideUp 0.5s ease-out forwards;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 600;
		letter-spacing: -0.03em;
		margin-bottom: 1rem;
	}

	.description {
		font-size: 1.1rem;
		color: var(--text-secondary);
		max-width: 700px;
		margin: 0 auto;
	}

	/* Install */
	.install {
		padding: 0 var(--container-padding) var(--section-padding);
		animation: fadeSlideUp 0.5s ease-out 0.2s forwards;
		opacity: 0;
	}

	.install-box {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 16px 24px;
		max-width: 400px;
		margin: 0 auto;
	}

	.install-box code {
		font-size: 1rem;
		color: var(--text-primary);
	}

	.install-box button {
		font-family: 'Instrument Sans', system-ui, sans-serif;
		font-size: 0.85rem;
		font-weight: 500;
		padding: 6px 16px;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.install-box button:hover {
		opacity: 0.8;
	}

	/* Sections */
	.features, .getting-started, .patterns {
		padding: var(--section-padding) var(--container-padding);
	}

	h2 {
		font-size: 1.8rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		margin-bottom: 1.5rem;
	}

	.section-description {
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}

	/* Features Grid */
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--grid-gap);
	}

	.feature-card {
		background: var(--bg-secondary);
		padding: 24px;
		border: 1px solid var(--border);
		border-radius: 8px;
		animation: fadeSlideUp 0.5s ease-out forwards;
		opacity: 0;
	}

	.feature-card h3 {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.feature-card p {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Getting Started */
	.steps {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.step {
		display: flex;
		gap: 20px;
		animation: fadeSlideUp 0.5s ease-out forwards;
		opacity: 0;
	}

	.step-number {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		background: var(--accent);
		color: #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.step-content h3 {
		font-size: 1.05rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.step-content p {
		color: var(--text-secondary);
		font-size: 0.95rem;
	}

	.step-content pre {
		margin-top: 0.75rem;
		background: var(--bg-code);
		padding: 12px 16px;
		border-radius: 6px;
		overflow-x: auto;
	}

	.step-content code {
		font-size: 0.9rem;
	}

	/* Path Matching */
	.pattern-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--grid-gap);
	}

	.pattern-card {
		background: var(--bg-secondary);
		padding: 20px;
		border: 1px solid var(--border);
		border-radius: 8px;
		text-align: center;
	}

	.pattern-card code {
		display: block;
		font-size: 1rem;
		font-weight: 500;
		margin-bottom: 8px;
	}

	.pattern-card .priority {
		display: block;
		font-size: 0.8rem;
		color: var(--text-tertiary);
		margin-bottom: 8px;
	}

	.pattern-card p {
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	/* Footer */
	footer {
		padding: var(--section-padding) var(--container-padding);
		text-align: center;
		color: var(--text-tertiary);
		font-size: 0.9rem;
		animation: fadeSlideUp 0.5s ease-out 1s forwards;
		opacity: 0;
	}

	/* Responsive */
	@media (max-width: 1000px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.pattern-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 700px) {
		h1 {
			font-size: 1.8rem;
		}
		h2 {
			font-size: 1.4rem;
		}
		.grid {
			grid-template-columns: 1fr;
		}
		.pattern-grid {
			grid-template-columns: 1fr;
		}
		.hero {
			padding-top: 48px;
		}
	}
</style>
