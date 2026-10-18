import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Relojito',
    short_name: 'Relojito',
    description: 'Minimalist time tracking app',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#3e4c67',
    theme_color: '#3e4c67',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
