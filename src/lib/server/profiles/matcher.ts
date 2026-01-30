import type { MatchingRule, WidgetProfile } from './types.js';
import { loadAllRules, loadProfile } from './storage.js';

/**
 * Calculate specificity score for a path pattern.
 * Higher score = more specific.
 *
 * Scoring:
 * - Exact path (no wildcards): +1000 points
 * - Each path segment: +100 points
 * - Single wildcard (*): +10 points
 * - Double wildcard (**): +1 point
 */
export function calculateSpecificity(pathPattern: string): number {
	let score = 0;

	// Remove leading/trailing slashes for consistent parsing
	const normalized = pathPattern.replace(/^\/+|\/+$/g, '');

	// Empty pattern (just "/") gets minimal score
	if (!normalized) return 1;

	const segments = normalized.split('/');

	// Check if pattern contains any wildcards
	const hasWildcard = pathPattern.includes('*');
	if (!hasWildcard) {
		score += 1000; // Exact path bonus
	}

	// Score each segment
	for (const segment of segments) {
		if (segment === '**') {
			score += 1; // Double wildcard: least specific
		} else if (segment === '*') {
			score += 10; // Single wildcard: somewhat specific
		} else {
			score += 100; // Literal segment: very specific
		}
	}

	return score;
}

/**
 * Check if a pathname matches a pattern.
 * Supports:
 * - Exact match: /blog/post-1
 * - Single wildcard: /blog/* (matches /blog/post-1, not /blog/2024/post-1)
 * - Double wildcard: /blog/** (matches /blog/post-1 and /blog/2024/post-1)
 */
export function matchPath(pathname: string, pattern: string): boolean {
	// Normalize paths
	const normPath = pathname.replace(/^\/+|\/+$/g, '');
	const normPattern = pattern.replace(/^\/+|\/+$/g, '');

	// Empty pattern matches empty path only
	if (!normPattern) return !normPath;

	const pathSegments = normPath ? normPath.split('/') : [];
	const patternSegments = normPattern.split('/');

	// Check for double wildcard
	const doubleWildcardIndex = patternSegments.indexOf('**');
	if (doubleWildcardIndex !== -1) {
		// Pattern has **, so match prefix before **
		const beforeWildcard = patternSegments.slice(0, doubleWildcardIndex);

		// Check if path starts with the prefix
		for (let i = 0; i < beforeWildcard.length; i++) {
			if (i >= pathSegments.length) return false;
			if (beforeWildcard[i] !== '*' && beforeWildcard[i] !== pathSegments[i]) {
				return false;
			}
		}

		return true; // Prefix matches, ** matches the rest
	}

	// No **, so exact segment count must match
	if (pathSegments.length !== patternSegments.length) return false;

	// Check each segment
	for (let i = 0; i < patternSegments.length; i++) {
		const patternSeg = patternSegments[i];
		const pathSeg = pathSegments[i];

		if (patternSeg === '*') continue; // Single wildcard matches any segment
		if (patternSeg !== pathSeg) return false; // Literal must match exactly
	}

	return true;
}

/**
 * Find the best matching rule for a domain and pathname.
 * Returns the rule with the highest specificity score.
 */
export function findBestMatch(
	domain: string,
	pathname: string,
	rules: MatchingRule[]
): MatchingRule | null {
	const enabledRules = rules.filter((r) => r.enabled && r.domain === domain);

	const matches = enabledRules.filter((r) => matchPath(pathname, r.pathPattern));

	if (matches.length === 0) return null;

	// Sort by priority (highest first)
	matches.sort((a, b) => b.priority - a.priority);

	return matches[0];
}

/**
 * Find the matching profile for a domain and pathname.
 * Returns the profile config if a match is found, otherwise null.
 */
export async function findMatchingProfile(
	domain: string,
	pathname: string
): Promise<WidgetProfile | null> {
	const allRules = await loadAllRules();
	const bestRule = findBestMatch(domain, pathname, allRules);

	if (!bestRule) return null;

	const profile = await loadProfile(bestRule.profileId);
	return profile;
}
