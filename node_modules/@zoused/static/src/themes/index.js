import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const themesDir = path.dirname(fileURLToPath(import.meta.url));
const importPattern = /@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*;/g;

async function listThemes() {
  const entries = await fs.readdir(themesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.css') && !entry.name.startsWith('_'))
    .map((entry) => path.basename(entry.name, '.css'))
    .sort((a, b) => a.localeCompare(b));
}

async function readCss(file, seen = new Set()) {
  const resolved = path.resolve(file);
  if (seen.has(resolved)) {
    throw new Error(`Circular CSS import: ${resolved}`);
  }
  seen.add(resolved);

  const source = await fs.readFile(resolved, 'utf8');
  const parts = [];
  let lastIndex = 0;

  for (const match of source.matchAll(importPattern)) {
    parts.push(source.slice(lastIndex, match.index));
    if (/^[a-z][a-z0-9+.-]*:/i.test(match[1])) {
      parts.push(match[0]);
    } else {
      const imported = path.resolve(path.dirname(resolved), match[1]);
      parts.push(await readCss(imported, seen));
    }
    lastIndex = match.index + match[0].length;
  }

  parts.push(source.slice(lastIndex));
  return parts.join('\n');
}

export async function getThemeCss(name) {
  const available = await listThemes();
  if (!available.includes(name)) {
    const error = new Error(
      `Unknown theme "${name}". Available: ${available.join(', ')}`,
    );
    error.code = 'UNKNOWN_THEME';
    throw error;
  }

  const css = await readCss(path.join(themesDir, `${name}.css`));
  return css.endsWith('\n') ? css : `${css}\n`;
}
