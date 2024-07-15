import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { z } from 'zod';

import {
	generateAccessToken,
	generateRefreshToken,
	setRefreshTokenCookie,
	bodySchemaValidation,
	matchPassword
} from '$lib';
import { LoginSchema } from '$lib/schemas';
import { getUserByEmail } from '$lib/user';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	if (!body)
		return json({ status: 'Fail', message: 'email and password are required' }, { status: 400 });
	if (!body?.email) return json({ status: 'Fail', message: 'email is required' }, { status: 400 });
	if (!body?.password)
		return json({ status: 'Fail', message: 'password is required' }, { status: 400 });

	const { validatedBody, errorMessages } = await bodySchemaValidation(body, LoginSchema);

	if (errorMessages) return json({ status: 'Fail', message: errorMessages }, { status: 400 });

	const { email, password } = validatedBody as z.infer<typeof LoginSchema>;

	const user = await getUserByEmail(email);
	if (!user || !user.password)
		return json({ status: 'Fail', message: 'Invalid email or password' }, { status: 400 });

	const passwordMatch = await matchPassword(password, user.password);
	if (!passwordMatch)
		return json({ status: 'Fail', message: 'Invalid email or password' }, { status: 400 });

	const accessToken = await generateAccessToken(user.id);
	const refreshToken = await generateRefreshToken(user.id);

	await setRefreshTokenCookie(cookies, refreshToken);

	return json({ status: 'Success', accessToken }, { status: 200 });
};
