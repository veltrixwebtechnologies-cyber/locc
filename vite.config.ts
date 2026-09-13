// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      headers: {
        "content-security-policy":
          "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://*.razorpay.com https:; frame-src 'self' https://www.google.com https://maps.google.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com;",
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes("node_modules/leaflet") ||
              id.includes("node_modules/react-leaflet") ||
              id.includes("node_modules/maplibre-gl")
            ) {
              return "maps-vendor";
            }
            if (id.includes("node_modules/lottie-react")) {
              return "lottie-vendor";
            }
            if (id.includes("node_modules/recharts")) {
              return "charts-vendor";
            }
            if (id.includes("node_modules/framer-motion") || id.includes("node_modules/motion")) {
              return "motion-vendor";
            }
            if (id.includes("node_modules/@radix-ui")) {
              return "radix-vendor";
            }
            return undefined;
          },
        },
      },
    },
  },
  nitro: {
    preset: "vercel",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
