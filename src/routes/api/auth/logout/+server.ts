import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('sessionToken', {
		path: '/'
	});
	return json({ status: 'Success' }, { status: 200 });
};
