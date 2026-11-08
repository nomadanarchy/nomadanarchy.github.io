import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";
import { renderSite } from "./site";

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/** URL path -> candidate output files, in the order GitHub Pages would try them. */
function candidates(url: string): string[] {
  const path = decodeURIComponent(url.split("?")[0] ?? "/");
  if (path === "/") return ["index.html"];
  const bare = path.replace(/^\//, "");
  return bare.endsWith("/") ? [`${bare}index.html`] : [bare, `${bare}.html`, `${bare}/index.html`];
}

/**
 * Renders every page, redirect and SEO file from src/data and src/lang.
 * Build: emitted as assets next to the hashed JS and CSS.
 * Dev: rendered per request, so editing a JSON file and refreshing is enough.
 */
export function nomadSite(): Plugin {
  return {
    name: "nomad-site",

    // Runs after Vite's own plugins, so the extracted CSS file already exists.
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const output = Object.values(bundle);
        const entry = output.find((o) => o.type === "chunk" && o.isEntry);
        if (!entry) throw new Error("nomad-site: no entry chunk found");
        const css = output.filter((o) => o.fileName.endsWith(".css")).map((o) => `/${o.fileName}`);

        const { files, warnings } = renderSite({ assets: { js: `/${entry.fileName}`, css } });
        for (const w of warnings) this.warn(w);
        for (const [fileName, source] of Object.entries(files)) this.emitFile({ type: "asset", fileName, source });
      },
    },

    configureServer(server: ViteDevServer) {
      const reload = (file: string) => {
        if (/[\\/]src[\\/](data|lang)[\\/]/.test(file)) server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("change", reload);

      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        void (async () => {
          try {
            const { files, warnings } = renderSite({ assets: { dev: true, css: [] } });
            for (const w of warnings) server.config.logger.warn(`[nomad-site] ${w}`);
            const file = candidates(req.url ?? "/").find((f) => f in files);
            if (!file) return next();
            let body = files[file] as string;
            const ext = file.slice(file.lastIndexOf("."));
            if (ext === ".html") body = await server.transformIndexHtml(req.url ?? "/", body);
            res.setHeader("Content-Type", types[ext] ?? "text/plain; charset=utf-8");
            res.end(body);
          } catch (err) {
            next(err);
          }
        })();
      });
    },
  };
}
