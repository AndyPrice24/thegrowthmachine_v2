/** @type {import('next').NextConfig} */
const nextConfig = {
  // The audience pages became the two homepage journeys (/b2b, /ecommerce).
  async redirects() {
    return [
      { source: '/b2b-saas-growth', destination: '/b2b', permanent: true },
      { source: '/ecommerce-growth', destination: '/ecommerce', permanent: true },
    ];
  },
};

export default nextConfig;
