import { json, type RequestHandler } from '@sveltejs/kit';
import { date, type z } from 'zod';

import { bodySchemaValidation } from '$lib';
import { db } from '$lib/db';
import { CommentSchema } from '$lib/schemas';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!params.commentId) {
		return json({ status: 'Fail', message: 'Bad Request, Missing commentId!' }, { status: 400 });
	}

	if (!locals.decoded) {
		return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();

		if (!body) {
			return json({ status: 'Fail', message: 'Comment is required' }, { status: 400 });
		}
		const { errorMessages, validatedBody } = await bodySchemaValidation(body, CommentSchema);

		if (errorMessages) {
			return json({ status: 'Fail', message: errorMessages }, { status: 400 });
		}

		const { text } = validatedBody as z.infer<typeof CommentSchema>;

		const comment = await db.comments.findUnique({
			where: {
				id: params.commentId.trim()
			}
		});

		if (!comment) {
			return json({ status: 'Fail', message: 'Comment not found' }, { status: 404 });
		}

		if (comment.authorId !== locals.decoded.id) {
			return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
		}

		const updatedComment = await db.comments.update({
			where: {
				id: comment.id
			},
			data: {
				text
			}
		});

		return json({ status: 'Success', data: updatedComment }, { status: 200 });
	} catch {
		return json({ status: 'Fail', message: 'Something went wrong' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!params.commentId) {
		return json({ status: 'Fail', message: 'Bad Request, Missing commentId!' }, { status: 400 });
	}

	if (!locals.decoded) {
		return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const comment = await db.comments.findUnique({
			where: {
				id: params.commentId.trim()
			}
		});

		if (!comment) {
			return json({ status: 'Fail', message: 'Comment not found' }, { status: 404 });
		}

		if (comment.authorId !== locals.decoded.id) {
			return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
		}
		const deletedComment = await db.comments.delete({
			where: {
				id: comment.id
			}
		});

		return json({ status: 'Success', data: deletedComment }, { status: 200 });
	} catch {
		return json({ status: 'Fail', message: 'Something went wrong' }, { status: 500 });
	}
};
