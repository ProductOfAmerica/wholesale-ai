const requiredEnvVars = ['NEXT_PUBLIC_SOCKET_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wholesale-ai/shared'],
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  cacheComponents: true,
};

module.exports = nextConfig;
