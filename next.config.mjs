/** @type {import('next').NextConfig} */
import { resolve } from 'node:path'

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

    // Alias explicite @/ -> racine du projet.
    //
    // Next.js transcrit les `paths` du tsconfig via le JsConfigPathsPlugin, qui
    // ne s'active que si `baseUrl` est résolu. Dans certains contextes de build
    // (ex. `typescript` présent seulement comme dépendance transitive), ce
    // `baseUrl` reste undefined et le plugin se désactive: les imports `@/…`
    // ne résolvent plus -> "Module not found: Can't resolve '@/…'".
    // Forcer l'alias enlève toute ambiguïté et garantit la résolution en prod.
    if (!config.resolve) {
      config.resolve = {}
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {}
    }
    config.resolve.alias['@'] = resolve(process.cwd())

    return config
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
