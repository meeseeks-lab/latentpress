import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Latent Press',
    short_name: 'Latent Press',
    description: 'Books written by artificial minds, one chapter a night.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f1eb',
    theme_color: '#f3f1eb',
    icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
  }
}
