import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
export async function setupVite(app: Express, server: Server) {
  // Dynamically import vite config only in development
  let viteConfig: any = {};
  try {
    const { default: config } = await import("../../vite.config");
    viteConfig = config || {};
  } catch (e) {
    // Config not available, use defaults
  }
  const serverOptions = {
    middlewareMode: true,
    host: "0.0.0.0",
    // The WebDev preview is served through an HTTPS reverse proxy that does
    // not expose the internal Vite HMR socket directly. Use the browser's
    // current hostname and secure WebSockets when the preview is HTTPS; do
    // not hard-code a temporary Manus preview hostname here.
    hmr: {
      protocol: "wss",
      clientPort: 443,
      overlay: false,
    },
    allowedHosts: true as const,
  };

  // The Manus runtime plugin is intended for a directly exposed Vite server.
  // This app runs Vite in middleware mode behind the Manus HTTPS preview proxy;
  // allowing the plugin to mark the page as host-dev makes the proxy inject
  // /@vite/client and connect to the unreachable internal HMR socket.
  const middlewarePlugins = Array.isArray(viteConfig.plugins)
    ? viteConfig.plugins.filter((plugin: { name?: string } | null) => plugin?.name !== "vite-plugin-manus-runtime")
    : undefined;

  // In production, viteConfig is empty. In development, Vite will auto-discover the config.
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    ...(middlewarePlugins ? { plugins: middlewarePlugins } : {}),
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      // The Manus preview host detects this marker and dynamically loads
      // /@vite/client even when Vite's own HMR option is disabled. That client
      // then attempts an unreachable localhost:5173 WebSocket through the
      // HTTPS reverse proxy. Keep the Manus runtime available, but explicitly
      // disable its host-dev behavior for this proxied middleware response.
      const hostSafePage = page.replace(
        /window\.__MANUS_HOST_DEV__\s*=\s*(?:true|1)\s*;?/gi,
        "window.__MANUS_HOST_DEV__ = false;"
      );
      res
        .status(200)
        .set({
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        })
        .end(hostSafePage);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // SPA routing: fall through to index.html for all non-file routes
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not found');
    }
  });
}
