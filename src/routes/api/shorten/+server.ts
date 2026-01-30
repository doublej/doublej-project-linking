import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SHORTIO_API_KEY, SHORTIO_DOMAIN } from '$env/static/private';

interface ShortenRequest {
	originalURL: string;
	slug?: string;
}

interface ShortioResponse {
	shortURL: string;
	idString: string;
	path: string;
	originalURL: string;
}

export const POST: RequestHandler = async ({ request }) => {
	if (!SHORTIO_API_KEY || !SHORTIO_DOMAIN) {
		throw error(500, 'Short.io API not configured. Please set SHORTIO_API_KEY and SHORTIO_DOMAIN in .env');
	}

	const body: ShortenRequest = await request.json();
	const { originalURL, slug } = body;

	if (!originalURL) {
		throw error(400, 'originalURL is required');
	}

	try {
		const response = await fetch('https://api.short.io/links', {
			method: 'POST',
			headers: {
				'authorization': SHORTIO_API_KEY,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				originalURL,
				domain: SHORTIO_DOMAIN,
				...(slug && { path: slug })
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw error(response.status, errorData.error || 'Failed to create short link');
		}

		const data: ShortioResponse = await response.json();

		return json({
			shortURL: data.shortURL,
			slug: data.path,
			originalURL: data.originalURL
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to communicate with Short.io API');
	}
};
