/** @type {import('next').NextConfig} */
//const nextConfig = {};

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
  },
  async redirects() {
    return [
      { source: "/signup", destination: "/register", permanent: true },
    ];
  },
};

export default nextConfig;
