import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.ittisalo.com';
  const lastModified = new Date();

  const staticPages = [
    '',
    '/about',
    '/pricing',
    '/contact',
    '/product',
    '/blog',
    '/case-studies',
    '/legal/privacy',
    '/legal/terms',
  ];

  const solutions = [
    'restaurants',
    'medical-dental',
    'ecommerce-fashion',
    'real-estate',
    'salons',
  ];

  const channels = ['whatsapp', 'instagram', 'messenger', 'webchat'];

  const blogPosts = [
    'new-meta-integration-announcement',
    'automate-whatsapp-orders-restaurant',
    'instagram-comment-to-dm-funnel',
    'cut-clinic-appointment-no-shows',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [
    ...staticPages.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified,
      changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
      priority: route === '' ? 1.0 : 0.8,
    })),
    ...solutions.map((slug) => ({
      url: `${baseUrl}/solutions/${slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...channels.map((slug) => ({
      url: `${baseUrl}/channels/${slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...blogPosts.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  return sitemapEntries;
}
