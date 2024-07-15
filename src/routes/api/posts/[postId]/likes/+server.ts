import { db } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		if (!params.postId) {
			return json({ status: 'Fail', message: 'Bad Request, Missing postId!' }, { status: 400 });
		}

		if (!locals.decoded?.id) {
			return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
		}

		const post = await db.post.findUnique({
			where: {
				id: params.postId.trim()
			}
		});

		if (!post) {
			return json({ status: 'Fail', message: 'Post not found' }, { status: 404 });
		}

		const existingLike = await db.likes.findFirst({
			where: {
				postId: params.postId.trim(),
				authorId: locals.decoded?.id
			}
		});

		if (existingLike) {
			await db.likes.delete({
				where: {
					id: existingLike.id
				}
			});

			return json({ status: 'Success', message: 'Unliked' }, { status: 200 });
		} else {
			await db.likes.create({
				data: {
					postId: params.postId.trim(),
					authorId: locals.decoded?.id
				}
			});
			return json({ status: 'Success', message: 'Liked' }, { status: 200 });
		}
	} catch {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ params, url }) => {
	if (!params.postId) {
		return json({ status: 'Fail', message: 'Bad Request, Missing postId!' }, { status: 400 });
	}
	try {
		const post = await db.post.findUnique({
			where: {
				id: params.postId.trim()
			}
		});
		if (!post) {
			return json({ status: 'Fail', message: 'Post not found' }, { status: 404 });
		}

		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const skip = (page - 1) * limit;
		const likes = await db.likes.findMany({
			skip,
			take: limit,
			where: {
				postId: params.postId.trim()
			},
			orderBy: { createdAt: 'desc' },
			include: {
				author: {
					select: {
						fullname: true,
						title: true,
						image: true,
						user: {
							select: {
								username: true
							}
						}
					}
				}
			}
		});
		const count = await db.likes.count();
		const totalPages = Math.ceil(count / limit);

		return json(
			{ status: 'Success', data: likes, page, limit, totalPages, count },
			{ status: 200 }
		);
	} catch {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};
