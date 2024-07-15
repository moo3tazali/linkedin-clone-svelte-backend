import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserAccountByToken } from '$lib/user';
import { bodySchemaValidation, uploadToCloudinary } from '$lib';
import { db } from '$lib/db';
import { AccountSchema } from '$lib/schemas';
import type { z } from 'zod';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.decoded) {
		return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const user = await getUserAccountByToken(locals.decoded.id);
		if (!user) {
			return json({ status: 'Fail', message: 'User not found' }, { status: 404 });
		}
		return json({ status: 'Success', data: user }, { status: 200 });
	} catch (error) {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.decoded) {
		return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		if (!body) {
			return json({ status: 'Fail', message: 'Bad Request' }, { status: 400 });
		}

		const { errorMessages, validatedBody } = await bodySchemaValidation(body, AccountSchema);
		if (errorMessages) {
			return json({ status: 'Fail', message: errorMessages }, { status: 400 });
		}

		const user = await getUserAccountByToken(locals.decoded.id);
		if (!user) {
			return json({ status: 'Fail', message: 'User not found' }, { status: 404 });
		}

		const { fullname, title } = validatedBody as z.infer<typeof AccountSchema>;

		const updatedUser = await db.account.update({
			where: { userId: locals.decoded.id },
			data: {
				fullname,
				title
			}
		});
		return json({ status: 'Success', data: updatedUser }, { status: 200 });
	} catch (error) {
		return json({ status: 'Fail', message: 'Internal server error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.decoded) {
		return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const mediaFiles: Array<File> = [];
		const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
		for (const [key, value] of formData.entries()) {
			if (value instanceof File) {
				if (value.type.startsWith('image') && value.size > MAX_IMAGE_SIZE) {
					return json(
						{ status: 'Fail', message: 'Image size should not exceed 5MB' },
						{ status: 400 }
					);
				}
				if (!value.type.startsWith('image')) {
					return json({ status: 'Fail', message: 'Only image files are allowed' }, { status: 400 });
				}
				mediaFiles.push(value);
			}
		}
		if (mediaFiles.length === 0) {
			return json({ status: 'Fail', message: 'No image files found' }, { status: 400 });
		}

		const images = mediaFiles.filter((file) => file.type.startsWith('image')).length;

		if (images > 1) {
			return json(
				{ status: 'Fail', message: 'You can upload up to 1 image only' },
				{ status: 400 }
			);
		}

		const imageUrl: string | undefined = await uploadToCloudinary(mediaFiles[0]);

		if (!imageUrl) {
			return json({ status: 'Fail', message: 'Failed to upload image' }, { status: 400 });
		}

		const formKeys: string[] = [];
		for (const [key, value] of formData.entries()) {
			formKeys.push(key);
		}

		if (formKeys.includes('image')) {
			const updatedUserImage = await db.account.update({
				where: {
					userId: locals.decoded.id
				},
				data: {
					image: imageUrl
				}
			});

			return json({ status: 'Success', data: updatedUserImage }, { status: 200 });
		} else if (formKeys.includes('cover')) {
			const updatedUserCover = await db.account.update({
				where: {
					userId: locals.decoded.id
				},
				data: {
					cover: imageUrl
				}
			});
			return json({ status: 'Success', data: updatedUserCover }, { status: 200 });
		} else {
			return json({ status: 'Fail', message: 'Invalid request' }, { status: 400 });
		}
	} catch (error) {
		return json({ status: 'Fail', message: 'Bad Request' }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.decoded) {
		return json({ status: 'Fail', message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();

		console.log(body);

		if (!body) {
			return json({ status: 'Fail', message: 'Invalid request' }, { status: 400 });
		}

		if (body.image) {
			const updatedUserImage = await db.account.update({
				where: {
					userId: locals.decoded.id
				},
				data: {
					image:
						'https://res.cloudinary.com/dlpkoketm/image/upload/v1721035472/linkedin-clone/avatar-default_xgonmt.jpg'
				}
			});

			return json({ status: 'Success', data: updatedUserImage }, { status: 200 });
		} else if (body.cover) {
			const updatedUserCover = await db.account.update({
				where: {
					userId: locals.decoded.id
				},
				data: {
					cover:
						'https://res.cloudinary.com/dlpkoketm/image/upload/v1721035472/linkedin-clone/defaultCover_jwmslu.png'
				}
			});
			return json({ status: 'Success', data: updatedUserCover }, { status: 200 });
		} else {
			return json({ status: 'Fail', message: 'Invalid request' }, { status: 400 });
		}
	} catch (error) {
		return json({ status: 'Fail', message: 'Bad Request' }, { status: 400 });
	}
};
