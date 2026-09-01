import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Native fs change events don't reliably cross a Windows-host ->
      // Linux-container bind mount (the docker-compose `frontend` service).
      // Without polling, edits on the host never trigger a rebuild inside
      // the container -- the dev server silently keeps serving whatever was
      // there when it started, until someone manually restarts it.
      usePolling: true,
      interval: 300,
    },
  },
})
