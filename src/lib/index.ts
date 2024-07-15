import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
	JWT_ACCESS_SECRET,
	JWT_REFRESH_SECRET,
	DB_REFRESH_SECRET,
	CLOUDINARY_KEY,
	CLOUDINARY_SECRET,
	CLOUDINARY_NAME
} from '$env/static/private';
import { dev } from '$app/environment';
import type { Decoded } from './types';
import CryptoJS from 'crypto-js';
import { db } from '$lib/db';
import { v2 as cloudinary } from 'cloudinary';
import { PassThrough } from 'stream';

// Hash Password
export async function hashPassword(password: string) {
	// Number of salt rounds (cost factor)
	// This defines the computational complexity of the hashing algorithm.
	// In this case, 10 means 2^10 iterations.
	const saltRounds = 10;
	// Generate a hashed version of the password with the specified salt rounds
	const hashedPassword = await bcrypt.hash(password, saltRounds);
	return hashedPassword;
}

// Compare Password
export async function matchPassword(password: string, userPassword: string) {
	const passwordMatch = await bcrypt.compare(password, userPassword);
	return passwordMatch;
}

// Generate JWT Access Tokens
export async function generateAccessToken(userId: string) {
	// const existingAccessToken = await db.session.findUnique({
	// 	where: {
	// 		userId
	// 	}
	// });

	// if (existingAccessToken) {
	// 	await db.session.delete({
	// 		where: {
	// 			userId: existingAccessToken.userId
	// 		}
	// 	});
	// }
	const token = jwt.sign({ id: userId }, JWT_ACCESS_SECRET, {
		expiresIn: '1h'
	});

	// const encrypted = CryptoJS.AES.encrypt(token, DB_REFRESH_SECRET).toString();

	// await db.session.create({
	// 	data: {
	// 		userId,
	// 		accessToken: encrypted,
	// 		expires: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
	// 	}
	// });
	return token;
}

// Generate JWT Refresh Tokens
export async function generateRefreshToken(userId: string) {
	const token = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
		expiresIn: '30d'
	});

	return token;
}

// Verify JWT Access Tokens
export async function verifyAccessToken(token: string) {
	try {
		const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as Decoded;

		// const existingAccessToken = await db.session.findUnique({
		// 	where: {
		// 		userId: decoded.id
		// 	}
		// });

		// if (!existingAccessToken) {
		// 	return null;
		// }

		// const decrypted = CryptoJS.AES.decrypt(
		// 	existingAccessToken.accessToken,
		// 	DB_REFRESH_SECRET
		// ).toString(CryptoJS.enc.Utf8);

		// console.log({ decrypted });
		// console.log(token === decrypted);
		// if (token !== decrypted) {
		// 	return null;
		// }

		return decoded;
	} catch {
		return null;
	}
}

// Verify JWT Refresh Tokens
export async function verifyRefreshToken(token: string) {
	try {
		const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as Decoded;
		return decoded;
	} catch {
		return null;
	}
}

// Set Refresh Token Cookie
export async function setRefreshTokenCookie(cookies: any, refreshToken: string) {
	cookies.set('sessionToken', refreshToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: 60 * 60 * 24 * 7 // 7 days
	});
}

// Body Schema Validation
export async function bodySchemaValidation(body: any, Schema: any) {
	const validatedFields = Schema.safeParse(body);
	if (!validatedFields.success) {
		const errorMessages = validatedFields.error.issues
			.map((issue: any) => issue.message)
			.join(', ');
		return { errorMessages };
	}

	return { validatedBody: validatedFields.data };
}

// Check Auth Headers
export async function checkAuthHeaders(authHeader: string | null) {
	if (!authHeader) {
		return {
			error: 'No authorization header provided'
		};
	}

	if (!authHeader.startsWith('Bearer ')) {
		return { error: 'Invalid authorization header format' };
	}

	const token = authHeader.split(' ')[1];

	return { token };
}

cloudinary.config({
	cloud_name: CLOUDINARY_NAME,
	api_key: CLOUDINARY_KEY,
	api_secret: CLOUDINARY_SECRET
});

export const uploadToCloudinary = async (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ folder: 'linkedin-clone' },
			(error, result) => {
				if (error) reject(error);
				else resolve(result?.secure_url || '');
			}
		);

		const bufferStream = new PassThrough();
		file.arrayBuffer().then((data) => bufferStream.end(Buffer.from(data)));
		bufferStream.pipe(stream);
	});
};
