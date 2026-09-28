#!/usr/bin/env node

import crypto from 'node:crypto';
import { watch } from 'node:fs';
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { buildSite } from '../src/build.js';
import { serveSite } from '../src/serve.js';
import { getThemeCss } from '../src/themes/index.js';
import {
  beginIntro,
  detail,
  fail,
  formatDuration,
  interrupt,
  intro,
  live,
  note,
  ok,
  pagesLabel,
  spin,
  warn,
} from '../src/log.js';

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function displayPath(filePath) {
  const rel = path.relative(process.cwd(), filePath);
  return rel.startsWith('..') ? filePath : rel;
}

function isJunk(full) {
  const base = path.basename(full);
  return base === '.DS_Store'
    || base.startsWith('.#')
    || base.endsWith('~')
    || base.endsWith('.swp')
    || base.endsWith('.swx')
    || base.endsWith('.tmp')
    || base.endsWith('.vsctmp');
}

function ignoredChange(inputRoot, outputDir, full) {
  if (isJunk(full)) return true;
  const rel = path.relative(inputRoot, full);
  const parts = rel.split(path.sep);
  if (parts.includes('node_modules') || parts.includes('.git')) return true;
  if (!isInside(outputDir, full)) return false;
  const base = path.basename(full);
  return path.extname(full).toLowerCase() === '.html' || base === 'index.js' || base === 'style.css';
}

async function sourceDigest(target, directory, outputDir) {
  const hash = crypto.createHash('sha1');
  const files = [];

  async function collect(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await collect(full);
      } else if (entry.isFile() && !ignoredChange(target, outputDir, full)) {
        files.push(full);
      }
    }
  }

  if (directory) await collect(target);
  else if (!ignoredChange(path.dirname(target), outputDir, target)) files.push(target);

  for (const file of files) {
    hash.update(file);
    hash.update(await fs.readFile(file));
  }
  return hash.digest('hex');
}

function watchSource(target, outputDir, onChange, directory) {
  const root = directory ? target : path.dirname(target);
  const pending = new Set();
  let timer = null;
  let running = false;
  let again = false;
  let lastDigest = '';

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      flush().catch((error) => {
        interrupt();
        fail(error.message);
        console.log();
      });
    }, 200);
  }

  async function flush() {
    if (running) {
      again = true;
      return;
    }
    if (pending.size === 0) return;
    const files = [...pending];
    pending.clear();
    const digest = await sourceDigest(target, directory, outputDir);
    if (pending.size > 0) {
      for (const file of files) pending.add(file);
      schedule();
      return;
    }
    if (digest === lastDigest) return;
    running = true;
    try {
      await onChange(files);
      lastDigest = digest;
    } finally {
      running = false;
      if (again || pending.size > 0) {
        again = false;
        schedule();
      }
    }
  }

  const watcher = watch(target, { recursive: directory }, (event, filename) => {
    if (!directory) {
      pending.add(target);
    } else {
      const name = filename ? String(filename) : '';
      const full = name ? path.resolve(root, name) : target;
      if (name && ignoredChange(root, outputDir, full)) return;
      pending.add(full);
    }
    schedule();
  });

  watcher.on('error', (error) => {
    interrupt();
    fail(error.message);
    console.log();
  });

  return watcher;
}

async function assembleSite(options, inputPath, outputDir) {
  const css = await getThemeCss(options.theme);
  return buildSite({
    inputPath,
    outputDir,
    theme: options.theme,
    css,
    multiFile: Boolean(options.multiFile),
    showDate: Boolean(options.showDate),
    showSave: Boolean(options.showSave),
    hideWatermark: Boolean(options.hideWatermark),
  });
}

const program = new Command();

program
  .name('static')
  .description('Генератор статического сайта из Markdown')
  .version('1.0.1');

