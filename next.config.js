/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/fact-saas',
  // Eliminamos swcMinify ya que no es necesario en las versiones recientes
  // Eliminamos appDir ya que no es una opción válida
}

module.exports = nextConfig 