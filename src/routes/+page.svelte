<script lang="ts">
	import Widget from '$lib/widget/Widget.svelte';
	import type { WidgetLink } from '$lib/widget/config.js';
	import { type IconKey, iconMap, detectIcon, formatCount } from '$lib/widget/config.js';
	import { onMount } from 'svelte';

	type LinkEntry = {
		label: string;
		url: string;
		icon: IconKey;
		manualIcon: boolean;
		shortening?: boolean;
		shortenError?: string;
	};

	type Profile = {
		id: string;
		name: string;
		config: {
			cta: string;
			color: string;
			showStar: boolean;
			links: Array<{ label: string; url: string; icon: IconKey }>;
		};
		createdAt: string;
		updatedAt: string;
	};

	type Rule = {
		id: string;
		profileId: string;
		domain: string;
		pathPattern: string;
		priority: number;
		enabled: boolean;
	};

	let profiles = $state<Profile[]>([]);
	let selectedProfileId = $state<string | null>(null);
	let rules = $state<Rule[]>([]);

	let selectedProfile = $derived(profiles.find((p) => p.id === selectedProfileId) || null);

	// Profile editor state
	let entries = $state<LinkEntry[]>([]);
	let ctaText = $state('Projects');
	let accentColor = $state('#e63946');
	let showStar = $state(true);
	let profileName = $state('Default Profile');

	// URL tester state
	let testDomain = $state('example.com');
	let testPath = $state('/');
	let matchedProfile = $state<Profile | null>(null);
	let matchedRule = $state<Rule | null>(null);

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
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-host.com';
		return `<script src="${origin}/widget.js"><\/script>`;
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

	// Profile management
	async function loadProfiles() {
		const res = await fetch('/api/profiles');
		profiles = await res.json();
		if (profiles.length > 0 && !selectedProfileId) {
			selectedProfileId = profiles[0].id;
		}
	}

	async function loadRules() {
		if (!selectedProfileId) return;
		const res = await fetch(`/api/rules?profileId=${selectedProfileId}`);
		rules = await res.json();
	}

	async function createProfile() {
		const res = await fetch('/api/profiles', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'New Profile',
				config: {
					cta: 'Projects',
					color: '#e63946',
					showStar: true,
					links: []
				}
			})
		});
		const newProfile = await res.json();
		profiles.push(newProfile);
		selectedProfileId = newProfile.id;
	}

	async function saveProfile() {
		if (!selectedProfileId) return;

		const config = {
			cta: ctaText,
			color: accentColor,
			showStar,
			links: entries.map((e) => ({ label: e.label, url: e.url, icon: e.icon }))
		};

		await fetch(`/api/profiles/${selectedProfileId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: profileName, config })
		});

		await loadProfiles();
	}

	async function deleteProfile() {
		if (!selectedProfileId) return;
		if (!confirm('Delete this profile?')) return;

		await fetch(`/api/profiles/${selectedProfileId}`, { method: 'DELETE' });
		profiles = profiles.filter((p) => p.id !== selectedProfileId);
		selectedProfileId = profiles.length > 0 ? profiles[0].id : null;
	}

	// Rule management
	async function addRule() {
		if (!selectedProfileId) return;

		const res = await fetch('/api/rules', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				profileId: selectedProfileId,
				domain: 'example.com',
				pathPattern: '/**',
				enabled: true
			})
		});
		const newRule = await res.json();
		rules.push(newRule);
	}

	async function updateRule(rule: Rule) {
		await fetch(`/api/rules/${rule.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(rule)
		});
		await loadRules();
	}

	async function deleteRule(ruleId: string) {
		await fetch(`/api/rules/${ruleId}`, { method: 'DELETE' });
		rules = rules.filter((r) => r.id !== ruleId);
	}

	// URL tester
	async function testUrl() {
		const res = await fetch(
			`/api/widget-config?domain=${encodeURIComponent(testDomain)}&pathname=${encodeURIComponent(testPath)}`
		);
		const config = await res.json();

		if (config) {
			// Find which profile matched
			const allRules = await fetch('/api/rules').then((r) => r.json());
			const match = allRules.find((rule: Rule) => {
				// Simple matching logic for display
				return rule.domain === testDomain && rule.enabled;
			});

			if (match) {
				matchedRule = match;
				matchedProfile = profiles.find((p) => p.id === match.profileId) || null;
			}
		} else {
			matchedProfile = null;
			matchedRule = null;
		}
	}

	// Load selected profile into editor
	$effect(() => {
		if (selectedProfile) {
			profileName = selectedProfile.name;
			ctaText = selectedProfile.config.cta;
			accentColor = selectedProfile.config.color;
			showStar = selectedProfile.config.showStar;
			entries = selectedProfile.config.links.map((link) => ({
				...link,
				manualIcon: false
			}));
			loadRules();
		}
	});

	onMount(() => {
		loadProfiles();
	});
