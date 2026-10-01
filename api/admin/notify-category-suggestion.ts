import type { IncomingMessage, ServerResponse } from "node:http";
import { handleApiRequest } from "../../server/api";
import { nodeToRequest, sendResponse } from "../../server/http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await sendResponse(res, await handleApiRequest(await nodeToRequest(req)));
}
