import { db } from '$lib/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bodySchemaValidation, uploadToCloudinary } from '$lib';
import { PostSchema } from '$lib/schemas';
import type { z } from 'zod';

export const GET: RequestHandler = async ({ params }) => {
	if (!params.postId) {
		return json({ status: 'Fail', message: 'Bad Request, Missing postId!' }, { status: 400 });
	}
	try {
		const post = await db.post.findUnique({
			where: {
				id: params.postId.trim()
			},
			include: {
				media: true,
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

		if (!post) {
			return json({ status: 'Fail', message: 'Post not found' }, { status: 404 });
		}

		return json({ status: 'Success', data: post }, { status: 200 });
	} catch {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
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

		if (post.authorId !== locals.decoded?.id) {
			return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
		}

		const deletedPost = await db.post.delete({
			where: {
				id: params.postId.trim()
			}
		});

		return json({ status: 'Success', data: deletedPost }, { status: 200 });
	} catch {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
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

		if (post.authorId !== locals.decoded?.id) {
			return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
		}
	} catch {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}

	const fields: Record<string, string> = {};
	const mediaFiles: Array<File> = [];

	try {
		const formData = await request.formData();

		const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
		const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
		for (const [key, value] of formData.entries()) {
			if (value instanceof File) {
				if (value.type.startsWith('image') && value.size > MAX_IMAGE_SIZE) {
					return json(
						{ status: 'Fail', message: 'Image size should not exceed 5MB' },
						{ status: 400 }
					);
				}
				if (value.type.startsWith('video') && value.size > MAX_VIDEO_SIZE) {
					return json(
						{ status: 'Fail', message: 'Video size should not exceed 50MB' },
						{ status: 400 }
					);
				}
				mediaFiles.push(value);
			} else if (key === 'text') {
				fields[key] = value.toString();
			}
		}
	} catch {
		return json({ status: 'Fail', message: 'Invalid request' }, { status: 400 });
	}

	if (Object.keys(fields).length === 0 && mediaFiles.length === 0) {
		return json({ status: 'Fail', message: 'text or media is required' }, { status: 400 });
	}

	const images = mediaFiles.filter((file) => file.type.startsWith('image')).length;
	const videos = mediaFiles.filter((file) => file.type.startsWith('video')).length;

	if (images > 4 || videos > 1 || (images > 0 && videos > 0)) {
		return json(
			{ status: 'Fail', message: 'You can upload up to 4 images or 1 video only' },
			{ status: 400 }
		);
	}

	const media: Array<{ type: 'image' | 'video'; url: string }> = [];
	for (const file of mediaFiles) {
		const url = await uploadToCloudinary(file);
		const type = file.type.startsWith('image') ? 'image' : 'video';
		media.push({ type, url });
	}

	const body = {
		...fields,
		media
	};

	const { validatedBody, errorMessages } = await bodySchemaValidation(body, PostSchema);

	if (errorMessages) return json({ status: 'Fail', message: errorMessages }, { status: 400 });

	const { text, media: _media } = validatedBody as z.infer<typeof PostSchema>;

	try {
		if (_media && _media.length > 0) {
			const post = await db.post.update({
				where: {
					id: params.postId
				},
				data: {
					text: text,
					media: { deleteMany: {}, create: _media?.map((m) => ({ type: m.type, url: m.url })) },
					author: {
						connect: {
							userId: locals.decoded?.id
						}
					}
				},
				include: {
					media: true
				}
			});
			return json({ status: 'Success', post }, { status: 200 });
		} else {
			const post = await db.post.update({
				where: {
					id: params.postId
				},
				data: {
					text: text,
					author: {
						connect: {
							userId: locals.decoded?.id
						}
					}
				},
				include: {
					media: true
				}
			});
			return json({ status: 'Success', post }, { status: 200 });
		}
	} catch {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};
