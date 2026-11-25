import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Browser Activity',
    description: 'Discord Rich Presence for your browser activity',
    permissions: ['nativeMessaging', 'tabs'],
  },
});
