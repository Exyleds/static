import path from 'node:path';
import { renderTemplate } from './templates/index.js';

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function encodeHref(href) {
  return href
    .split('/')
    .map((part) => (part === '.' || part === '..' ? part : encodeURIComponent(part)))
    .join('/');
}

export function relativeHref(fromRel, toRel) {
  const from = fromRel.split(path.sep).join('/');
  const to = toRel.split(path.sep).join('/');
  const href = path.posix.relative(path.posix.dirname(from), to);
  return encodeHref(href.startsWith('.') ? href : `./${href}`);
}

async function styleMarkup(css, multiFile, currentRel) {
  if (!multiFile) {
    return renderTemplate('_style-inline', { css });
  }
  return renderTemplate('_style-link', {
    href: escapeHtml(relativeHref(currentRel, 'style.css')),
  });
}

function dateAttribute(date) {
  return date?.iso ? ` datetime="${escapeHtml(date.iso)}"` : '';
}

async function renderHeading({ title, date, save }) {
  const items = [];
  if (title) items.push(await renderTemplate('_article-title', { title: escapeHtml(title) }));
  if (date) {
    items.push(await renderTemplate('_article-date', {
      datetime: dateAttribute(date),
      date: escapeHtml(date.label),
    }));
  }
  if (save) items.push(await renderTemplate('_article-copy'));

  const heading = items.length
    ? await renderTemplate('_article-heading', { items: items.join('') })
    : '';

  if (!heading) return '';
  return renderTemplate('_article-header', { heading });
}

export async function renderIndexBody(pages, { showDate }) {
  const items = await Promise.all(pages.map(async (page) => renderTemplate('_index-item', {
    href: escapeHtml(page.href),
    title: escapeHtml(page.label),
    date: showDate
      ? await renderTemplate('_index-date', {
        datetime: dateAttribute(page.date),
        date: escapeHtml(page.date.label),
      })
      : '',
  })));
  return renderTemplate('_article-index', { items: items.join('\n') });
}

export async function renderPage({
  title,
  description,
  body,
  currentRel,
  css,
  multiFile,
  date,
  save,
  watermark,
}) {
  const safeTitle = title ? escapeHtml(title) : '';
  const html = await renderTemplate('page', {
    title: safeTitle,
    heading: await renderHeading({ title, date, save }),
    description: description
      ? await renderTemplate('_meta-description', { description: escapeHtml(description) })
      : '',
    style: await styleMarkup(css, multiFile, currentRel),
    watermark: watermark
      ? await renderTemplate('_watermark', { version: escapeHtml(watermark) })
      : '',
    copyScript: save
      ? await renderTemplate('_copy-script', {
        source: JSON.stringify(save.source).replaceAll('<', '\\u003c'),
      })
      : '',
    js: escapeHtml(relativeHref(currentRel, 'index.js')),
    body,
  });
  return html.endsWith('\n') ? html : `${html}\n`;
}
