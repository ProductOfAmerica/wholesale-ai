/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript configuration
  typescript: {
    // Type checking will be done separately via npm run typecheck
    ignoreBuildErrors: false
  },

  // Custom server configuration
  // Note: Some optimizations are disabled when using custom server
  poweredByHeader: false,
  
  // Webpack configuration for custom server
  webpack: (config, { buildId, dev, isServer, defaultLoaders }) => {
    // Custom webpack configurations if needed
    return config;
  }
};

export default nextConfig;