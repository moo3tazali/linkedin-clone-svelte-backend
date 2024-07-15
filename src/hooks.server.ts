import { checkAuthHeaders, verifyAccessToken, verifyRefreshToken } from '$lib';
import { json, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const checkAuth: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api/auth/')) {
		const authHeader = event.request.headers.get('authorization');

		const { token, error } = await checkAuthHeaders(authHeader);

		if (error) {
			return json({ status: 'Fail', message: error }, { status: 401 });
		}

		if (!token) {
			return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
		}

		const decodedAccess = await verifyAccessToken(token);

		if (!decodedAccess) {
			return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
		}

		// Set locals
		event.locals.token = token;
		event.locals.decoded = decodedAccess;
	}
	return resolve(event);
};

const corsHandle: Handle = async ({ event, resolve }) => {
	// Apply CORS header for API routes
	if (event.url.pathname.startsWith('/api')) {
		// Required for CORS to work
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Origin': 'https://linkedin-clone-svelte-backend.vercel.app',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					'Access-Control-Allow-Credentials': 'true',
					'Access-Control-Max-Age': '86400' // Cache the preflight response for 24 hours
				},
				status: 204 // HTTP 204 No Content
			});
		}
	}

	const response = await resolve(event);
	if (event.url.pathname.startsWith('/api')) {
		response.headers.append(
			'Access-Control-Allow-Origin',
			`https://linkedin-clone-svelte-backend.vercel.app`
		);
		response.headers.append('Access-Control-Allow-Credentials', 'true');
	}
	return response;
};

export const handle: Handle = sequence(corsHandle, checkAuth);
