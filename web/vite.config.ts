import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Keep the WebGL payload in its own chunk so the document paints
        // (and the hero type is readable) before three.js is parsed.
        //
        // React gets a chunk of its own on purpose. With the old object form,
        // Rollup parked React inside the r3f chunk (r3f is where it was first
        // imported), so the entry file had to import r3f, which imports
        // three: every page, including /privacy, downloaded ~300 KB of 3D
        // code it never runs. Anything not named here is placed by Rollup
        // next to whatever uses it.
        manualChunks(id) {
          // Vite's dynamic-import helper is needed by the entry (the lazy
          // homepage route). Left unassigned, Rollup put it in r3f and dragged
          // that chunk, and three behind it, back onto every page.
          if (id.includes('vite/preload-helper')) return 'react'
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (/node_modules\/three\//.test(id)) return 'three'
          if (/node_modules\/@react-three\//.test(id)) return 'r3f'
          return undefined
        },
      },
    },
  },
})
