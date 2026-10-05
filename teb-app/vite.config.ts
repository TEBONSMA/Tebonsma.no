import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Absolute, so assets still resolve on nested routes like /auth/callback
  base: '/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          //split node_modules into vendor chunks
          if (id.includes('node_modules')) {
            // The mail editor is only needed on /mail, and its paths contain 'react', so it is picked out first
            if (id.includes('@tiptap') || id.includes('prosemirror') || id.includes('/orderedmap') || id.includes('/rope-sequence')) {
              return 'editor_vendor'
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react_vendor'
            }
            if (id.includes('framer-motion')) {
              return 'framer_vendor'
            }
            if (id.includes('@tailwindcss')) {
              return 'tailwind_vendor'
            }
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
