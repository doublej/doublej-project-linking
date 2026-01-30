import { mount } from 'svelte';
import Widget from './Widget.svelte';
import { parseConfig, iconMap, type WidgetConfig, type IconKey } from './config.js';
import { findBestMatch, type ManifestRule } from '../shared/matcher.js';

type ProfileConfig = {
	cta: string;
	color: string;
	showStar: boolean;
	links: Array<{ label: string; url: string; icon: IconKey }>;
};

const scriptEl =
	(document.currentScript as HTMLScriptElement | null) ??
	document.querySelector<HTMLScriptElement>(
		'script[data-github], script[data-substack], script[data-projects], script[src*="widget.js"]'
	);

/** Derive the base URL from the script src (directory containing widget.js). */
function getScriptBase(): string {
	if (scriptEl?.src) {
		const url = new URL(scriptEl.src);
		const dir = url.pathname.replace(/\/[^/]*$/, '');
		return url.origin + dir;
	}
	return window.location.origin;
}

function profileToWidgetConfig(profileConfig: ProfileConfig): WidgetConfig {
	const links = profileConfig.links.map((link) => ({
		label: link.label,
		url: link.url,
		icon: iconMap[link.icon]
	}));

	const firstGithubLink = profileConfig.links.find((l) => l.icon === 'github');

	return {
		cta: profileConfig.cta,
		links,
		color: profileConfig.color,
		starUrl: firstGithubLink?.url ?? null,
		showStar: profileConfig.showStar
	};
}

/**
 * Try the dynamic API endpoint first.
 */
async function fetchFromApi(scriptBase: string): Promise<WidgetConfig | null> {
	const domain = window.location.hostname;
	const pathname = window.location.pathname;
	const url = `${scriptBase}/api/widget-config?domain=${encodeURIComponent(domain)}&pathname=${encodeURIComponent(pathname)}`;
	const response = await fetch(url);

	if (!response.ok) return null;

	const profileConfig: ProfileConfig | null = await response.json();
	if (!profileConfig) return null;

	return profileToWidgetConfig(profileConfig);
}

/**
 * Fallback: fetch the static manifest and match client-side.
 */
async function fetchFromManifest(scriptBase: string): Promise<WidgetConfig | null> {
	const url = `${scriptBase}/widget-manifest.json`;
	const response = await fetch(url);

	if (!response.ok) return null;

	const manifest: { rules: ManifestRule[] } = await response.json();
	const domain = window.location.hostname;
	const pathname = window.location.pathname;
	const match = findBestMatch(domain, pathname, manifest.rules);

	if (!match) return null;

	return profileToWidgetConfig(match.config as ProfileConfig);
}

/**
 * Fetch widget config: API first, then static manifest fallback.
 */
async function fetchConfig(): Promise<WidgetConfig | null> {
	const base = getScriptBase();

	try {
		const config = await fetchFromApi(base);
		if (config) return config;
	} catch {
		// API unavailable, try manifest
	}

	try {
		return await fetchFromManifest(base);
	} catch {
		return null;
	}
}

async function init() {
	let config = await fetchConfig();

	// Fallback to attribute-based config
	if (!config && scriptEl) {
		config = parseConfig(scriptEl);
	}

	if (!config) return;

	const host = document.createElement('div');
	host.id = 'doublej-widget';
	document.body.appendChild(host);

	const shadow = host.attachShadow({ mode: 'closed' });

	mount(Widget, {
		target: shadow,
		props: {
			links: config.links,
			color: config.color,
			cta: config.cta,
			starUrl: config.starUrl,
			showStar: config.showStar
		}
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
