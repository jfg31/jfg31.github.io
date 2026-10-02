import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isMain(importMetaUrl) {
  if (!process.argv[1]) return false;
  try {
    const realArgPath = realpathSync(process.argv[1]);
    const importPath = fileURLToPath(importMetaUrl);
    const realImportPath = realpathSync(importPath);
    return realArgPath === realImportPath;
  } catch {
    return false;
  }
}
