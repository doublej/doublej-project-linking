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

	// State
	let profiles = $state<Profile[]>([]);
	let allRules = $state<Rule[]>([]);
	let selectedProfileId = $state<string | null>(null);
	let editorOpen = $state(false);
	let isNewProfile = $state(false);

	let selectedProfile = $derived(profiles.find((p) => p.id === selectedProfileId) || null);
	let rules = $derived(allRules.filter((r) => r.profileId === selectedProfileId));

	// Editor state
	let entries = $state<LinkEntry[]>([]);
	let ctaText = $state('Projects');
	let accentColor = $state('#e63946');
	let showStar = $state(true);
	let profileName = $state('New Profile');

	// Preview state
	let starCount = $state<string | null>(null);
	let lastFetchedUrl = $state<string | null>(null);

	let links = $derived<WidgetLink[]>(
		entries.map((e) => ({ label: e.label, url: e.url, icon: iconMap[e.icon] }))
	);

	let starUrl = $derived(entries.find((e) => e.icon === 'github')?.url ?? null);

	// Derived data for cards
	let profilesWithMeta = $derived(
		profiles.map((p) => ({
			...p,
			ruleCount: allRules.filter((r) => r.profileId === p.id).length,
			domains: [
				...new Set(
					allRules.filter((r) => r.profileId === p.id && r.enabled).map((r) => r.domain)
				)
			]
		}))
	);

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

	// Actions
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

	// API calls
	async function loadProfiles() {
		const res = await fetch('/api/profiles');
		profiles = await res.json();
	}

	async function loadAllRules() {
		const res = await fetch('/api/rules');
		allRules = await res.json();
	}

	async function createProfile() {
		const res = await fetch('/api/profiles', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: profileName,
				config: {
					cta: ctaText,
					color: accentColor,
					showStar,
					links: entries.map((e) => ({ label: e.label, url: e.url, icon: e.icon }))
				}
			})
		});
		const newProfile = await res.json();
		profiles.push(newProfile);
		selectedProfileId = newProfile.id;
		isNewProfile = false;
		return newProfile;
	}

	async function saveProfile() {
		if (!selectedProfileId) {
			await createProfile();
			return;
		}

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
		editorOpen = false;
	}

	async function deleteProfile() {
		if (!selectedProfileId) return;
		if (!confirm('Delete this profile and all its rules?')) return;

		// Delete all rules for this profile
		const profileRules = allRules.filter((r) => r.profileId === selectedProfileId);
		await Promise.all(profileRules.map((r) => fetch(`/api/rules/${r.id}`, { method: 'DELETE' })));

		await fetch(`/api/profiles/${selectedProfileId}`, { method: 'DELETE' });
		profiles = profiles.filter((p) => p.id !== selectedProfileId);
		allRules = allRules.filter((r) => r.profileId !== selectedProfileId);
		selectedProfileId = null;
		editorOpen = false;
	}

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
		allRules.push(newRule);
	}

	async function updateRule(rule: Rule) {
		await fetch(`/api/rules/${rule.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(rule)
		});
		await loadAllRules();
	}

	async function deleteRule(ruleId: string) {
		await fetch(`/api/rules/${ruleId}`, { method: 'DELETE' });
		allRules = allRules.filter((r) => r.id !== ruleId);
	}

	function openEditor(profileId: string | null, isNew = false) {
		selectedProfileId = profileId;
		isNewProfile = isNew;

		if (isNew) {
			profileName = 'New Profile';
			ctaText = 'Projects';
			accentColor = '#e63946';
			showStar = true;
			entries = [{ label: '', url: '', icon: 'github', manualIcon: false }];
		} else if (profileId) {
			const profile = profiles.find((p) => p.id === profileId);
			if (profile) {
				profileName = profile.name;
				ctaText = profile.config.cta;
				accentColor = profile.config.color;
				showStar = profile.config.showStar;
				entries = profile.config.links.map((link) => ({
					...link,
					manualIcon: false
				}));
			}
		}

		editorOpen = true;
	}

	function closeEditor() {
		editorOpen = false;
		selectedProfileId = null;
		isNewProfile = false;
	}

	onMount(() => {
		loadProfiles();
		loadAllRules();
	});
</script>

<div class="app">
	<!-- Header -->
	<header class="header">
		<div class="header-content">
			<div>
				<h1>Widget Profiles</h1>
				<p class="subtitle">Manage embeddable widgets with path-based matching</p>
			</div>
			<div class="header-actions">
				<a href="/docs" class="btn-ghost">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5" fill="none"/>
						<path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					</svg>
					Documentation
				</a>
				<button class="btn-primary" onclick={() => openEditor(null, true)}>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					</svg>
					New Profile
				</button>
			</div>
		</div>
	</header>

	<!-- Dashboard -->
	<main class="dashboard">
		{#if profiles.length === 0}
			<div class="empty-state">
				<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
					<rect x="8" y="12" width="32" height="24" rx="2" stroke="currentColor" stroke-width="2" />
					<path d="M16 20H32M16 24H28M16 28H24" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
				<h2>No profiles yet</h2>
				<p>Create your first widget profile to get started</p>
				<button class="btn-primary" onclick={() => openEditor(null, true)}>Create Profile</button>
			</div>
		{:else}
			<div class="card-grid">
				{#each profilesWithMeta as profile}
					<div class="profile-card">
						<div class="card-header">
							<div class="profile-title">
								<div class="color-indicator" style:background={profile.config.color}></div>
								<h3>{profile.name}</h3>
							</div>
							<button class="btn-ghost btn-sm" onclick={() => openEditor(profile.id)}>
								Edit
								<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
									<path d="M6 14L10 8L6 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</button>
						</div>

						<div class="card-body">
							<div class="meta-row">
								<span class="label">CTA</span>
								<span class="value">{profile.config.cta}</span>
							</div>
							<div class="meta-row">
								<span class="label">Links</span>
								<span class="value">{profile.config.links.length}</span>
							</div>
							<div class="meta-row">
								<span class="label">Rules</span>
								<span class="value">{profile.ruleCount}</span>
							</div>
							{#if profile.domains.length > 0}
								<div class="domains">
									{#each profile.domains.slice(0, 3) as domain}
										<span class="domain-tag">{domain}</span>
									{/each}
									{#if profile.domains.length > 3}
										<span class="domain-tag">+{profile.domains.length - 3} more</span>
									{/if}
								</div>
							{:else}
								<div class="domains">
									<span class="domain-tag muted">No rules configured</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>

	<!-- Slide-over Editor -->
	{#if editorOpen}
		<div class="overlay" onclick={closeEditor}></div>
		<aside class="slide-over">
			<div class="slide-over-header">
				<div>
					<input type="text" bind:value={profileName} class="profile-name-input" placeholder="Profile name" />
					<p class="slide-over-subtitle">{isNewProfile ? 'Create new' : 'Edit'} widget profile</p>
				</div>
				<button class="btn-ghost" onclick={closeEditor}>
					<svg width="20" height="20" viewBox="0 0 16 16" fill="none">
						<path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					</svg>
				</button>
			</div>

			<div class="slide-over-body">
				<!-- Widget Config -->
				<section class="section">
					<h4>Widget Settings</h4>
					<div class="form-grid">
						<div class="form-field">
							<label>CTA Text</label>
							<input type="text" bind:value={ctaText} placeholder="Projects" />
						</div>
						<div class="form-field">
							<label>Accent Color</label>
							<div class="color-input">
								<input type="color" bind:value={accentColor} />
								<input type="text" bind:value={accentColor} placeholder="#e63946" />
							</div>
						</div>
					</div>
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={showStar} />
						<span>Show "Star on GitHub" button</span>
					</label>
				</section>

				<!-- Links -->
				<section class="section">
					<div class="section-header">
						<h4>Links</h4>
						<button class="btn-ghost btn-sm" onclick={addEntry}>
							<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
								<path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
							</svg>
							Add
						</button>
					</div>
					<div class="links-list">
						{#each entries as entry, i}
							<div class="link-item">
								<select bind:value={entry.icon} onchange={() => onIconChange(entry)}>
									{#each iconOptions as opt}
										<option value={opt}>{opt}</option>
									{/each}
								</select>
								<input
									type="text"
									bind:value={entry.label}
									placeholder="Label"
									class="flex-1"
								/>
								<input
									type="url"
									bind:value={entry.url}
									placeholder="https://..."
									class="flex-2"
									oninput={() => onUrlChange(entry)}
								/>
								<button
									class="btn-icon"
									onclick={() => shortenUrl(entry)}
									disabled={entry.shortening || !entry.url}
									title={entry.shortenError || 'Shorten with Short.io'}
								>
									{entry.shortening ? '...' : '⚡'}
								</button>
								<button class="btn-icon danger" onclick={() => removeEntry(i)}>×</button>
							</div>
						{/each}
					</div>
				</section>

				<!-- Rules -->
				<section class="section">
					<div class="section-header">
						<div>
							<h4>Matching Rules</h4>
							<p class="help-text">Define where this widget appears using domain and path patterns</p>
						</div>
						<button class="btn-ghost btn-sm" onclick={addRule}>
							<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
								<path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
							</svg>
							Add Rule
						</button>
					</div>
					<div class="rules-list">
						{#each rules as rule}
							<div class="rule-item">
								<label class="checkbox-wrapper">
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
									class="flex-1 mono"
									onchange={() => updateRule(rule)}
								/>
								<input
									type="text"
									bind:value={rule.pathPattern}
									placeholder="/blog/**"
									class="flex-2 mono"
									onchange={() => updateRule(rule)}
								/>
								<span class="priority-badge">{rule.priority}</span>
								<button class="btn-icon danger" onclick={() => deleteRule(rule.id)}>×</button>
							</div>
						{/each}
					</div>
				</section>

				<!-- Embed Code -->
				<section class="section">
					<h4>Embed Code</h4>
					<p class="help-text">Single line script tag - widget auto-detects URL and loads matching profile</p>
					<div class="code-block">
						<code>{snippet}</code>
						<button class="copy-btn" onclick={copySnippet}>
							{copied ? 'Copied!' : 'Copy'}
						</button>
					</div>
				</section>

				<!-- Preview -->
				<section class="section">
					<h4>Preview</h4>
					<div class="preview-frame">
						<div class="preview-content">
							<div class="preview-line" style="width: 70%"></div>
							<div class="preview-line" style="width: 50%"></div>
							<div class="preview-line" style="width: 85%"></div>
						</div>
						{#if links.length > 0}
							<div class="widget-container">
								<Widget {links} color={accentColor} cta={ctaText} {starUrl} {showStar} {starCount} />
							</div>
						{/if}
					</div>
				</section>
			</div>

			<div class="slide-over-footer">
				<button class="btn-ghost" onclick={closeEditor}>Cancel</button>
				<div class="footer-actions">
					{#if !isNewProfile}
						<button class="btn-danger" onclick={deleteProfile}>Delete</button>
					{/if}
					<button class="btn-primary" onclick={saveProfile}>
						{isNewProfile ? 'Create Profile' : 'Save Changes'}
					</button>
				</div>
			</div>
		</aside>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		background: #fafafa;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	/* Layout */
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		padding: 1.5rem 2rem;
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
	}

	.subtitle {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	/* Dashboard */
	.dashboard {
		flex: 1;
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.empty-state svg {
		margin: 0 auto 1.5rem;
		color: #d1d5db;
	}

	.empty-state h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: #111827;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0 0 1.5rem;
		color: #6b7280;
	}

	/* Card Grid */
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.profile-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.25rem;
		transition: all 0.2s;
	}

	.profile-card:hover {
		border-color: #d1d5db;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.profile-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.color-indicator {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.profile-card h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.meta-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.label {
		color: #6b7280;
		font-weight: 500;
	}

	.value {
		color: #111827;
		font-weight: 500;
	}

	.domains {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.domain-tag {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: #f3f4f6;
		color: #374151;
		border-radius: 4px;
		font-family: 'SF Mono', Monaco, monospace;
	}

	.domain-tag.muted {
		color: #9ca3af;
		font-style: italic;
		font-family: inherit;
	}

	/* Slide-over */
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 40;
		animation: fadeIn 0.2s;
	}

	.slide-over {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 600px;
		max-width: 100vw;
		background: white;
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
		z-index: 50;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.slide-over-header {
		padding: 1.5rem 2rem;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.profile-name-input {
		font-size: 1.25rem;
		font-weight: 600;
		border: none;
		padding: 0.25rem 0;
		width: 100%;
		color: #111827;
		outline: none;
		border-bottom: 2px solid transparent;
		transition: border-color 0.2s;
	}

	.profile-name-input:focus {
		border-bottom-color: #3b82f6;
	}

	.slide-over-subtitle {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.slide-over-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem 2rem;
	}

	.slide-over-footer {
		padding: 1rem 2rem;
		border-top: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.footer-actions {
		display: flex;
		gap: 0.75rem;
	}

	/* Sections */
	.section {
		margin-bottom: 2rem;
	}

	.section h4 {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #374151;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.section-header h4 {
		margin: 0;
	}

	.help-text {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: #6b7280;
	}

	/* Forms */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-field label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-field input[type='text'] {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.form-field input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.color-input {
		display: flex;
		gap: 0.5rem;
	}

	.color-input input[type='color'] {
		width: 48px;
		height: 38px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		cursor: pointer;
	}

	.color-input input[type='text'] {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.875rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #374151;
		cursor: pointer;
	}

	.checkbox-label input {
		cursor: pointer;
	}

	/* Links List */
	.links-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.link-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.link-item select {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.8125rem;
		background: white;
		cursor: pointer;
	}

	.link-item input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.link-item input:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.flex-1 {
		flex: 1;
	}

	.flex-2 {
		flex: 2;
	}

	.mono {
		font-family: 'SF Mono', Monaco, monospace;
	}

	/* Rules List */
	.rules-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.rule-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
	}

	.priority-badge {
		padding: 0.25rem 0.5rem;
		background: #f3f4f6;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		min-width: 40px;
		text-align: center;
	}

	/* Code Block */
	.code-block {
		position: relative;
		background: #1f2937;
		border-radius: 6px;
		padding: 1rem;
	}

	.code-block code {
		color: #f3f4f6;
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 0.8125rem;
		line-height: 1.5;
		display: block;
	}

	.copy-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.375rem 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	/* Preview */
	.preview-frame {
		position: relative;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		min-height: 300px;
		overflow: hidden;
	}

	.preview-content {
		padding: 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.preview-line {
		height: 10px;
		background: #e5e7eb;
		border-radius: 4px;
	}

	.widget-container {
		position: absolute;
		bottom: 0;
		right: 0;
	}

	.widget-container :global(.widget) {
		position: absolute;
		bottom: 16px;
		right: 0;
	}

	/* Buttons */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-ghost {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		color: #6b7280;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
	}

	.btn-ghost:hover {
		background: #f9fafb;
		color: #374151;
		border-color: #d1d5db;
	}

	.btn-danger {
		padding: 0.625rem 1rem;
		background: white;
		color: #dc2626;
		border: 1px solid #dc2626;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-danger:hover {
		background: #dc2626;
		color: white;
	}

	.btn-sm {
		padding: 0.375rem 0.625rem;
		font-size: 0.8125rem;
	}

	.btn-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		color: #6b7280;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.btn-icon:hover {
		background: #f9fafb;
		color: #374151;
	}

	.btn-icon.danger:hover {
		background: #fee;
		color: #dc2626;
		border-color: #dc2626;
	}

	.btn-icon:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}
</style>
