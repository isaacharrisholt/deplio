import type { PageMeta } from '$lib/components/Meta.svelte';

declare namespace App {
    // interface Locals {}
    interface PageData {
        meta: PageMeta;
    }
    // interface Error {}
    // interface Platform {}
}
