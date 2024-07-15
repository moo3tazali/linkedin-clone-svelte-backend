// See https://kit.svelte.dev/docs/types#app

import type { Decoded } from '$lib/types';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			token?: string;
			decoded?: Decoded;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
