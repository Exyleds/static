import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { escapeHtml } from './render.js';

const placeholder = /\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g;
const codeBlockTemplate = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates/components/_code-block.html'),
  'utf8',
).replace(/\n$/, '');

function fill(template, data) {
  return template.replace(placeholder, (_, key) => (data[key] == null ? '' : String(data[key])));
}

function fenceLanguage(lang) {
  const raw = String(lang || '').trim().split(/\s+/)[0] || '';
  const safe = raw.replace(/[^\w.+#-]/g, '');
  return {
    label: escapeHtml(raw || 'text'),
    language: safe || 'text',
  };
}

export function renderCodeBlock(lang, source) {
  const { label, language } = fenceLanguage(lang);
  return fill(codeBlockTemplate, {
    label,
    language,
    code: escapeHtml(source),
  });
}

function renderTableCell(token) {
  const tag = token.header ? 'th' : 'td';
  const align = token.align ? ` style="text-align:${token.align};"` : '';
  const content = this.parser.parseInline(token.tokens);
  return `<${tag}${align}>${content}</${tag}>\n`;
}

const marked = new Marked();
marked.use({
  gfm: true,
  renderer: {
    code({ text, lang }) {
      return `${renderCodeBlock(lang, text)}\n`;
    },
    tablecell: renderTableCell,
  },
});

function plainText(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function headingText(token) {
  const html = String(marked.parseInline(token.text));
  return plainText(
    html
      .replace(/<[^>]+>/g, '')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'"),
  );
}

export function renderArticle(source, frontMatterTitle = '') {
  const tokens = marked.lexer(source);
  const explicit = plainText(frontMatterTitle);
  let title = explicit;
  let stripAt = -1;

  if (explicit) {
    stripAt = tokens.findIndex((token) => token.type === 'heading' && headingText(token) === explicit);
  } else {
    stripAt = tokens.findIndex((token) => token.type === 'heading');
    if (stripAt !== -1) title = headingText(tokens[stripAt]);
  }

  if (stripAt !== -1) {
    tokens.splice(stripAt, 1);
    if (tokens[stripAt]?.type === 'space') tokens.splice(stripAt, 1);
  }

  return { title, html: marked.parser(tokens) };
}
