import type { MetadataRoute } from 'next';
import { SITE } from '@/config/site.config';
import { CATEGORIES } from '@/shared/data/categories.data';
import { PRODUCTS } from '@/shared/data/products.data';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    {
      url: `${SITE.url}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE.url}/bride`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE.url}/bride/custom`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${SITE.url}/shop/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = PRODUCTS.map((product) => ({
    url: `${SITE.url}/product/${product.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
