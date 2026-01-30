<script lang="ts">
	let selectedSection = $state<string>('getting-started');

	const sections = [
		{ id: 'getting-started', title: 'Getting Started' },
		{ id: 'path-matching', title: 'Path Matching' },
		{ id: 'profiles', title: 'Profiles & Rules' },
		{ id: 'embedding', title: 'Embedding' },
		{ id: 'api', title: 'API Reference' }
	];
</script>

<svelte:head>
	<title>Documentation - Widget Profiles</title>
</svelte:head>

<div class="docs-page">
	<!-- Header -->
	<header class="header">
		<div class="header-content">
			<a href="/" class="back-link">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M10 14L4 8L10 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				Back to Dashboard
			</a>
			<h1>Documentation</h1>
		</div>
	</header>

	<div class="docs-container">
		<!-- Sidebar Navigation -->
		<aside class="docs-nav">
			<nav>
				{#each sections as section}
					<button
						class="nav-item"
						class:active={selectedSection === section.id}
						onclick={() => selectedSection = section.id}
					>
						{section.title}
					</button>
				{/each}
			</nav>
		</aside>

		<!-- Content -->
		<main class="docs-content">
			{#if selectedSection === 'getting-started'}
				<section>
					<h2>Getting Started</h2>
					<p class="lead">
						The widget system uses path-based profile matching to automatically display the right widget on your pages.
					</p>

					<h3>How It Works</h3>
					<ol class="steps">
						<li>
							<strong>Create a Profile</strong>
							<p>Define your widget's appearance: CTA text, colors, and links</p>
						</li>
						<li>
							<strong>Add Matching Rules</strong>
							<p>Specify which domains and paths should display this profile</p>
						</li>
						<li>
							<strong>Embed the Widget</strong>
							<p>Add a single line of code to your website</p>
						</li>
						<li>
							<strong>Auto-Detection</strong>
							<p>Widget detects the URL and loads the matching profile automatically</p>
						</li>
					</ol>

					<div class="callout">
						<h4>No Configuration Required</h4>
						<p>
							Unlike traditional widgets, you don't need to configure anything in the embed code.
							The widget automatically fetches the right configuration based on the page URL.
						</p>
					</div>
				</section>

			{:else if selectedSection === 'path-matching'}
				<section>
					<h2>Path Matching</h2>
					<p class="lead">
						Path patterns determine where each profile appears using a specificity-based matching system.
					</p>

					<h3>Pattern Syntax</h3>
					<div class="pattern-grid">
						<div class="pattern-card">
							<code class="pattern-example">/blog/featured</code>
							<p class="pattern-desc">Exact path - matches only this specific URL</p>
							<span class="priority-label">Priority: 1200</span>
						</div>

						<div class="pattern-card">
							<code class="pattern-example">/blog/*</code>
							<p class="pattern-desc">Single wildcard - matches one path segment</p>
							<span class="priority-label">Priority: 110</span>
						</div>

						<div class="pattern-card">
							<code class="pattern-example">/blog/**</code>
							<p class="pattern-desc">Multi-level wildcard - matches multiple segments</p>
							<span class="priority-label">Priority: 101</span>
						</div>

						<div class="pattern-card">
							<code class="pattern-example">/**</code>
							<p class="pattern-desc">Catch-all - matches any path</p>
							<span class="priority-label">Priority: 1</span>
						</div>
					</div>

					<h3>Specificity Rules</h3>
					<p>When multiple rules match, the most specific one wins:</p>
					<ul>
						<li><strong>Exact paths</strong> always win over wildcards</li>
						<li><strong>More segments</strong> beat fewer segments</li>
						<li><strong>Single wildcards (*)</strong> beat double wildcards (**)</li>
					</ul>

					<h3>Examples</h3>
					<table class="examples-table">
						<thead>
							<tr>
								<th>URL</th>
								<th>Pattern</th>
								<th>Match?</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><code>/blog/post-1</code></td>
								<td><code>/blog/*</code></td>
								<td><span class="badge success">✓ Match</span></td>
							</tr>
							<tr>
								<td><code>/blog/2024/post-1</code></td>
								<td><code>/blog/*</code></td>
								<td><span class="badge error">✗ No match</span></td>
							</tr>
							<tr>
								<td><code>/blog/2024/post-1</code></td>
								<td><code>/blog/**</code></td>
								<td><span class="badge success">✓ Match</span></td>
							</tr>
							<tr>
								<td><code>/about</code></td>
								<td><code>/**</code></td>
								<td><span class="badge success">✓ Match</span></td>
							</tr>
						</tbody>
					</table>
				</section>

			{:else if selectedSection === 'profiles'}
				<section>
					<h2>Profiles & Rules</h2>
					<p class="lead">
						Profiles define how your widget looks and behaves. Rules determine where each profile appears.
					</p>

					<h3>Creating a Profile</h3>
					<ol>
						<li>Click <strong>New Profile</strong> in the dashboard</li>
						<li>Set a descriptive name</li>
						<li>Configure widget settings:
							<ul>
								<li><strong>CTA Text</strong> - The vertical text on the widget tab</li>
								<li><strong>Accent Color</strong> - Primary color for the widget</li>
								<li><strong>Show Star</strong> - Display GitHub star button</li>
							</ul>
						</li>
						<li>Add links with labels, URLs, and icons</li>
						<li>Save the profile</li>
					</ol>

					<h3>Configuring Rules</h3>
					<p>Each profile can have multiple matching rules:</p>

					<div class="rule-example">
						<div class="rule-field">
							<label>Domain</label>
							<code>example.com</code>
							<p>The hostname where this rule applies (no protocol)</p>
						</div>
						<div class="rule-field">
							<label>Path Pattern</label>
							<code>/blog/**</code>
							<p>The URL path pattern to match</p>
						</div>
						<div class="rule-field">
							<label>Enabled</label>
							<input type="checkbox" checked disabled />
							<p>Toggle to activate/deactivate the rule</p>
						</div>
					</div>

					<div class="callout info">
						<h4>Priority Calculation</h4>
						<p>
							Priority is automatically calculated when you save a rule. You don't need to set it manually.
							The system ensures the most specific rule always wins.
						</p>
					</div>

					<h3>Testing Rules</h3>
					<p>Use the URL Tester in the profile editor to verify which profile matches a given URL:</p>
					<ol>
						<li>Enter the domain and path</li>
						<li>Click <strong>Test</strong></li>
						<li>See which profile matches and its priority score</li>
					</ol>
				</section>

			{:else if selectedSection === 'embedding'}
				<section>
					<h2>Embedding the Widget</h2>
					<p class="lead">
						Add the widget to your website with a single line of code.
					</p>

					<h3>Modern Method (Recommended)</h3>
					<p>Single script tag, no configuration needed:</p>
					<pre class="code-block"><code>&lt;script src="https://your-host.com/widget.js"&gt;&lt;/script&gt;</code></pre>

					<p class="note">
						The widget will automatically detect the current page URL and load the matching profile.
						If no profile matches, the widget stays hidden.
					</p>

					<h3>Widget Behavior</h3>
					<ol>
						<li>Script loads and executes</li>
						<li>Widget detects <code>window.location.hostname</code> and <code>pathname</code></li>
						<li>Calls <code>/api/widget-config?domain=X&amp;pathname=Y</code></li>
						<li>If match found → Widget renders with profile config</li>
						<li>If no match → Widget remains hidden</li>
					</ol>

					<h3>Legacy Method (Backward Compatible)</h3>
					<p>For existing embeds using attribute-based configuration:</p>
					<pre class="code-block"><code>&lt;script src="https://your-host.com/widget.js"
  data-links='[{{"label":"My Project","url":"https://...","icon":"github"}}]'
  data-cta="Projects"
  data-color="#e63946"&gt;
&lt;/script&gt;</code></pre>

					<p class="note">
						This method still works but doesn't benefit from path-matching.
						Migrate to the modern method for better management.
					</p>

					<h3>Placement</h3>
					<p>Add the script tag anywhere in your HTML, preferably before <code>&lt;/body&gt;</code>:</p>
					<ul>
						<li>Works on any page (HTML, CMS, static site generators)</li>
						<li>No dependencies required</li>
						<li>Styles are isolated via Shadow DOM</li>
					</ul>
				</section>

			{:else if selectedSection === 'api'}
				<section>
					<h2>API Reference</h2>
					<p class="lead">
						Complete API documentation for widget configuration and profile management.
					</p>

					<h3>Widget Configuration</h3>
					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method get">GET</span>
							<code>/api/widget-config</code>
						</div>
						<p>Returns the matching profile configuration for a given URL.</p>
						<h4>Query Parameters</h4>
						<ul>
							<li><code>domain</code> (required) - The hostname (e.g., "example.com")</li>
							<li><code>pathname</code> (required) - The URL path (e.g., "/blog/post-1")</li>
						</ul>
						<h4>Response</h4>
						<pre class="code-block"><code>{`{
  "cta": "Projects",
  "color": "#e63946",
  "showStar": true,
  "links": [
    {
      "label": "My Project",
      "url": "https://github.com/user/repo",
      "icon": "github"
    }
  ]
}`}</code></pre>
						<p>Returns <code>null</code> if no matching profile is found.</p>
					</div>

					<h3>Profile Management</h3>
					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method get">GET</span>
							<code>/api/profiles</code>
						</div>
						<p>List all profiles.</p>
					</div>

					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method post">POST</span>
							<code>/api/profiles</code>
						</div>
						<p>Create a new profile.</p>
						<h4>Request Body</h4>
						<pre class="code-block"><code>{`{
  "name": "My Profile",
  "config": {
    "cta": "Projects",
    "color": "#e63946",
    "showStar": true,
    "links": [...]
  }
}`}</code></pre>
					</div>

					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method put">PUT</span>
							<code>/api/profiles/[id]</code>
						</div>
						<p>Update an existing profile.</p>
					</div>

					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method delete">DELETE</span>
							<code>/api/profiles/[id]</code>
						</div>
						<p>Delete a profile.</p>
					</div>

					<h3>Rule Management</h3>
					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method get">GET</span>
							<code>/api/rules</code>
						</div>
						<p>List all rules. Optionally filter by profile.</p>
						<h4>Query Parameters</h4>
						<ul>
							<li><code>profileId</code> (optional) - Filter rules by profile ID</li>
						</ul>
					</div>

					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method post">POST</span>
							<code>/api/rules</code>
						</div>
						<p>Create a new matching rule. Priority is automatically calculated.</p>
						<h4>Request Body</h4>
						<pre class="code-block"><code>{`{
  "profileId": "uuid",
  "domain": "example.com",
  "pathPattern": "/blog/**",
  "enabled": true
}`}</code></pre>
					</div>

					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method put">PUT</span>
							<code>/api/rules/[id]</code>
						</div>
						<p>Update a rule. Priority is recalculated automatically.</p>
					</div>

					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method delete">DELETE</span>
							<code>/api/rules/[id]</code>
						</div>
						<p>Delete a rule.</p>
					</div>

					<h3>URL Shortening</h3>
					<div class="api-endpoint">
						<div class="endpoint-header">
							<span class="method post">POST</span>
							<code>/api/shorten</code>
						</div>
						<p>Shorten a URL using Short.io integration.</p>
						<h4>Request Body</h4>
						<pre class="code-block"><code>{`{
  "originalURL": "https://example.com/very/long/url",
  "slug": "my-slug" // optional
}`}</code></pre>
						<h4>Response</h4>
						<pre class="code-block"><code>{`{
  "shortURL": "https://l.jurrejan.com/my-slug",
  "slug": "my-slug",
  "originalURL": "https://example.com/very/long/url"
}`}</code></pre>
					</div>
				</section>
			{/if}
		</main>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #fafafa;
	}

	.docs-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* Header */
	.header {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		padding: 1.5rem 2rem;
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
		text-decoration: none;
		margin-bottom: 0.75rem;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #111827;
	}

	h1 {
		margin: 0;
		font-size: 1.875rem;
		font-weight: 600;
		color: #111827;
	}

	/* Layout */
	.docs-container {
		flex: 1;
		display: grid;
		grid-template-columns: 240px 1fr;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		gap: 3rem;
		padding: 2rem;
	}

	/* Navigation */
	.docs-nav {
		position: sticky;
		top: 2rem;
		align-self: start;
	}

	.docs-nav nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nav-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.625rem 0.75rem;
		background: transparent;
		border: none;
		border-left: 2px solid transparent;
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.nav-item:hover {
		color: #111827;
		background: #f9fafb;
	}

	.nav-item.active {
		color: #3b82f6;
		border-left-color: #3b82f6;
		background: #eff6ff;
	}

	/* Content */
	.docs-content {
		max-width: 800px;
	}

	section {
		margin-bottom: 3rem;
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 1.875rem;
		font-weight: 600;
		color: #111827;
	}

	h3 {
		margin: 2rem 0 1rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
	}

	h4 {
		margin: 1.5rem 0 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
	}

	.lead {
		font-size: 1.125rem;
		color: #6b7280;
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	p {
		margin: 0 0 1rem;
		color: #374151;
		line-height: 1.6;
	}

	ul, ol {
		margin: 0 0 1rem;
		padding-left: 1.5rem;
		color: #374151;
		line-height: 1.6;
	}

	li {
		margin-bottom: 0.5rem;
	}

	code {
		background: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.875em;
		color: #111827;
	}

	/* Steps */
	.steps {
		list-style: none;
		padding: 0;
		counter-reset: step;
	}

	.steps li {
		position: relative;
		padding-left: 3rem;
		margin-bottom: 1.5rem;
	}

	.steps li::before {
		content: counter(step);
		counter-increment: step;
		position: absolute;
		left: 0;
		top: 0;
		width: 2rem;
		height: 2rem;
		background: #3b82f6;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.steps strong {
		display: block;
		font-size: 1rem;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.steps p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	/* Callouts */
	.callout {
		background: #f0f9ff;
		border-left: 3px solid #3b82f6;
		padding: 1rem 1.25rem;
		margin: 1.5rem 0;
		border-radius: 4px;
	}

	.callout.info {
		background: #f0fdf4;
		border-left-color: #22c55e;
	}

	.callout h4 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
	}

	.callout p {
		margin: 0;
		font-size: 0.875rem;
		color: #374151;
	}

	/* Pattern Grid */
	.pattern-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin: 1.5rem 0;
	}

	.pattern-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1rem;
	}

	.pattern-example {
		display: block;
		font-size: 1rem;
		margin-bottom: 0.5rem;
		color: #3b82f6;
	}

	.pattern-desc {
		font-size: 0.8125rem;
		color: #6b7280;
		margin-bottom: 0.75rem;
	}

	.priority-label {
		display: inline-block;
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: #f3f4f6;
		color: #6b7280;
		border-radius: 3px;
		font-weight: 600;
	}

	/* Tables */
	.examples-table {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
		font-size: 0.875rem;
	}

	.examples-table th {
		text-align: left;
		padding: 0.75rem;
		background: #f9fafb;
		border-bottom: 2px solid #e5e7eb;
		font-weight: 600;
		color: #111827;
	}

	.examples-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
		color: #374151;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.625rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge.success {
		background: #dcfce7;
		color: #16a34a;
	}

	.badge.error {
		background: #fee2e2;
		color: #dc2626;
	}

	/* Rule Example */
	.rule-example {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1.5rem;
		margin: 1.5rem 0;
	}

	.rule-field {
		margin-bottom: 1.5rem;
	}

	.rule-field:last-child {
		margin-bottom: 0;
	}

	.rule-field label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.rule-field code {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.rule-field p {
		margin: 0;
		font-size: 0.8125rem;
		color: #6b7280;
	}

	/* Code Blocks */
	.code-block {
		background: #1f2937;
		border-radius: 6px;
		padding: 1rem;
		margin: 1.5rem 0;
		overflow-x: auto;
	}

	.code-block code {
		background: transparent;
		color: #f3f4f6;
		padding: 0;
		font-size: 0.8125rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.note {
		font-size: 0.875rem;
		color: #6b7280;
		font-style: italic;
		margin: 1rem 0;
	}

	/* API Endpoints */
	.api-endpoint {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1.5rem;
		margin: 1.5rem 0;
	}

	.endpoint-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.method {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.method.get {
		background: #dcfce7;
		color: #16a34a;
	}

	.method.post {
		background: #dbeafe;
		color: #2563eb;
	}

	.method.put {
		background: #fef3c7;
		color: #d97706;
	}

	.method.delete {
		background: #fee2e2;
		color: #dc2626;
	}

	.endpoint-header code {
		font-size: 1rem;
	}

	@media (max-width: 900px) {
		.docs-container {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.docs-nav {
			position: static;
		}

		.docs-nav nav {
			flex-direction: row;
			overflow-x: auto;
			gap: 0.5rem;
			padding-bottom: 0.5rem;
		}

		.nav-item {
			border-left: none;
			border-bottom: 2px solid transparent;
			white-space: nowrap;
		}

		.nav-item.active {
			border-left-color: transparent;
			border-bottom-color: #3b82f6;
		}
	}
</style>
