/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.output = config.output || {}
      config.output.chunkLoadTimeout = 300000
    }
    if (!dev) {
      config.optimization = config.optimization || {}
      config.optimization.minimize = false
    }
    return config
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
