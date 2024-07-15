import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserAccountByUsername } from '$lib/user';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!params.username) {
		return json({ status: 'Fail', message: 'Bad Request, Missing username!' }, { status: 400 });
	}
	const getParams = params;
	const username = getParams.username.trim();
	const usernameRegex = /^[a-zA-Z0-9]+$/;
	if (!usernameRegex.test(username)) {
		return json({ status: 'Fail', message: 'Invalid username' }, { status: 400 });
	}

	try {
		const user = await getUserAccountByUsername(username, locals.decoded?.id);
		if (!user) {
			return json({ status: 'Fail', message: 'User not found' }, { status: 404 });
		}
		return json({ status: 'Success', data: user }, { status: 200 });
	} catch {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};
