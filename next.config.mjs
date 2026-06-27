/** @type {import('next').NextConfig} */
//const nextConfig = {};

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
  },
};

export default nextConfig;
