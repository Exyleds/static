import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import matter from 'gray-matter';
import { renderArticle } from './markdown.js';
import { relativeHref, renderIndexBody, renderPage } from './render.js';
import { getThemeCss } from './themes/index.js';

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets');
const { version } = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const watermarkVersion = `v${String(version).split('.')[0] || '1.0.1'}`;

const MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const STATIC_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.css',
  '.js',
  '.pdf',
  '.ico',
]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function toHtmlRel(relPosix) {
  if (relPosix.toLowerCase() === 'index.md') return 'index.html';
  return `${relPosix.slice(0, -'.md'.length)}.html`;
}

function formatUtcIso(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatRu(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

function localIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function explicitDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const iso = formatUtcIso(value);
    return { iso, label: formatRu(iso) };
  }
  const text = String(value).trim().replace(/^["']|["']$/g, '');
  if (!text) return null;
  const iso = /^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/.exec(text);
  if (iso) return { iso: iso[1], label: formatRu(iso[1]) };
  return { iso: null, label: text };
}

function splitLeadingDate(content) {
  const match = /^(?:[ \t]*date:[ \t]*(.+?)[ \t]*\r?\n)(?:\r?\n)?/.exec(content);
  if (!match) return { content, date: null };
  return {
    content: content.slice(match[0].length),
    date: match[1].trim().replace(/^["']|["']$/g, ''),
  };
}

function pageLabel(page) {
  if (page.title) return page.title;
  return path.posix.basename(page.outRel, '.html');
}

export async function buildSite({
  inputPath,
  outputDir,
  theme,
  css: preparedCss,
  multiFile,
  showDate,
  showSave,
  hideWatermark,
}) {
  if (!(await fs.pathExists(inputPath))) {
    const error = new Error(`Input not found: ${inputPath}`);
    error.code = 'ENOENT';
    throw error;
  }

  const stat = await fs.stat(inputPath);
  let files;
  let relOf;
  if (stat.isFile()) {
    if (path.extname(inputPath).toLowerCase() !== '.md') {
      throw new Error(`Markdown file expected: ${inputPath}`);
    }
    files = [inputPath];
    relOf = () => path.basename(inputPath);
  } else if (stat.isDirectory()) {
    files = await walk(inputPath);
    relOf = (file) => path.relative(inputPath, file);
  } else {
    throw new Error(`Markdown file or directory expected: ${inputPath}`);
  }

  const css = preparedCss ?? await getThemeCss(theme);
  const jsPath = path.join(assetsDir, 'index.js');
  const js = await fs.readFile(jsPath, 'utf8');
  await fs.ensureDir(outputDir);
  if (multiFile) {
    await fs.copy(jsPath, path.join(outputDir, 'index.js'));
    await fs.writeFile(path.join(outputDir, 'style.css'), css);
  }

  const buildIso = localIso(new Date());
  const pages = [];

  for (const file of files) {
    const rel = relOf(file);
    const ext = path.extname(file).toLowerCase();

    if (ext === '.md') {
      const raw = await fs.readFile(file, 'utf8');
      const parsed = matter(raw);
      const leading = splitLeadingDate(parsed.content);
      const relPosix = rel.split(path.sep).join('/');
      const article = renderArticle(leading.content, parsed.data.title);
      const date = explicitDate(parsed.data.date) || explicitDate(leading.date) || {
        iso: buildIso,
        label: formatRu(buildIso),
      };
      pages.push({
        title: article.title,
        description: parsed.data.description ? String(parsed.data.description) : '',
        html: article.html,
        outRel: toHtmlRel(relPosix),
        date,
        source: raw,
      });
      continue;
    }

    if (stat.isDirectory() && STATIC_EXT.has(ext)) {
      const dest = path.join(outputDir, rel);
      await fs.ensureDir(path.dirname(dest));
      await fs.copy(file, dest);
    }
  }

  const watermark = hideWatermark ? '' : watermarkVersion;

  for (const page of pages) {
    const html = await renderPage({
      title: page.title,
      description: page.description,
      body: page.html,
      currentRel: page.outRel,
      css,
      js,
      multiFile,
      date: showDate ? page.date : null,
      save: showSave ? { source: page.source } : null,
      watermark,
    });
    const dest = path.join(outputDir, page.outRel);
    await fs.ensureDir(path.dirname(dest));
    await fs.writeFile(dest, html);
  }

  const markdownCount = pages.length;
  if (stat.isDirectory() && markdownCount > 1) {
    const articles = pages
      .filter((page) => page.outRel !== 'index.html')
      .map((page) => ({
        href: relativeHref('index.html', page.outRel),
        label: pageLabel(page),
        date: page.date,
      }))
      .sort((a, b) => {
        if (a.date.iso && b.date.iso && a.date.iso !== b.date.iso) {
          return a.date.iso < b.date.iso ? 1 : -1;
        }
        if (a.date.iso && !b.date.iso) return -1;
        if (!a.date.iso && b.date.iso) return 1;
        return a.label.localeCompare(b.label, 'ru');
      });
    const html = await renderPage({
      title: 'Главная',
      description: '',
      body: await renderIndexBody(articles, { showDate }),
      currentRel: 'index.html',
      css,
      js,
      multiFile,
      date: null,
      save: null,
      watermark,
    });
    await fs.writeFile(path.join(outputDir, 'index.html'), html);
  }

  return { pages: markdownCount };
}
