import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Shims process.env.API_KEY to allow existing code to work
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Shim process.env for other libraries that might access it
      'process.env': {}
    }
  };
});