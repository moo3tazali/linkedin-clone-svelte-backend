import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const skip = (page - 1) * limit;
		const accounts = await db.account.findMany({
			skip,
			take: limit,
			include: {
				user: {
					select: {
						username: true,
						email: true
					}
				}
			}
		});

		if (!accounts) {
			return json({ status: 'Fail', message: 'No Users found' }, { status: 404 });
		}

		const totalAccounts = await db.account.count();
		const totalPages = Math.ceil(totalAccounts / limit);
		const formattedAccounts = accounts.map((account) => ({
			userId: account.userId,
			title: account.title,
			fullname: account.fullname,
			image: account.image,
			username: account.user.username,
			email: account.user.email
		}));

		return json(
			{ status: 'Success', data: formattedAccounts, page, limit, totalPages },
			{ status: 200 }
		);
	} catch {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};
