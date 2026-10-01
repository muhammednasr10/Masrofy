import { timingSafeEqual } from "node:crypto";

function secretsMatch(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);

  if (actualBytes.length !== expectedBytes.length) {
    return false;
  }

  return timingSafeEqual(actualBytes, expectedBytes);
}

function isLocalDev(nodeEnv: string | null | undefined, vercelEnv: string | null | undefined) {
  if (vercelEnv === "production" || vercelEnv === "preview") {
    return false;
  }

  return nodeEnv === "development" || nodeEnv === "test";
}

export function isAuthorizedCron(
  request: Request,
  env: {
    cronSecret?: string | null;
    nodeEnv?: string | null;
    vercelEnv?: string | null;
  } = {},
) {
  const cronSecret = (env.cronSecret ?? process.env.CRON_SECRET)?.trim() || "";
  const authorization = request.headers.get("authorization") ?? "";
  const nodeEnv = env.nodeEnv ?? process.env.NODE_ENV;
  const vercelEnv = env.vercelEnv ?? process.env.VERCEL_ENV;

  if (!isLocalDev(nodeEnv, vercelEnv)) {
    if (!cronSecret) {
      return false;
    }

    return secretsMatch(authorization, `Bearer ${cronSecret}`);
  }

  if (cronSecret) {
    return secretsMatch(authorization, `Bearer ${cronSecret}`);
  }

  return true;
}
