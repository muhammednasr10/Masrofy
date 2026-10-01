import path from "node:path";

export function resolveInsideRoot(root: string, urlPath: string) {
  let decoded: string;

  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  if (decoded.includes("\0")) {
    return null;
  }

  const relative = decoded.replace(/^[/\\]+/, "");
  const rootPath = path.resolve(root);
  const filePath = path.resolve(rootPath, relative);

  if (filePath !== rootPath && !filePath.startsWith(rootPath + path.sep)) {
    return null;
  }

  return filePath;
}
