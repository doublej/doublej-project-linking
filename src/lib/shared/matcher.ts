/**
 * Pure matching functions shared between server and widget.
 * No server/Node dependencies — safe for browser bundling.
 */

export type ManifestRule = {
	domain: string;
	pathPattern: string;
	priority: number;
	enabled: boolean;
	config: {
		cta: string;
		color: string;
		showStar: boolean;
		links: Array<{ label: string; url: string; icon: string }>;
	};
};

/**
 * Calculate specificity score for a path pattern.
 * Higher score = more specific.
 */
export function calculateSpecificity(pathPattern: string): number {
	let score = 0;
	const normalized = pathPattern.replace(/^\/+|\/+$/g, '');
	if (!normalized) return 1;

	const segments = normalized.split('/');
	const hasWildcard = pathPattern.includes('*');
	if (!hasWildcard) score += 1000;

	for (const segment of segments) {
		if (segment === '**') score += 1;
		else if (segment === '*') score += 10;
		else score += 100;
	}

	return score;
}

/**
 * Check if a pathname matches a pattern.
 * Supports exact match, single wildcard (*), double wildcard (**).
 */
export function matchPath(pathname: string, pattern: string): boolean {
	const normPath = pathname.replace(/^\/+|\/+$/g, '');
	const normPattern = pattern.replace(/^\/+|\/+$/g, '');

	if (!normPattern) return !normPath;

	const pathSegments = normPath ? normPath.split('/') : [];
	const patternSegments = normPattern.split('/');

	const doubleWildcardIndex = patternSegments.indexOf('**');
	if (doubleWildcardIndex !== -1) {
		const beforeWildcard = patternSegments.slice(0, doubleWildcardIndex);
		for (let i = 0; i < beforeWildcard.length; i++) {
			if (i >= pathSegments.length) return false;
			if (beforeWildcard[i] !== '*' && beforeWildcard[i] !== pathSegments[i]) return false;
		}
		return true;
	}

	if (pathSegments.length !== patternSegments.length) return false;

	for (let i = 0; i < patternSegments.length; i++) {
		if (patternSegments[i] === '*') continue;
		if (patternSegments[i] !== pathSegments[i]) return false;
	}

	return true;
}

/**
 * Find the best matching rule from a list of rules.
 * Filters by domain, enabled status, and path match.
 * Returns the highest-priority match.
 */
export function findBestMatch<T extends { domain: string; pathPattern: string; priority: number; enabled: boolean }>(
	domain: string,
	pathname: string,
	rules: T[]
): T | null {
	const matches = rules.filter(
		(r) => r.enabled && r.domain === domain && matchPath(pathname, r.pathPattern)
	);

	if (matches.length === 0) return null;

	matches.sort((a, b) => b.priority - a.priority);
	return matches[0];
}
