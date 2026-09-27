import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const templatesDir = path.dirname(fileURLToPath(import.meta.url));
const placeholder = /\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g;
const cache = new Map();
let files;

async function templateFiles() {
  if (files) return files;
  files = new Map();

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      const name = path.basename(entry.name, '.html');
      if (files.has(name)) {
        throw new Error(`Ambiguous template "${name}"`);
      }
      files.set(name, full);
    }
  }

  await walk(templatesDir);
  return files;
}

async function load(name) {
  if (cache.has(name)) return cache.get(name);
  const file = (await templateFiles()).get(name);
  if (!file) throw new Error(`Unknown template "${name}"`);
  const template = (await fs.readFile(file, 'utf8')).replace(/\n$/, '');
  cache.set(name, template);
  return template;
}

export async function renderTemplate(name, data = {}) {
  const template = await load(name);
  return template.replace(placeholder, (_, key) => {
    const value = data[key];
    return value == null ? '' : String(value);
  });
}
