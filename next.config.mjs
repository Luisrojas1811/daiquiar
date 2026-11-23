/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // La dirección vieja (daiquiar.vercel.app) lleva siempre al dominio propio, a la misma página.
  // Las vistas previas de Vercel (otras direcciones) no se ven afectadas.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'daiquiar.vercel.app' }],
        destination: 'https://daiquiar.com.ar/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
