import { githubIcon, substackIcon, linkIcon, starIcon } from './icons.js';

export type IconKey = 'github' | 'substack' | 'link' | 'star';

export const iconMap: Record<IconKey, string> = {
	github: githubIcon,
	substack: substackIcon,
	link: linkIcon,
	star: starIcon
};

export type WidgetLink = {
	label: string;
	url: string;
	icon: string;
};

export type WidgetConfig = {
	cta: string;
	links: WidgetLink[];
	color: string;
	starUrl: string | null;
	showStar: boolean;
};

export function formatCount(n: number): string {
	if (n < 1000) return String(n);
	const k = n / 1000;
	return k >= 100 ? `${Math.round(k)}k` : `${+k.toFixed(1)}k`;
}

export function detectIcon(url: string): IconKey {
	if (url.includes('github.com')) return 'github';
	if (url.includes('substack.com')) return 'substack';
	return 'link';
}

export function parseConfig(script: HTMLScriptElement): WidgetConfig | null {
	const links: WidgetLink[] = [];

	// New: data-links JSON array of {label, url, icon?}
	const linksAttr = script.dataset.links;
	if (linksAttr) {
		try {
			const parsed: { label: string; url: string; icon?: IconKey }[] = JSON.parse(linksAttr);
			for (const item of parsed) {
				if (item.label && item.url) {
					const key = item.icon ?? detectIcon(item.url);
					links.push({ label: item.label, url: item.url, icon: iconMap[key] });
				}
			}
		} catch {
			// ignore malformed JSON
		}
	}

	// Backward compat: data-github
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

	// Backward compat: data-substack
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

	// Backward compat: data-projects
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

	// starUrl: first github link (from data-links or data-github)
	const firstGithubLink = links.find((l) => l.icon === githubIcon);
	const firstRepo = github?.split(',')[0]?.trim();
	const starUrl = firstGithubLink?.url ?? (firstRepo ? `https://github.com/${firstRepo}` : null);

	const showStar = script.dataset.star !== 'false';

	return {
		cta: script.dataset.cta || 'Projects',
		links,
		color: script.dataset.color || '#e63946',
		starUrl,
		showStar
	};
}
