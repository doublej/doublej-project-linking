import { githubIcon, substackIcon, linkIcon } from './icons.js';

export type WidgetLink = {
	label: string;
	url: string;
	icon: string;
};

export type WidgetConfig = {
	links: WidgetLink[];
	color: string;
};

export function parseConfig(script: HTMLScriptElement): WidgetConfig | null {
	const links: WidgetLink[] = [];

	const github = script.dataset.github;
	if (github) {
		links.push({
			label: github,
			url: `https://github.com/${github}`,
			icon: githubIcon
		});
	}

	const substack = script.dataset.substack;
	if (substack) {
		links.push({
			label: substack,
			url: `https://${substack}.substack.com`,
			icon: substackIcon
		});
	}

	const custom = script.dataset.links;
	if (custom) {
		try {
			const parsed: { label: string; url: string }[] = JSON.parse(custom);
			for (const item of parsed) {
				if (item.label && item.url) {
					links.push({ label: item.label, url: item.url, icon: linkIcon });
				}
			}
		} catch {
			// ignore malformed JSON
		}
	}

	if (links.length === 0) return null;

	return {
		links,
		color: script.dataset.color || '#e63946'
	};
}
