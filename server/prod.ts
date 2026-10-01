import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "vite";
import { nodeToRequest, sendResponse, isPayloadTooLarge, applySecurityHeaders } from "./http";
import { resolveInsideRoot } from "./static-path";

const mode = "production";
const env = loadEnv(mode, process.cwd(), "");

for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

process.env.NODE_ENV = "production";

const distDir = path.resolve(process.cwd(), "dist");
const port = Number(process.env.PORT || 3000);

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function contentType(filePath: string) {
  return contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

async function serveStatic(urlPath: string) {
  const filePath = resolveInsideRoot(distDir, urlPath);

  if (!filePath) {
    return null;
  }

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      return null;
    }

    return { filePath, body: await readFile(filePath) };
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    const request = await nodeToRequest(req);
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const { handleApiRequest } = await import("./api");
      await sendResponse(res, await handleApiRequest(request));
      return;
    }

    const staticFile = await serveStatic(url.pathname === "/" ? "/index.html" : url.pathname);

    if (staticFile) {
      res.statusCode = 200;
      applySecurityHeaders(res);
      res.setHeader("Content-Type", contentType(staticFile.filePath));
      if (url.pathname === "/sw.js") {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
      res.end(staticFile.body);
      return;
    }

    const index = await serveStatic("/index.html");

    if (!index) {
      res.statusCode = 404;
      res.end("Build the app first with npm run build.");
      return;
    }

    res.statusCode = 200;
    applySecurityHeaders(res);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(index.body);
  } catch (error) {
    if (isPayloadTooLarge(error)) {
      res.statusCode = 413;
      applySecurityHeaders(res);
      res.end("Payload too large");
      return;
    }

    res.statusCode = 500;
    applySecurityHeaders(res);
    res.end("Server error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Masrofy server: http://localhost:${port}`);
});
