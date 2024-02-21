import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/kit/vite'

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
      regions: ['lhr1'],
    }),
    csrf: {
      checkOrigin: process.env.PUBLIC_DEPLOYMENT_ENV !== 'local',
    },
  },
}
export default config
