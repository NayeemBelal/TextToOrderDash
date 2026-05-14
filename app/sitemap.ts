import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://belan.tech',
      lastModified: new Date('2026-05-14'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://belan.tech/how-it-works',
      lastModified: new Date('2026-05-14'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://belan.tech/integrations',
      lastModified: new Date('2026-05-14'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: 'https://belan.tech/integrations/clover',
      lastModified: new Date('2026-05-14'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://belan.tech/integrations/toast',
      lastModified: new Date('2026-05-14'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://belan.tech/integrations/square',
      lastModified: new Date('2026-05-14'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://belan.tech/about',
      lastModified: new Date('2026-05-14'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://belan.tech/privacy-policy',
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: 'https://belan.tech/terms-of-service',
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
