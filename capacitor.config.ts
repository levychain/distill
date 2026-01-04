import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.distill.app',
  appName: 'Distill',
  webDir: 'out',
  server: {
    // Load your production Railway URL directly
    // This means updates to Railway are instantly reflected in the app
    url: 'https://distill-production-d086.up.railway.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f1115', // Match your dark theme
  },
};

export default config;
