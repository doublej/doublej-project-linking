import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Add CORS headers for widget-config endpoint
	if (event.url.pathname.startsWith('/api/widget-config')) {
		// Handle preflight requests
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type'
				}
			});
		}
	}

	const response = await resolve(event);

	// Add CORS headers to widget-config responses
	if (event.url.pathname.startsWith('/api/widget-config')) {
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	}

	return response;
};