</script>

<div class="page">
	<!-- Sidebar: Profile List -->
	<aside class="sidebar">
		<h2>Profiles</h2>
		<div class="profile-list">
			{#each profiles as profile}
				<button
					class="profile-item"
					class:active={profile.id === selectedProfileId}
					onclick={() => (selectedProfileId = profile.id)}
				>
					{profile.name}
				</button>
			{/each}
		</div>
		<button class="create-btn" onclick={createProfile}>+ New Profile</button>
	</aside>

	<!-- Main: Profile Editor & Rules -->
	<div class="main">
		{#if selectedProfile}
			<div class="toolbar">
				<input type="text" bind:value={profileName} class="profile-name-input" />
				<div class="toolbar-actions">
					<button onclick={saveProfile} class="save-btn">Save</button>
					<button onclick={deleteProfile} class="delete-btn">Delete</button>
				</div>
			</div>

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
				<h3>Links</h3>
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

			<section class="rules-section">
				<h3>Matching Rules</h3>
				<p class="help-text">
					Define where this profile should appear. Patterns support * (one segment) and ** (multiple
					segments).
				</p>
				{#each rules as rule}
					<div class="rule-row">
						<label class="rule-enabled">
							<input
								type="checkbox"
								checked={rule.enabled}
								onchange={(e) => {
									rule.enabled = e.currentTarget.checked;
									updateRule(rule);
								}}
							/>
						</label>
						<input
							type="text"
							bind:value={rule.domain}
							placeholder="example.com"
							class="rule-domain"
							onchange={() => updateRule(rule)}
						/>
						<input
							type="text"
							bind:value={rule.pathPattern}
							placeholder="/blog/**"
							class="rule-path"
							onchange={() => updateRule(rule)}
						/>
						<span class="rule-priority">{rule.priority}</span>
						<button class="remove-btn" onclick={() => deleteRule(rule.id)}>×</button>
					</div>
				{/each}
				<button class="add-btn" onclick={addRule}>+ Add Rule</button>
			</section>

			<section class="url-tester">
				<h3>URL Tester</h3>
				<div class="tester-inputs">
					<input type="text" bind:value={testDomain} placeholder="example.com" />
					<input type="text" bind:value={testPath} placeholder="/blog/post-1" />
					<button onclick={testUrl}>Test</button>
				</div>
				{#if matchedProfile}
					<div class="tester-result">
						<strong>Match:</strong> {matchedProfile.name}
						{#if matchedRule}
							<br />
							<small
								>Rule: {matchedRule.domain}{matchedRule.pathPattern} (priority: {matchedRule.priority})</small
							>
						{/if}
					</div>
				{:else if testDomain && testPath}
					<div class="tester-result no-match">No matching profile</div>
				{/if}
			</section>

			<section class="snippet">
				<h3>Embed Snippet</h3>
				<p class="help-text">Single line, no configuration needed. Widget auto-detects URL.</p>
				<pre><code>{snippet}</code></pre>
				<button onclick={copySnippet}>
					{copied ? 'Copied!' : 'Copy'}
				</button>
			</section>
		{:else}
			<div class="empty-state">
				<p>Create a profile to get started</p>
			</div>
		{/if}
	</div>

	<!-- Preview -->
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
		grid-template-columns: 220px 1fr 380px;
		gap: 2rem;
		max-width: 1400px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		font-family: system-ui, sans-serif;
	}

	@media (max-width: 1100px) {
		.page {
			grid-template-columns: 1fr 380px;
		}
		.sidebar {
			display: none;
		}
	}

	@media (max-width: 800px) {
		.page {
			grid-template-columns: 1fr;
		}
		.preview {
			order: -1;
		}
	}

	/* Sidebar */
	.sidebar {
		position: sticky;
		top: 2rem;
		align-self: start;
	}

	.sidebar h2 {
		font-size: 0.9rem;
		margin: 0 0 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #666;
	}

	.profile-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	.profile-item {
		padding: 0.6rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 0.85rem;
		text-align: left;
		transition: all 0.15s;
	}

	.profile-item:hover {
		background: #f8f8f8;
		border-color: #999;
	}

	.profile-item.active {
		background: #e8f4ff;
		border-color: #4a90e2;
		color: #2c5aa0;
		font-weight: 600;
	}

	.create-btn {
		width: 100%;
		padding: 0.6rem;
		border: 1px dashed #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 0.85rem;
		color: #666;
	}

	.create-btn:hover {
		background: #f8f8f8;
		border-color: #999;
	}

	/* Main */
	.main {
		min-width: 0;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}

	.profile-name-input {
		flex: 1;
		padding: 0.6rem 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.toolbar-actions {
		display: flex;
		gap: 0.5rem;
	}

	.save-btn {
		padding: 0.6rem 1.5rem;
		border: 1px solid #4a90e2;
		border-radius: 4px;
		background: #4a90e2;
		color: white;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.85rem;
	}

	.save-btn:hover {
		background: #357abd;
	}

	.delete-btn {
		padding: 0.6rem 1rem;
		border: 1px solid #e94444;
		border-radius: 4px;
		background: white;
		color: #e94444;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.delete-btn:hover {
		background: #fee;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #999;
	}

	h3 {
		font-size: 1rem;
		margin: 0 0 0.75rem;
	}

	.help-text {
		margin: -0.5rem 0 0.75rem;
		font-size: 0.8rem;
		color: #666;
	}

	/* Sections */
	.row {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.row fieldset {
		flex: 1;
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
	}

	.color-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle-row {
		margin-bottom: 1.5rem;
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
	}

	.link-row select {
		width: 90px;
		padding: 0.4rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.8rem;
	}

	.label-input {
		flex: 1 1 120px;
		padding: 0.4rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.85rem;
	}

	.url-input {
		flex: 2 1 160px;
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

	.remove-btn {
		padding: 0.3rem 0.6rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 1rem;
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

	/* Rules */
	.rules-section {
		margin-bottom: 1.5rem;
	}

	.rule-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.rule-enabled {
		display: flex;
		align-items: center;
	}

	.rule-domain {
		flex: 1;
		padding: 0.4rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.85rem;
		font-family: monospace;
	}

	.rule-path {
		flex: 1.5;
		padding: 0.4rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.85rem;
		font-family: monospace;
	}

	.rule-priority {
		font-size: 0.75rem;
		color: #999;
		font-weight: 600;
		min-width: 40px;
		text-align: right;
	}

	/* URL Tester */
	.url-tester {
		margin-bottom: 1.5rem;
	}

	.tester-inputs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.tester-inputs input {
		flex: 1;
		padding: 0.4rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.85rem;
		font-family: monospace;
	}

	.tester-inputs button {
		padding: 0.4rem 1rem;
		border: 1px solid #4a90e2;
		border-radius: 4px;
		background: #4a90e2;
		color: white;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.tester-result {
		padding: 0.75rem;
		background: #e8f5e9;
		border: 1px solid #4caf50;
		border-radius: 4px;
		font-size: 0.85rem;
	}

	.tester-result.no-match {
		background: #ffeaa7;
		border-color: #fdcb6e;
	}

	/* Snippet */
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
	}

	.widget-wrap :global(.widget) {
		position: absolute;
		bottom: 16px;
		right: 0;
	}
</style>
