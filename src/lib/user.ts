import { db } from '$lib/db';

export async function getUserByEmail(email: string) {
	try {
		const user = await db.user.findUnique({
			where: { email }
		});
		return user;
	} catch {
		return null;
	}
}

export async function getUserByUsername(username: string) {
	try {
		const user = await db.user.findUnique({
			where: { username }
		});
		return user;
	} catch {
		return null;
	}
}

export async function getUserById(id: string) {
	try {
		const user = await db.user.findUnique({
			where: { id }
		});
		return user;
	} catch {
		return null;
	}
}

export async function getUserAccountByUsername(username: string, currentUserId?: string) {
	try {
		const user = await getUserByUsername(username);

		if (!user) {
			return null;
		}

		const userAccount = await db.account.findUnique({
			where: { userId: user.id },
			include: {
				user: {
					select: {
						username: true,
						email: true
					}
				}
			}
		});

		if (!userAccount) {
			return null;
		}

		const formattedUser = {
			userId: userAccount.userId,
			title: userAccount.title,
			fullname: userAccount.fullname,
			image: userAccount.image,
			cover: userAccount.cover,
			username: userAccount.user.username,
			email: userAccount.user.email,
			isMyAccount: userAccount.userId === currentUserId
		};

		return formattedUser;
	} catch {
		return null;
	}
}

export async function getUserAccountByToken(token: string) {
	try {
		const user = await db.account.findUnique({
			where: { userId: token },
			include: {
				user: {
					select: {
						username: true,
						email: true
					}
				}
			}
		});

		if (!user) {
			return null;
		}

		const formattedUser = {
			userId: user.userId,
			username: user.user.username,
			email: user.user.email,
			fullname: user.fullname,
			title: user.title,
			image: user.image,
			cover: user.cover
		};

		return formattedUser;
	} catch {
		return null;
	}
}
