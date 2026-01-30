import { githubIcon, substackIcon, linkIcon } from './icons.js';

export type WidgetLink = {
	label: string;
	url: string;
	icon: string;
};

export type WidgetConfig = {
	cta: string;
	links: WidgetLink[];
	color: string;
};

export function parseConfig(script: HTMLScriptElement): WidgetConfig | null {
	const links: WidgetLink[] = [];

	const github = script.dataset.github;
	if (github) {
		for (const repo of github.split(',')) {
			const trimmed = repo.trim();
			if (trimmed) {
				links.push({
					label: trimmed,
					url: `https://github.com/${trimmed}`,
					icon: githubIcon
				});
			}
		}
	}

	const substack = script.dataset.substack;
	if (substack) {
		for (const slug of substack.split(',')) {
			const trimmed = slug.trim();
			if (trimmed) {
				links.push({
					label: trimmed,
					url: `https://${trimmed}.substack.com`,
					icon: substackIcon
				});
			}
		}
	}

	const projects = script.dataset.projects;
	if (projects) {
		try {
			const parsed: { label: string; url: string }[] = JSON.parse(projects);
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
		cta: script.dataset.cta || 'Projects',
		links,
		color: script.dataset.color || '#e63946'
	};
}
