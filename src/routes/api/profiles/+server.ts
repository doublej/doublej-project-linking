import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadAllProfiles, saveProfile } from '$lib/server/profiles/storage.js';
import type { WidgetProfile } from '$lib/server/profiles/types.js';

export const GET: RequestHandler = async () => {
	const profiles = await loadAllProfiles();
	return json(profiles);
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	const profile: WidgetProfile = {
		id: data.id || crypto.randomUUID(),
		name: data.name,
		config: data.config,
		createdAt: data.createdAt || new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	await saveProfile(profile);
	return json(profile, { status: 201 });
};
