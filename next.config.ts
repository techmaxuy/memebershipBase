import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Azure Blob Storage
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
      // Google OAuth avatars
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // GitHub OAuth avatars
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      // Microsoft OAuth avatars
      {
        protocol: 'https',
        hostname: 'graph.microsoft.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);