import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadAllRules, loadRulesByProfile, saveRule } from '$lib/server/profiles/storage.js';
import { calculateSpecificity } from '$lib/server/profiles/matcher.js';
import type { MatchingRule } from '$lib/server/profiles/types.js';

export const GET: RequestHandler = async ({ url }) => {
	const profileId = url.searchParams.get('profileId');

	if (profileId) {
		const rules = await loadRulesByProfile(profileId);
		return json(rules);
	}

	const allRules = await loadAllRules();
	return json(allRules);
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	const priority = calculateSpecificity(data.pathPattern);

	const rule: MatchingRule = {
		id: data.id || crypto.randomUUID(),
		profileId: data.profileId,
		domain: data.domain,
		pathPattern: data.pathPattern,
		priority,
		enabled: data.enabled ?? true
	};

	await saveRule(rule);
	return json(rule, { status: 201 });
};
