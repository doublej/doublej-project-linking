import type { WidgetProfile } from './types.js';
import { loadAllRules, loadProfile } from './storage.js';

// Re-export pure matching functions from shared module
export { calculateSpecificity, matchPath, findBestMatch } from '../../shared/matcher.js';

/**
 * Find the matching profile for a domain and pathname.
 * Returns the profile config if a match is found, otherwise null.
 */
export async function findMatchingProfile(
	domain: string,
	pathname: string
): Promise<WidgetProfile | null> {
	const { findBestMatch } = await import('../../shared/matcher.js');
	const allRules = await loadAllRules();
	const bestRule = findBestMatch(domain, pathname, allRules);

	if (!bestRule) return null;

	const profile = await loadProfile(bestRule.profileId);
	return profile;
}