program
  .command('build')
  .description('Собрать сайт')
  .option('-i, --input <path>', 'Markdown file or directory', 'content')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--clean', 'Сlean output directory before building')
  .option('--theme <theme>', 'Theme name', 'dark')
  .option('--multi-file', 'Write CSS and JS as separate files')
  .option('--show-date', 'Show date')
  .option('--show-save', 'Add a button to copy Markdown')
  .option('--hide-watermark', 'Hide watermark')
  .action(async (options) => {
    const banner = beginIntro();
    const started = Date.now();
    const inputPath = path.resolve(options.input);
    const outputDir = path.resolve(options.output);
    let settled = false;
    const pending = (async () => {
      if (!(await fs.pathExists(inputPath))) {
        throw Object.assign(new Error(`Не найдено: ${inputPath}`), {
          code: 'ENOENT',
        });
      }

      note('Сборка…');

      if (options.clean) {
        note('Очистка…');
        await fs.emptyDir(outputDir);
        note('Сборка…');
      }

      return assembleSite(options, inputPath, outputDir);
    })().finally(() => {
      settled = true;
    });

    banner.done.then(() => {
      if (!settled) spin();
    });

    try {
      const { pages } = await pending;
      const elapsed = Date.now() - started;
      banner.finish();
      await banner.done;
      ok(`Собрано за ${formatDuration(elapsed)}`);
      detail(pages === 0 ? 'Markdown-файлов нет' : `${pagesLabel(pages)}  ·  ${options.theme}`);
      detail(outputDir);
      console.log();
    } catch (error) {
      banner.finish();
      await banner.done;
      fail(error.message);
      console.log();
      process.exitCode = 1;
    }
  });

const serve = program
  .command('serve')
  .description('Start local server')
  .option('-i, --input <path>', 'Markdown file or directory', 'content')
  .option('-d, --dir <dir>', 'Directory to serve', 'dist')
  .option('-p, --port <number>', 'port', '3000')
  .option('--theme <theme>', 'Theme name', 'dark')
  .option('--multi-file', 'Write CSS and JS as separate files')
  .option('--show-date', 'Show date')
  .option('--show-save', 'Add a button to copy Markdown')
  .option('--hide-watermark', 'Hide watermark')
  .option('--reload', 'Rebuild the site when source files change', true)
  .option('--no-reload', 'Do not rebuild when source files change')
  .action(async (options) => {
    try {
      await intro();
      const dir = path.resolve(options.dir);
      const inputPath = path.resolve(options.input);
      const port = Number(options.port);
      if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error(`Неверный порт: ${options.port}`);
      }
      if (!(await fs.pathExists(dir))) {
        throw new Error(`Папка не найдена: ${dir}`);
      }

      let url = '';
      let watching = false;
      const rebuild = async (files) => {
        const started = Date.now();
        const shown = files.map((file) => displayPath(file)).join(', ');
        try {
          await assembleSite(options, inputPath, dir);
          interrupt();
          ok(`Пересобрано за ${formatDuration(Date.now() - started)}`);
          if (shown) detail(shown);
        } catch (error) {
          interrupt();
          fail(error.message);
          if (shown) detail(shown);
        }
        if (url) live(url);
      };

      if (options.reload) {
        if (await fs.pathExists(inputPath)) {
          const directory = (await fs.stat(inputPath)).isDirectory();
          watchSource(inputPath, dir, rebuild, directory);
          watching = true;
        } else if (serve.getOptionValueSource('input') === 'cli') {
          throw new Error(`Не найдено: ${inputPath}`);
        } else {
          warn(`Не слежу, не найдено: ${displayPath(inputPath)}`);
        }
      }

      spin('Запуск…');
      await serveSite({ dir, port });
      detail(dir);
      if (watching) detail(`слежение ${displayPath(inputPath)}`);
      url = `http://localhost:${port}`;
      live(url);
    } catch (error) {
      fail(error.message);
      console.log();
      process.exitCode = 1;
    }
  });

program.parse();
