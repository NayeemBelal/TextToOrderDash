import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://belan.tech',
      lastModified: new Date('2026-05-12'),
    },
    {
      url: 'https://belan.tech/about',
      lastModified: new Date('2026-05-12'),
    },
    {
      url: 'https://belan.tech/privacy-policy',
      lastModified: new Date('2026-05-12'),
    },
    {
      url: 'https://belan.tech/terms-of-service',
      lastModified: new Date('2026-05-12'),
    },
  ]
}
