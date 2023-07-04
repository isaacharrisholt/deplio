import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: vitePreprocess(),

    vitePlugin: {
        inspector: true,
    },
    kit: {
        adapter: adapter({
            runtime: 'edge',
        }),
        csrf: {
            checkOrigin: process.env.VERCEL_ENV !== 'development',
        }
    },
};
export default config;
