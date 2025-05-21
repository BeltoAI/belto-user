/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Development configurations
    if (dev) {
      // Enhanced development settings for faster refresh
      config.watchOptions = {
        ignored: /node_modules/,
        aggregateTimeout: 50, // Reduced for faster updates
        poll: 300, // Reduced polling time
      };
      
      // Disable caching in development
      config.cache = false;
      
      // Optimize for development
      config.optimization = {
        ...config.optimization,
        minimize: false, // Disable minimization in development
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          automaticNameDelimiter: '~',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                // Get the package name
                const packageName = module.context?.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                
                if (!packageName) return 'vendor';

                // Return vendor.[packageName] chunk name
                return `vendor.${packageName.replace('@', '')}`;
              },
              priority: -10,
              reuseExistingChunk: true,
            },
            common: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
              enforce: true
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 40,
            },
            documents: {
              test: /[\\/]node_modules[\\/](mammoth|pdf-lib|pdfjs-dist)[\\/]/,
              name: 'document-processors',
              chunks: 'async',
              priority: 30,
            }
          }
        },
        runtimeChunk: {
          name: 'runtime',
        },
      };
    }

    // Replace dynamic imports in pdf.js with static imports
    config.module.rules.push({
      test: /pdf\.js$/,
      type: "javascript/auto",
    });

    // Ignore the pdfjs worker builds
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.entry': false,
    };

    // Add resolve fallbacks for node modules that PDF.js might be looking for
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      canvas: false,
    };

    return config;
  },

  // Experimental features
  experimental: {
    optimizeCss: false, // Disabled for faster development
    scrollRestoration: true,
    largePageDataBytes: 128 * 1000, // Reduced for faster development
    optimizePackageImports: [
      '@headlessui/react',
      '@heroicons/react',
      'lucide-react',
    ],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 0,
    formats: ['image/webp'],
  },

  // Development-specific settings
  compress: false, // Disabled in development for faster builds
  reactStrictMode: true,
  
  // Increase build output details
  logging: {
    level: 'verbose'
  },

  poweredByHeader: false,

  // Disable caching in development
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Last-Modified',
            value: new Date().toUTCString(),
          }
        ],
      },
    ];
  },

  transpilePackages: ['pdfjs-dist'],
};

export default nextConfig;