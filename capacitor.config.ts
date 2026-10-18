import type { CapacitorConfig } from '@capacitor/cli'

// The app is a native shell that loads the deployed site, so web changes
// show up without rebuilding. `webDir` only holds a placeholder page that
// Capacitor requires to exist.
const config: CapacitorConfig = {
  appId: 'dev.simetron.relojito',
  appName: 'Relojito',
  webDir: 'cap-web',
  server: {
    url: 'https://relojito-lovat.vercel.app',
    cleartext: false,
  },
  ios: {
    backgroundColor: '#3e4c67',
    contentInset: 'never',
  },
}

export default config
