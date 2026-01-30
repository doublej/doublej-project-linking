import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadProfile, saveProfile, deleteProfile } from '$lib/server/profiles/storage.js';

export const GET: RequestHandler = async ({ params }) => {
	const profile = await loadProfile(params.id);

	if (!profile) {
		return json({ error: 'Profile not found' }, { status: 404 });
	}

	return json(profile);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const existing = await loadProfile(params.id);

	if (!existing) {
		return json({ error: 'Profile not found' }, { status: 404 });
	}

	const data = await request.json();

	const updated = {
		...existing,
		name: data.name ?? existing.name,
		config: data.config ?? existing.config,
		updatedAt: new Date().toISOString()
	};

	await saveProfile(updated);
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const existing = await loadProfile(params.id);

	if (!existing) {
		return json({ error: 'Profile not found' }, { status: 404 });
	}

	await deleteProfile(params.id);
	return json({ success: true });
};
