import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // La landing vive en landing/ dentro del repo de Hermit: sin esto, Next toma el package-lock de la raíz
  // como workspace y avisa que la raíz puede no ser la correcta.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  images: {
    unoptimized: true
  }
}

export default nextConfig
