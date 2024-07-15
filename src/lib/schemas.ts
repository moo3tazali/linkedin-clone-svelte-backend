import z from 'zod';

export const RegisterSchema = z.object({
	username: z
		.string()
		.trim()
		.regex(/^[a-zA-Z0-9]+$/, { message: 'username cannot contain spaces or special characters' })
		.min(3, { message: 'username must contain at least 3 character(s)' }),
	email: z
		.string()
		.trim()
		.min(1, { message: 'Email is required' })
		.email({ message: 'Invalid Email' }),
	password: z.string().min(6, { message: 'Password must contain at least 6 character(s)' })
});

export const LoginSchema = z.object({
	email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid Email' }),
	password: z.string().min(1, { message: 'Password is required' })
});

const MediaSchema = z.union([
	z.object({
		type: z.literal('image'),
		url: z.string().url()
	}),
	z.object({
		type: z.literal('video'),
		url: z.string().url()
	})
]);

export const PostSchema = z
	.object({
		text: z.string().trim().optional(),
		media: z.array(MediaSchema).max(4).optional()
	})
	.refine((data) => data.text || data.media, {
		message: 'text or media is required'
	})
	.refine(
		(data) => {
			if (data.media) {
				const images = data.media.filter((m) => m.type === 'image').length;
				const videos = data.media.filter((m) => m.type === 'video').length;
				return (images <= 4 && videos === 0) || (videos === 1 && images === 0);
			}
			return true;
		},
		{
			message: 'You can upload up to 4 images or 1 video only'
		}
	);

export const CommentSchema = z.object({
	text: z.string().trim().min(1, { message: 'Comment is required' })
});

export const AccountSchema = z
	.object({
		fullname: z.string().trim().optional(),
		title: z.string().trim().optional()
	})
	.refine((data) => data.fullname || data.title, {
		message: 'At least one field is required'
	});
