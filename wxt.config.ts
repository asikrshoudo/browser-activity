import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser }) => ({
    name: 'Browser Activity',
    description: 'Discord Rich Presence for your browser activity',
    permissions: ['nativeMessaging', 'tabs'],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: { id: 'browser-activity@asikrshoudo' },
      },
    }),
  }),
});
