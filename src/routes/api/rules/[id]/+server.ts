import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadRule, deleteRule, saveRule } from '$lib/server/profiles/storage.js';
import { calculateSpecificity } from '$lib/server/profiles/matcher.js';

export const GET: RequestHandler = async ({ params }) => {
	const rule = await loadRule(params.id);

	if (!rule) {
		return json({ error: 'Rule not found' }, { status: 404 });
	}

	return json(rule);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const existing = await loadRule(params.id);

	if (!existing) {
		return json({ error: 'Rule not found' }, { status: 404 });
	}

	const data = await request.json();

	const pathPattern = data.pathPattern ?? existing.pathPattern;
	const priority = calculateSpecificity(pathPattern);

	const updated = {
		...existing,
		profileId: data.profileId ?? existing.profileId,
		domain: data.domain ?? existing.domain,
		pathPattern,
		priority,
		enabled: data.enabled ?? existing.enabled
	};

	await saveRule(updated);
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const existing = await loadRule(params.id);

	if (!existing) {
		return json({ error: 'Rule not found' }, { status: 404 });
	}

	await deleteRule(params.id);
	return json({ success: true });
};
