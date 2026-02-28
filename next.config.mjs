import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // strict checking enabled
  },
  images: {
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
