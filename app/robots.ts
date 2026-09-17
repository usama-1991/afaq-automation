import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/settings/',
        '/conversations/',
        '/contacts/',
        '/campaigns/',
        '/orders/',
        '/reports/',
        '/reviews/',
        '/team/',
        '/templates/',
        '/onboarding/',
        '/upgrade/',
        '/admin/',
        '/auth/',
      ],
    },
    sitemap: 'https://www.ittisalo.com/sitemap.xml',
  };
}
