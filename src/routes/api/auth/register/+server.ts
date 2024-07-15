import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { z } from 'zod';

import { db } from '$lib/db';
import { RegisterSchema } from '$lib/schemas';
import { getUserByEmail, getUserByUsername } from '$lib/user';
import {
	bodySchemaValidation,
	generateAccessToken,
	generateRefreshToken,
	hashPassword,
	setRefreshTokenCookie
} from '$lib';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	if (!body)
		return json(
			{ status: 'Fail', message: 'username, email, and password are required' },
			{ status: 400 }
		);
	if (!body?.username)
		return json({ status: 'Fail', message: 'username is required' }, { status: 400 });
	if (!body?.email) return json({ status: 'Fail', message: 'email is required' }, { status: 400 });
	if (!body?.password)
		return json({ status: 'Fail', message: 'password is required' }, { status: 400 });

	const { validatedBody, errorMessages } = await bodySchemaValidation(body, RegisterSchema);

	if (errorMessages) return json({ status: 'Fail', message: errorMessages }, { status: 400 });

	const { username, email, password } = validatedBody as z.infer<typeof RegisterSchema>;

	const existingUsername = await getUserByUsername(username);
	if (existingUsername)
		return json({ status: 'Fail', message: 'Username already exists' }, { status: 400 });

	const existingEmail = await getUserByEmail(email);
	if (existingEmail)
		return json({ status: 'Fail', message: 'Email already exists' }, { status: 400 });

	const hashedPassword = await hashPassword(password);

	try {
		const newUser = await db.user.create({
			data: {
				username,
				email,
				password: hashedPassword
			}
		});

		await db.account.create({
			data: {
				userId: newUser.id
			}
		});

		const accessToken = await generateAccessToken(newUser.id);
		const refreshToken = await generateRefreshToken(newUser.id);
		await setRefreshTokenCookie(cookies, refreshToken);

		return json({ status: 'Success', accessToken }, { status: 201 });
	} catch {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};
