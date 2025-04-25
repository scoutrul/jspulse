// vite.config.ts
import { sveltekit } from "file:///Users/tonsky/Desktop/projects/jspulse/node_modules/.pnpm/@sveltejs+kit@1.30.4_svelte@3.59.2_vite@5.4.18_@types+node@22.14.1_/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { defineConfig } from "file:///Users/tonsky/Desktop/projects/jspulse/node_modules/.pnpm/vite@5.4.18_@types+node@22.14.1/node_modules/vite/dist/node/index.js";
import path from "path";
var __vite_injected_original_dirname = "/Users/tonsky/Desktop/projects/jspulse/frontend";
var vite_config_default = defineConfig(() => {
  return {
    plugins: [sveltekit()],
    resolve: {
      alias: {
        "@jspulse/shared": path.resolve(__vite_injected_original_dirname, "../shared/types"),
      },
    },
    optimizeDeps: {
      include: ["@jspulse/shared"],
    },
    server: {
      host: "0.0.0.0",
      port: 3e3,
      fs: {
        strict: false,
        allow: [path.resolve(__vite_injected_original_dirname, "../shared")],
      },
    },
  };
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG9uc2t5L0Rlc2t0b3AvcHJvamVjdHMvanNwdWxzZS9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3RvbnNreS9EZXNrdG9wL3Byb2plY3RzL2pzcHVsc2UvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RvbnNreS9EZXNrdG9wL3Byb2plY3RzL2pzcHVsc2UvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCgpID0+IHtcbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbc3ZlbHRla2l0KCldLFxuXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgXCJAanNwdWxzZS9zaGFyZWRcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9zaGFyZWQvdHlwZXNcIiksXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFtcIkBqc3B1bHNlL3NoYXJlZFwiXSxcbiAgICB9LFxuXG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICBmczoge1xuICAgICAgICBzdHJpY3Q6IGZhbHNlLFxuICAgICAgICBhbGxvdzogW3BhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vc2hhcmVkXCIpXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVCxTQUFTLGlCQUFpQjtBQUN6VixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhLE1BQU07QUFDaEMsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUFBLElBRXJCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLG1CQUFtQixLQUFLLFFBQVEsa0NBQVcsaUJBQWlCO0FBQUEsTUFDOUQ7QUFBQSxJQUNGO0FBQUEsSUFFQSxjQUFjO0FBQUEsTUFDWixTQUFTLENBQUMsaUJBQWlCO0FBQUEsSUFDN0I7QUFBQSxJQUVBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLElBQUk7QUFBQSxRQUNGLFFBQVE7QUFBQSxRQUNSLE9BQU8sQ0FBQyxLQUFLLFFBQVEsa0NBQVcsV0FBVyxDQUFDO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
