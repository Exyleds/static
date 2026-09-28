import chalk from 'chalk';

const spinFrames = ['◜', '◠', '◝', '◞', '◡', '◟'];
const accent = chalk.hex('#e2b56a');
const tty = Boolean(process.stdout.isTTY);

let timer = null;
let frame = 0;
let text = '';
let mode = null;
let cursorHidden = false;

function paint(line) {
  if (!tty) {
    console.log(line);
    return;
  }
  process.stdout.write(`\r\x1b[K${line}`);
}

function hideCursor() {
  if (!tty || cursorHidden) return;
  process.stdout.write('\x1b[?25l');
  cursorHidden = true;
}

function showCursor() {
  if (!cursorHidden) return;
  process.stdout.write('\x1b[?25h');
  cursorHidden = false;
}

function stopMotion() {
  const keepLine = mode === 'live';
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  mode = null;
  if (tty) process.stdout.write(keepLine ? '\n' : '\r\x1b[K');
  showCursor();
}

process.once('exit', showCursor);
process.once('SIGINT', () => {
  stopMotion();
  process.exit(130);
});

function sleep(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cancelSleep = null;
      resolve();
    }, ms);
    cancelSleep = () => {
      clearTimeout(timer);
      cancelSleep = null;
      resolve();
    };
  });
}

let cancelSleep = null;

export function beginIntro() {
  const name = 'static';
  const version = 'v1.0.1';
  const rule = '─'.repeat(name.length + version.length + 2);
  let phase = 'name';
  let stopRequested = false;

  function paintFinal() {
    if (phase === 'done' || !tty) {
      phase = 'done';
      return;
    }
    const title = `  ${chalk.bold(name)}  ${chalk.dim(version)}`;
    const line = `  ${accent(rule)}`;
    if (phase === 'name') {
      process.stdout.write(`\r\x1b[K${title}\n${line}\n\n`);
    } else {
      process.stdout.write(`\r\x1b[K${line}\n\n`);
    }
    phase = 'done';
    showCursor();
  }

  const done = (async () => {
    if (!tty) {
      console.log(`\n  ${name}  ${version}\n`);
      phase = 'done';
      return;
    }

    hideCursor();
    process.stdout.write('\n');
    for (let i = 1; i <= name.length; i += 1) {
      if (stopRequested) return;
      const shown = name.slice(0, i);
      const pad = ' '.repeat(name.length - i);
      process.stdout.write(`\r  ${chalk.bold(shown)}${pad}`);
      await sleep(28);
    }
    if (stopRequested) return;
    process.stdout.write(`  ${chalk.dim(version)}\n  `);
    phase = 'rule';
    for (const mark of rule) {
      if (stopRequested) return;
      process.stdout.write(accent(mark));
      await sleep(12);
    }
    if (stopRequested) return;
    process.stdout.write('\n\n');
    phase = 'done';
    showCursor();
  })();

  return {
    done,
    finish() {
      stopRequested = true;
      cancelSleep?.();
      paintFinal();
    },
  };
}

export function intro() {
  return beginIntro().done;
}

export function interrupt() {
  const active = mode === 'spin' || mode === 'live';
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  mode = null;
  if (tty && active) process.stdout.write('\r\x1b[K');
  showCursor();
}

export function spin(label = text || 'Сборка…') {
  stopMotion();
  text = label;
  frame = 0;
  if (!tty) return;
  hideCursor();
  const tick = () => {
    const mark = accent(spinFrames[frame % spinFrames.length]);
    paint(`  ${mark}  ${chalk.dim(text)}`);
    frame += 1;
  };
  tick();
  mode = 'spin';
  timer = setInterval(tick, 80);
}

export function note(label) {
  text = label;
}

export function ok(label) {
  stopMotion();
  console.log(`  ${chalk.green('✓')}  ${label}`);
}

export function warn(label) {
  stopMotion();
  console.log(`  ${chalk.yellow('!')}  ${label}`);
}

export function fail(label) {
  stopMotion();
  console.error(`  ${chalk.red('✗')}  ${label}`);
}

export function detail(label) {
  stopMotion();
  console.log(`     ${chalk.dim(label)}`);
}

export function live(label) {
  stopMotion();
  if (!tty) {
    console.log(`  ${label}`);
    return;
  }
  hideCursor();
  const tick = () => {
    const mark = frame % 8 < 4 ? chalk.cyan('●') : chalk.dim('○');
    paint(`  ${mark}  ${chalk.cyan(label)}`);
    frame += 1;
  };
  tick();
  mode = 'live';
  timer = setInterval(tick, 420);
}

export function pagesLabel(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${count} страниц`;
  if (mod10 === 1) return `${count} страница`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} страницы`;
  return `${count} страниц`;
}

export function formatDuration(ms) {
  if (ms < 1000) return `${ms} мс`;
  return `${(ms / 1000).toFixed(1)} с`;
}
