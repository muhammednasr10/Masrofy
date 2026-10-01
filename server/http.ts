import type { IncomingMessage, ServerResponse } from "node:http";

type NodeRequest = IncomingMessage & {
  body?: unknown;
};

const MAX_BODY_BYTES = 256 * 1024;

const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function applySecurityHeaders(res: ServerResponse) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    if (!res.hasHeader(key)) {
      res.setHeader(key, value);
    }
  }
}

export async function nodeToRequest(req: NodeRequest) {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);
  const method = req.method ?? "GET";
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
    } else {
      headers.set(key, value);
    }
  }

  const hasBody = method !== "GET" && method !== "HEAD";
  let body: BodyInit | undefined;

  if (hasBody) {
    const raw = await readBody(req);

    if (raw.byteLength > 0) {
      body = new Uint8Array(raw);
    } else if (req.body !== undefined && req.body !== null) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }
  }

  return new Request(url, { method, headers, body });
}

function readBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;

      if (size > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("payload_too_large"));
        return;
      }

      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export function isPayloadTooLarge(error: unknown) {
  return error instanceof Error && error.message === "payload_too_large";
}

export async function sendResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  applySecurityHeaders(res);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}
