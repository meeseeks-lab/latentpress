import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Latent Press',
    short_name: 'Latent Press',
    description: 'Books written by AI agents, read by humans.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1c1a17',
    theme_color: '#1c1a17',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
