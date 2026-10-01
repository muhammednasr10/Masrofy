import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveInsideRoot } from "./static-path";

const root = path.resolve("dist");

describe("resolveInsideRoot", () => {
  it("keeps files inside the build folder", () => {
    expect(resolveInsideRoot(root, "/index.html")).toBe(path.join(root, "index.html"));
    expect(resolveInsideRoot(root, "/assets/app.js")).toBe(path.join(root, "assets", "app.js"));
  });

  it("rejects paths that leave the build folder", () => {
    expect(resolveInsideRoot(root, "/../package.json")).toBeNull();
    expect(resolveInsideRoot(root, "/..\\..\\package.json")).toBeNull();
    expect(resolveInsideRoot(root, "/%2e%2e/package.json")).toBeNull();
    expect(resolveInsideRoot(root, "/%00index.html")).toBeNull();
  });
});
