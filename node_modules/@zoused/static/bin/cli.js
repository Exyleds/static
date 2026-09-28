#!/usr/bin/env node

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
  intro,
  live,
  note,
  ok,
  pagesLabel,
  spin,
} from '../src/log.js';

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
  .option('--multi-file', 'Generates a separate file for styles')
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
      const css = await getThemeCss(options.theme);

      if (options.clean) {
        note('Очистка…');
        await fs.emptyDir(outputDir);
        note('Сборка…');
      }

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

program
  .command('serve')
  .description('Start local server')
  .option('-p, --port <number>', 'port', '3000')
  .option('-d, --dir <dir>', 'Directory to serve', 'dist')
  .action(async (options) => {
    try {
      await intro();
      const dir = path.resolve(options.dir);
      const port = Number(options.port);
      if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error(`Неверный порт: ${options.port}`);
      }
      if (!(await fs.pathExists(dir))) {
        throw new Error(`Папка не найдена: ${dir}`);
      }

      spin('Запуск…');
      await serveSite({ dir, port });
      detail(dir);
      live(`http://localhost:${port}`);
    } catch (error) {
      fail(error.message);
      console.log();
      process.exitCode = 1;
    }
  });

program.parse();
