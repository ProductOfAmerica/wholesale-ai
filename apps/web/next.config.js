/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wholesale-ai/shared'],
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

module.exports = nextConfig;
