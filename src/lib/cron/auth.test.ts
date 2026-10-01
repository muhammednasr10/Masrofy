import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "@/lib/cron/auth";

function requestWithAuth(authorization: string | null) {
  const headers = new Headers();
  if (authorization) {
    headers.set("authorization", authorization);
  }

  return new Request("https://example.com/api/cron/due-notifications", { headers });
}

describe("isAuthorizedCron", () => {
  it("requires bearer secret in production", () => {
    expect(
      isAuthorizedCron(requestWithAuth(null), {
        cronSecret: "secret",
        nodeEnv: "production",
      }),
    ).toBe(false);

    expect(
      isAuthorizedCron(requestWithAuth("Bearer secret"), {
        cronSecret: "secret",
        nodeEnv: "production",
      }),
    ).toBe(true);
  });

  it("rejects production when CRON_SECRET is missing", () => {
    expect(
      isAuthorizedCron(requestWithAuth("Bearer anything"), {
        cronSecret: "",
        nodeEnv: "production",
        vercelEnv: "production",
      }),
    ).toBe(false);
  });

  it("allows local development without a secret", () => {
    expect(
      isAuthorizedCron(requestWithAuth(null), {
        cronSecret: "",
        nodeEnv: "development",
        vercelEnv: undefined,
      }),
    ).toBe(true);
  });

  it("rejects a public server when the environment is unset and no secret exists", () => {
    expect(
      isAuthorizedCron(requestWithAuth(null), {
        cronSecret: "",
        nodeEnv: "",
        vercelEnv: undefined,
      }),
    ).toBe(false);
  });

  it("rejects preview deployments without a secret", () => {
    expect(
      isAuthorizedCron(requestWithAuth(null), {
        cronSecret: "",
        nodeEnv: "production",
        vercelEnv: "preview",
      }),
    ).toBe(false);
  });

  it("still enforces the secret in development when configured", () => {
    expect(
      isAuthorizedCron(requestWithAuth("Bearer wrong"), {
        cronSecret: "secret",
        nodeEnv: "development",
      }),
    ).toBe(false);
  });
});
