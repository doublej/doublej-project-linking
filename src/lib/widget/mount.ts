import { mount } from 'svelte';
import Widget from './Widget.svelte';
import { parseConfig, iconMap, type WidgetConfig, type IconKey } from './config.js';

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

/**
 * Fetch widget config from API based on current page URL
 */
async function fetchConfig(): Promise<WidgetConfig | null> {
	try {
		const domain = window.location.hostname;
		const pathname = window.location.pathname;

		// Get API base URL from script src or default to current origin
		let apiBase = window.location.origin;
		if (scriptEl?.src) {
			const scriptUrl = new URL(scriptEl.src);
			apiBase = scriptUrl.origin;
		}

		const url = `${apiBase}/api/widget-config?domain=${encodeURIComponent(domain)}&pathname=${encodeURIComponent(pathname)}`;
		const response = await fetch(url);

		if (!response.ok) return null;

		const profileConfig: ProfileConfig | null = await response.json();
		if (!profileConfig) return null;

		// Convert ProfileConfig to WidgetConfig
		const links = profileConfig.links.map((link) => ({
			label: link.label,
			url: link.url,
			icon: iconMap[link.icon]
		}));

		// Find first GitHub link for star URL
		const firstGithubLink = profileConfig.links.find((l) => l.icon === 'github');
		const starUrl = firstGithubLink?.url ?? null;

		return {
			cta: profileConfig.cta,
			links,
			color: profileConfig.color,
			starUrl,
			showStar: profileConfig.showStar
		};
	} catch {
		return null;
	}
}

async function init() {
	// Try API-based config first
	let config = await fetchConfig();

	// Fallback to attribute-based config
	if (!config && scriptEl) {
		config = parseConfig(scriptEl);
	}

	// No config found - don't mount widget
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
