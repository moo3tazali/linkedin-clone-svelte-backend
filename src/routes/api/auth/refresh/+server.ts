// src/routes/api/auth/refresh.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyRefreshToken, generateAccessToken } from '$lib';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const refreshToken = cookies.get('sessionToken');
		if (!refreshToken) {
			return json(
				{ status: 'Fail', message: 'No refresh token provided, Please login' },
				{ status: 401 }
			);
		}

		const decoded = await verifyRefreshToken(refreshToken);
		if (!decoded) {
			return json({ message: 'Invalid refresh token' }, { status: 403 });
		}

		const newAccessToken = await generateAccessToken(decoded.id);

		return json({ status: 'Success', accessToken: newAccessToken }, { status: 200 });
	} catch (error) {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};
