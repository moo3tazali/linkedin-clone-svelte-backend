import { db } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bodySchemaValidation } from '$lib';
import { CommentSchema } from '$lib/schemas';
import type { z } from 'zod';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const body = await request.json();

	if (!params.postId) {
		return json({ status: 'Fail', message: 'Bad Request, Missing postId!' }, { status: 400 });
	}

	if (!body) {
		return json({ status: 'Fail', message: 'Comment is required' }, { status: 400 });
	}

	if (!locals.decoded) {
		return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
	}

	const { errorMessages, validatedBody } = await bodySchemaValidation(body, CommentSchema);

	if (errorMessages) {
		return json({ status: 'Fail', message: errorMessages }, { status: 400 });
	}

	const { text } = validatedBody as z.infer<typeof CommentSchema>;

	try {
		const post = await db.post.findUnique({
			where: {
				id: params.postId
			}
		});
		if (!post) {
			return json({ status: 'Fail', message: 'Post not found' }, { status: 404 });
		}

		const comment = await db.comments.create({
			data: {
				text,
				postId: post.id,
				authorId: locals.decoded.id
			}
		});

		return json({ status: 'Success', data: comment }, { status: 201 });
	} catch {
		return json({ status: 'Fail', message: 'Something went wrong' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ params, url }) => {
	if (!params.postId) {
		return json({ status: 'Fail', message: 'Bad Request, Missing postId!' }, { status: 400 });
	}

	try {
		const post = await db.post.findUnique({
			where: {
				id: params.postId
			}
		});
		if (!post) {
			return json({ status: 'Fail', message: 'Post not found' }, { status: 404 });
		}

		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const skip = (page - 1) * limit;
		const comments = await db.comments.findMany({
			skip,
			take: limit,
			where: {
				postId: post.id
			},
			orderBy: {
				createdAt: 'desc'
			},
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
		const count = await db.comments.count();
		const totalPages = Math.ceil(count / limit);

		return json(
			{ status: 'Success', data: comments, page, limit, totalPages, count },
			{ status: 200 }
		);
	} catch {
		return json({ status: 'Fail', message: 'Something went wrong' }, { status: 500 });
	}
};
