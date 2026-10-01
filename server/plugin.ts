import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, PreviewServer, ViteDevServer } from "vite";
import { nodeToRequest, sendResponse, isPayloadTooLarge, applySecurityHeaders } from "./http";

async function loadHandler(server: ViteDevServer | PreviewServer) {
  if ("ssrLoadModule" in server) {
    return server.ssrLoadModule(path.resolve(process.cwd(), "server/api.ts"));
  }

  return import("./api");
}

async function handleNodeRequest(
  server: ViteDevServer | PreviewServer,
  req: IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
) {
  const url = req.url ?? "";

  if (!url.startsWith("/api/")) {
    next();
    return;
  }

  try {
    const { handleApiRequest } = await loadHandler(server);
    const request = await nodeToRequest(req);
    const response = await handleApiRequest(request);
    await sendResponse(res, response);
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
}

export function masrofyApiPlugin() {
  return {
    name: "masrofy-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        void handleNodeRequest(server, req, res, next);
      });
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use((req, res, next) => {
        void handleNodeRequest(server, req, res, next);
      });
    },
  };
}
