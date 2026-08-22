export function isAuthorizedCron(
  request: Request,
  env: {
    cronSecret?: string | null;
    nodeEnv?: string | null;
    vercelEnv?: string | null;
  } = {},
) {
  const cronSecret = (env.cronSecret ?? process.env.CRON_SECRET)?.trim() || "";
  const authorization = request.headers.get("authorization");
  const nodeEnv = env.nodeEnv ?? process.env.NODE_ENV;
  const vercelEnv = env.vercelEnv ?? process.env.VERCEL_ENV;
  const isProduction = nodeEnv === "production" || vercelEnv === "production";

  if (isProduction) {
    if (!cronSecret) {
      return false;
    }

    return authorization === `Bearer ${cronSecret}`;
  }

  if (cronSecret) {
    return authorization === `Bearer ${cronSecret}`;
  }

  return true;
}
