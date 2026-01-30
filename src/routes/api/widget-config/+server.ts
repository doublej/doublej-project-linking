import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findMatchingProfile } from '$lib/server/profiles/matcher.js';

export const GET: RequestHandler = async ({ url }) => {
	const domain = url.searchParams.get('domain');
	const pathname = url.searchParams.get('pathname');

	if (!domain || !pathname) {
		return json({ error: 'Missing domain or pathname' }, { status: 400 });
	}

	const profile = await findMatchingProfile(domain, pathname);

	return json(profile?.config ?? null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};
