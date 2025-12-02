import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval for dev
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' http://localhost:4000 http://YOUR_SERVER_IP:4000", // API endpoints
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // HTTPS Strict Transport Security (HSTS)
          // ⚠️ Only enable in production with HTTPS
          // Uncomment when deploying with SSL:
          // {
          //   key: 'Strict-Transport-Security',
          //   value: 'max-age=31536000; includeSubDomains; preload',
          // },
        ],
      },
    ];
  },
};

export default nextConfig;
