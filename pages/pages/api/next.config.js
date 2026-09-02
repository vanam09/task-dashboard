/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This ensures API routes are not statically generated
  output: 'standalone',
};

module.exports = nextConfig;
