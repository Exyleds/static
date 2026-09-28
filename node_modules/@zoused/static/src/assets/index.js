const words = (text) => new Set(text.trim().split(/\s+/));

const ALIASES = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  node: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  pyw: 'python',
  rb: 'ruby',
  rs: 'rust',
  kt: 'kotlin',
  kts: 'kotlin',
  cs: 'csharp',
  'c#': 'csharp',
  'c++': 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  hh: 'cpp',
  hxx: 'cpp',
  h: 'c',
  sh: 'bash',
  zsh: 'bash',
  shell: 'bash',
  console: 'bash',
  yml: 'yaml',
  md: 'plaintext',
  markdown: 'plaintext',
  text: 'plaintext',
  txt: 'plaintext',
  plain: 'plaintext',
  plaintext: 'plaintext',
  dockerfile: 'docker',
  makefile: 'make',
  mk: 'make',
  ps1: 'powershell',
  pwsh: 'powershell',
  xml: 'html',
  svg: 'html',
  vue: 'html',
  golang: 'go',
  objc: 'cpp',
  'objective-c': 'cpp',
  objectivec: 'cpp',
};

const C_LIKE = {
  line: ['//'],
  block: [['/*', '*/']],
  quotes: ['"', "'"],
  charLiterals: true,
};

const C_TYPES = words(`
  auto bool char char8_t char16_t char32_t double float int long short signed
  unsigned void wchar_t size_t ptrdiff_t int8_t int16_t int32_t int64_t uint8_t
  uint16_t uint32_t uint64_t intptr_t uintptr_t
`);

const C_KEYWORDS = words(`
  break case const continue default do else enum extern for goto if inline
  register restrict return sizeof static struct switch typedef union volatile
  while asm
`);

function define(options) {
  return {
    mode: 'code',
    line: [],
    block: [],
    quotes: ['"', "'"],
    triple: false,
    backtick: false,
    charLiterals: false,
    stringPrefixes: false,
    hash: false,
    preprocessor: false,
    flags: false,
    macros: false,
    ignoreCase: false,
    keywords: new Set(),
    types: new Set(),
    constants: new Set(),
    builtins: new Set(),
    nextType: words('class struct enum interface trait type namespace'),
    nextFunction: words('def fn func function fun sub'),
    ...options,
  };
}

const LANGUAGES = {
  plaintext: define({ mode: 'plain', quotes: [] }),
  generic: define({
    ...C_LIKE,
    hash: true,
  }),
  javascript: define({
    line: ['//'],
    block: [['/*', '*/']],
    quotes: ['"', "'"],
    backtick: true,
    keywords: words(`
      async await break case catch class const continue debugger default delete
      do else export extends finally for from function if import in instanceof
      let new of return static super switch this throw try typeof var void while
      yield
    `),
    constants: words('false null true undefined NaN Infinity'),
    builtins: words(`
      Array Boolean Date Error JSON Map Math Number Object Promise RegExp Set
      String Symbol console document window fetch setTimeout setInterval
    `),
    types: words('any unknown never void string number boolean object'),
  }),
  typescript: define({
    line: ['//'],
    block: [['/*', '*/']],
    quotes: ['"', "'"],
    backtick: true,
    keywords: words(`
      async await break case catch class const continue debugger default delete
      do else export extends finally for from function if import in instanceof
      let new of return static super switch this throw try typeof var void while
      yield interface type enum implements public private protected readonly
      abstract declare namespace module as is keyof typeof infer satisfies
      override accessor
    `),
    constants: words('false null true undefined NaN Infinity'),
    builtins: words(`
      Array Boolean Date Error JSON Map Math Number Object Promise RegExp Set
      String Symbol console document window Partial Required Pick Omit Record
      Exclude Extract NonNullable Parameters ReturnType
    `),
    types: words('any unknown never void string number boolean object bigint symbol'),
  }),
  python: define({
    hash: true,
    quotes: ['"', "'"],
    triple: true,
    stringPrefixes: true,
    keywords: words(`
      and as assert async await break class continue def del elif else except
      finally for from global if import in is lambda nonlocal not or pass raise
      return try while with yield match case
    `),
    constants: words('False None True'),
    builtins: words(`
      print len range int str float list dict set tuple open super type
      isinstance enumerate zip map filter input abs sum min max sorted reversed
      any all object Exception ValueError TypeError KeyError self cls
    `),
  }),
  c: define({
    ...C_LIKE,
    preprocessor: true,
    keywords: C_KEYWORDS,
    types: C_TYPES,
    constants: words('NULL true false'),
    builtins: words('printf scanf malloc free memcpy memset sizeof NULL'),
  }),
  cpp: define({
    ...C_LIKE,
    preprocessor: true,
    keywords: words(`
      ${[...C_KEYWORDS].join(' ')}
      alignas alignof and and_eq bitand bitor catch class co_await co_return
      co_yield compl concept const_cast consteval constexpr constinit decltype
      delete dynamic_cast explicit export friend mutable namespace new noexcept
      not not_eq operator or or_eq private protected public reinterpret_cast
      requires static_assert static_cast template this thread_local throw
      try typeid typename using virtual xor xor_eq override final module import
    `),
    types: words(`
      ${[...C_TYPES].join(' ')}
      string wstring string_view vector map set array unique_ptr shared_ptr
      weak_ptr optional variant tuple pair deque list unordered_map unordered_set
    `),
    constants: words('true false nullptr NULL'),
    builtins: words('std cout cin cerr clog endl printf scanf malloc free'),
  }),
  java: define({
    ...C_LIKE,
    keywords: words(`
      abstract assert break case catch class const continue default do else enum
      extends final finally for goto if implements import instanceof interface
      native new package private protected public return static strictfp super
      switch synchronized this throw throws transient try volatile while var yield
      record sealed permits
    `),
    types: words(`
      boolean byte char double float int long short void String Integer Long
      Double Float Boolean Character Byte Short List Map Set Optional
    `),
    constants: words('true false null'),
    builtins: words('System out println'),
  }),
  csharp: define({
    ...C_LIKE,
    keywords: words(`
      abstract as base break case catch checked class const continue default
      delegate do else enum event explicit extern finally fixed for foreach goto
      if implicit in interface internal is lock namespace new null operator out
      override params private protected public readonly ref return sealed sizeof
      stackalloc static struct switch this throw try typeof unchecked unsafe
      using virtual volatile while add alias ascending async await by descending
      equals from get global group into join let nameof orderby partial remove
      select set value var when where yield record init required
    `),
    types: words(`
      bool byte char decimal double float int long object sbyte short string
      uint ulong ushort void dynamic List Dictionary
    `),
    constants: words('true false null'),
    builtins: words('Console WriteLine Write'),
  }),
  go: define({
    line: ['//'],
    block: [['/*', '*/']],
    quotes: ['"'],
    backtick: true,
    charLiterals: true,
    keywords: words(`
      break case chan const continue default defer else fallthrough for func go
      goto if import interface map package range return select struct switch type
      var
    `),
    types: words(`
      bool byte rune string int int8 int16 int32 int64 uint uint8 uint16 uint32
      uint64 uintptr float32 float64 complex64 complex128 error any comparable
    `),
    constants: words('true false nil iota'),
    builtins: words('append cap close complex copy delete imag len make new panic print println real recover'),
  }),
  rust: define({
    line: ['//'],
    block: [['/*', '*/']],
    quotes: ['"'],
    charLiterals: true,
    macros: true,
    keywords: words(`
      as async await break const continue crate dyn else enum extern false fn for
      if impl in let loop match mod move mut pub ref return self Self static
      struct super trait true type unsafe use where while abstract become box do
      final macro override priv typeof unsized virtual yield try gen
    `),
    types: words(`
      i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 bool char str
      String Vec Option Result Box Rc Arc HashMap HashSet
    `),
    constants: words('Some None Ok Err true false'),
    builtins: words('println print eprintln format vec panic assert todo unimplemented'),
  }),
  ruby: define({
    hash: true,
    quotes: ['"', "'"],
    keywords: words(`
      alias and begin break case class def defined? do else elsif end ensure
      false for if in module next nil not or redo rescue retry return self super
      then true undef unless until when while yield
    `),
    constants: words('true false nil'),
    builtins: words('puts print p require include attr_reader attr_writer attr_accessor'),
  }),
  php: define({
    line: ['//', '#'],
    block: [['/*', '*/']],
    quotes: ['"', "'"],
    keywords: words(`
      abstract and array as break callable case catch class clone const continue
      declare default die do echo else elseif empty enddeclare endfor endforeach
      endif endswitch endwhile eval exit extends final finally fn for foreach
      function global goto if implements include include_once instanceof insteadof
      interface isset list match namespace new or print private protected public
      require require_once return static switch throw trait try unset use var
      while xor yield from
    `),
    constants: words('true false null TRUE FALSE NULL'),
    builtins: words('echo print isset empty array_map array_filter count strlen'),
  }),
  swift: define({
    ...C_LIKE,
    keywords: words(`
      associatedtype break case catch class continue default defer deinit do else
      enum extension fallthrough false fileprivate for func guard if import in
      init inout internal is let nil open operator private protocol public repeat
      rethrows return self static struct subscript super switch throw throws true
      try typealias var where while async await some any
    `),
    types: words('Int String Double Float Bool Array Dictionary Set Optional Void Any'),
    constants: words('true false nil'),
    builtins: words('print'),
  }),
  kotlin: define({
    ...C_LIKE,
    keywords: words(`
      abstract actual annotation as break by catch class companion const
      constructor continue crossinline data delegate do dynamic else enum
      expect external false final finally for fun get if import in infix init
      inline inner interface internal is lateinit noinline null object open
      operator out override package private protected public reified return
      sealed set super suspend tailrec this throw true try typealias typeof val
      var vararg when where while
    `),
    types: words('Int Long Short Byte Double Float Boolean Char String Unit Any Nothing List Map Set'),
    constants: words('true false null'),
    builtins: words('println print'),
  }),
  bash: define({
    hash: true,
    ignoreCase: true,
    quotes: ['"', "'"],
    flags: true,
    keywords: words(`
      if then else elif fi for while until do done case esac function return
      exit local export readonly declare typeset unset shift source alias unalias
      break continue in select time coproc
    `),
    builtins: words('echo cd pwd ls cat grep sed awk mkdir rm cp mv git npm yarn pnpm node python pip curl wget sudo'),
    constants: words('true false'),
  }),
  powershell: define({
    hash: true,
    ignoreCase: true,
    quotes: ['"', "'"],
    flags: true,
    keywords: words(`
      begin break catch class continue data define do dynamicparam else elseif
      end exit filter finally for foreach from function if in param process
      return switch throw trap try until while
    `),
    builtins: words('Write-Host Write-Output Get-ChildItem Get-Content Set-Content'),
    constants: words('$true $false $null'),
  }),
  sql: define({
    ignoreCase: true,
    line: ['--'],
    block: [['/*', '*/']],
    quotes: ["'", '"'],
    keywords: words(`
      select from where insert into update set delete create table drop alter
      index view join left right inner outer full on as and or not null is in
      like between exists group by order having limit offset union all distinct
      values primary key foreign references constraint default begin commit
      rollback transaction case when then else end asc desc with recursive
    `),
    types: words('int integer bigint smallint boolean bool text varchar char date time timestamp numeric decimal float double serial json jsonb'),
    constants: words('true false null'),
    builtins: words('count sum avg min max coalesce cast'),
  }),
  lua: define({
    line: ['--'],
    block: [['--[[', ']]'], ['--[=[', ']=]']],
    quotes: ['"', "'"],
    keywords: words(`
      and break do else elseif end false for function goto if in local nil not
      or repeat return then true until while
    `),
    constants: words('true false nil'),
    builtins: words('print pairs ipairs type tostring tonumber require module'),
  }),
  scala: define({
    ...C_LIKE,
    keywords: words(`
      abstract case catch class def do else extends final finally for forSome if
      implicit import lazy match new null object override package private
      protected return sealed super this throw trait try type val var while with
      yield
    `),
    types: words('Int Long Double Float Boolean Char String Unit Any Nothing List Map Set Option'),
    constants: words('true false null'),
    builtins: words('println print'),
  }),
  dart: define({
    ...C_LIKE,
    keywords: words(`
      abstract as assert async await break case catch class const continue
      covariant default deferred do else enum export extends extension external
      factory false final finally for function get hide if implements import in
      interface is late library mixin new null on operator part required rethrow
      return set show static super switch sync this throw true try typedef var
      void while with yield
    `),
    types: words('int double bool String num dynamic void List Map Set Future Stream'),
    constants: words('true false null'),
    builtins: words('print'),
  }),
  perl: define({
    hash: true,
    quotes: ['"', "'"],
    keywords: words(`
      if else elsif unless while until for foreach do sub my our local return
      last next redo package use require begin end and or not
    `),
    constants: words('undef'),
    builtins: words('print say printf shift pop push join split length chomp'),
  }),
  r: define({
    hash: true,
    quotes: ['"', "'"],
    keywords: words('if else repeat while function for in next break TRUE FALSE NULL Inf NaN NA'),
    constants: words('TRUE FALSE NULL NA Inf NaN'),
    builtins: words('c print length sum mean library require'),
  }),
  elixir: define({
    hash: true,
    quotes: ['"', "'"],
    keywords: words(`
      def defp defmodule defstruct defprotocol defimpl do end if else unless
      cond case when fn import alias use require raise try catch rescue after
      for with
    `),
    constants: words('true false nil'),
    builtins: words('IO puts inspect'),
  }),
  haskell: define({
    line: ['--'],
    block: [['{-', '-}']],
    quotes: ['"'],
    charLiterals: true,
    keywords: words(`
      case class data default deriving do else if import in infix infixl infixr
      instance let module newtype of then type where forall foreign
    `),
    types: words('Int Integer Double Float Bool Char String Maybe Either IO'),
    constants: words('True False Nothing Just'),
  }),
  zig: define({
    line: ['//'],
    quotes: ['"'],
    charLiterals: true,
    keywords: words(`
      addrspace align and anyframe anytype asm async await break catch comptime
      const continue defer else enum errdefer error export extern fn for if
      inline noalias nosuspend orelse orpacked pub resume return linksection
      struct suspend switch test threadlocal try union unreachable usingnamespace
      var volatile while
    `),
    types: words('i8 i16 i32 i64 u8 u16 u32 u64 isize usize f16 f32 f64 bool void type'),
    constants: words('true false null undefined'),
    builtins: words('std'),
  }),
  css: define({ mode: 'css', block: [['/*', '*/']], quotes: ['"', "'"] }),
  html: define({ mode: 'html', quotes: ['"', "'"] }),
  json: define({ mode: 'json', quotes: ['"'] }),
  yaml: define({
    hash: true,
    quotes: ['"', "'"],
    constants: words('true false yes no on off null'),
    keywords: words(''),
  }),
  toml: define({
    hash: true,
    quotes: ['"', "'"],
    constants: words('true false'),
  }),
  docker: define({
    hash: true,
    ignoreCase: true,
    quotes: ['"', "'"],
    keywords: words(`
      from run cmd entrypoint copy add env arg workdir expose volume user label
      stopsignal healthcheck shell onbuild maintainer as
    `),
  }),
  make: define({
    hash: true,
    quotes: ['"', "'"],
    keywords: words('ifeq ifneq ifdef ifndef else endif include define endef export unexport override'),
  }),
  diff: define({ mode: 'diff', quotes: [] }),
};

function languageFromClass(className) {
  const match = /(?:^|\s)language-([^\s]+)/i.exec(className || '');
  if (!match) return 'generic';
  return match[1].toLowerCase();
}

function resolveLanguage(name) {
  const key = ALIASES[name] || name;
  return LANGUAGES[key] || LANGUAGES.generic;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function readString(source, start, quote, multiline) {
  let i = start + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === quote) return i + 1;
    if (!multiline && source[i] === '\n') break;
    i += 1;
  }
  return i;
}

function readChar(source, i) {
  if (source[i] !== "'") return null;
  if (source[i + 1] === '\\' && source[i + 2] && source[i + 3] === "'") return i + 4;
  if (source[i + 1] && source[i + 1] !== '\\' && source[i + 1] !== '\n' && source[i + 2] === "'") return i + 3;
  return null;
}

function tryString(source, i, lang) {
  let start = i;
  if (lang.stringPrefixes) {
    const prefix = source.slice(i).match(/^[rRuUbBfF]{1,2}(?=['"])/);
    if (prefix) start = i + prefix[0].length;
  }

  const rest = source.slice(start);
  if (lang.triple && (rest.startsWith('"""') || rest.startsWith("'''"))) {
    const quote = rest.slice(0, 3);
    const end = source.indexOf(quote, start + 3);
    return end === -1 ? source.length : end + 3;
  }
  if (lang.backtick && rest[0] === '`') return readString(source, start, '`', true);
  if (rest[0] === "'") {
    if (lang.charLiterals) {
      const end = readChar(source, start);
      if (end) return end;
      if (!lang.quotes.includes("'")) return null;
    }
    if (lang.quotes.includes("'")) return readString(source, start, "'", false);
    return null;
  }
  if (rest[0] === '"' && lang.quotes.includes('"')) return readString(source, start, '"', false);
  return null;
}

function tryPreprocessor(source, i, lang) {
  if (!lang.preprocessor || source[i] !== '#') return null;
  if (i > 0 && source[i - 1] !== '\n') return null;
  const match = source.slice(i).match(/^#\s*[A-Za-z_]\w*/);
  if (!match) return null;

  const tokens = [{ type: 'keyword', value: match[0] }];
  let j = i + match[0].length;
  const spaces = source.slice(j).match(/^[^\S\n]*/);
  if (spaces?.[0]) {
    tokens.push({ type: 'space', value: spaces[0] });
    j += spaces[0].length;
  }
  if (source[j] === '<' || source[j] === '"') {
    const endChar = source[j] === '<' ? '>' : '"';
    const end = source.indexOf(endChar, j + 1);
    const stop = end === -1 ? j + 1 : end + 1;
    tokens.push({ type: 'string', value: source.slice(j, stop) });
    j = stop;
  }
  return { tokens, index: j };
}

function startsComment(source, i, lang) {
  if (lang.hash && source[i] === '#' && (i === 0 || /[\s;(]/.test(source[i - 1]))) {
    return { close: '\n', includeClose: false };
  }
  const rest = source.slice(i);
  const line = lang.line.find((mark) => rest.startsWith(mark));
  if (line) return { close: '\n', includeClose: false, open: line };
  const block = lang.block.find(([open]) => rest.startsWith(open));
  if (block) return { close: block[1], includeClose: true, open: block[0] };
  return null;
}

function hasWord(set, word, ignoreCase) {
  return set.has(word) || (ignoreCase && set.has(word.toLowerCase()));
}

function tokenizeCode(source, lang) {
  const tokens = [];
  let i = 0;
  let expect = null;

  while (i < source.length) {
    const rest = source.slice(i);
    const pre = tryPreprocessor(source, i, lang);
    if (pre) {
      tokens.push(...pre.tokens);
      i = pre.index;
      expect = null;
      continue;
    }

    const stringEnd = tryString(source, i, lang);
    if (stringEnd) {
      tokens.push({ type: 'string', value: source.slice(i, stringEnd) });
      i = stringEnd;
      expect = null;
      continue;
    }

    const comment = startsComment(source, i, lang);
    if (comment) {
      const from = i + (comment.open ? comment.open.length : 1);
      const end = source.indexOf(comment.close, comment.close === '\n' ? i : from);
      const stop = end === -1 ? source.length : end + (comment.includeClose ? comment.close.length : 0);
      tokens.push({ type: 'comment', value: source.slice(i, stop) });
      i = stop;
      expect = null;
      continue;
    }

    if (lang.flags && rest[0] === '-' && /[\w-]/.test(rest[1] || '')) {
      const flag = rest.match(/^--?[\w-]+/);
      if (flag) {
        tokens.push({ type: 'builtin', value: flag[0] });
        i += flag[0].length;
        expect = null;
        continue;
      }
    }

    if (/\d/.test(source[i]) && (i === 0 || !/[\w$]/.test(source[i - 1]))) {
      const number = rest.match(/^(?:0x[\da-fA-F]+|0b[01]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)[uUlLfFdD]*/);
      if (number) {
        tokens.push({ type: 'number', value: number[0] });
        i += number[0].length;
        continue;
      }
    }

    if (/[A-Za-z_$]/.test(source[i])) {
      const word = rest.match(/^[A-Za-z_$][\w$]*/)[0];
      const after = source.slice(i + word.length);
      let type = 'ident';
      if (hasWord(lang.constants, word, lang.ignoreCase)) type = 'constant';
      else if (hasWord(lang.keywords, word, lang.ignoreCase)) type = 'keyword';
      else if (expect === 'function') type = 'function';
      else if (expect === 'type') type = 'type';
      else if (hasWord(lang.types, word, lang.ignoreCase)) type = 'type';
      else if (hasWord(lang.builtins, word, lang.ignoreCase)) type = 'builtin';
      else if (/^\s*\(/.test(after) || (lang.macros && after[0] === '!')) type = 'function';

      tokens.push({ type, value: word });
      i += word.length;
      if (type === 'keyword' && hasWord(lang.nextFunction, word, lang.ignoreCase)) expect = 'function';
      else if (type === 'keyword' && hasWord(lang.nextType, word, lang.ignoreCase)) expect = 'type';
      else expect = null;
      continue;
    }

    if (source[i] === '\n') {
      tokens.push({ type: 'newline', value: '\n' });
      i += 1;
      expect = null;
      continue;
    }

    if (/[^\S\n]/.test(source[i])) {
      const spaces = rest.match(/^[^\S\n]+/)[0];
      tokens.push({ type: 'space', value: spaces });
      i += spaces.length;
      continue;
    }

    tokens.push({ type: 'punct', value: source[i] });
    i += 1;
    expect = null;
  }

  return tokens;
}

function pushText(tokens, text) {
  text.split('\n').forEach((part, index, parts) => {
    if (part) tokens.push({ type: 'ident', value: part });
    if (index < parts.length - 1) tokens.push({ type: 'newline', value: '\n' });
  });
}

function tokenizeHtml(source) {
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    if (source.startsWith('<!--', i)) {
      const end = source.indexOf('-->', i + 4);
      const stop = end === -1 ? source.length : end + 3;
      tokens.push({ type: 'comment', value: source.slice(i, stop) });
      i = stop;
      continue;
    }

    if (source[i] === '<' && /[A-Za-z/!?]?/.test(source[i + 1] || '')) {
      tokens.push({ type: 'punct', value: '<' });
      i += 1;
      if (source[i] === '/' || source[i] === '!') {
        tokens.push({ type: 'punct', value: source[i] });
        i += 1;
      }
      const name = source.slice(i).match(/^[A-Za-z][\w:-]*/);
      if (name) {
        tokens.push({ type: 'keyword', value: name[0] });
        i += name[0].length;
      }
      while (i < source.length && source[i] !== '>') {
        if (source[i] === '\n') {
          tokens.push({ type: 'newline', value: '\n' });
          i += 1;
          continue;
        }
        if (/[^\S\n]/.test(source[i])) {
          const spaces = source.slice(i).match(/^[^\S\n]+/)[0];
          tokens.push({ type: 'space', value: spaces });
          i += spaces.length;
          continue;
        }
        if (source[i] === '"' || source[i] === "'") {
          const end = readString(source, i, source[i], false);
          tokens.push({ type: 'string', value: source.slice(i, end) });
          i = end;
          continue;
        }
        const attr = source.slice(i).match(/^[A-Za-z_:][\w:.-]*/);
        if (attr) {
          tokens.push({ type: 'builtin', value: attr[0] });
          i += attr[0].length;
          continue;
        }
        tokens.push({ type: 'punct', value: source[i] });
        i += 1;
      }
      if (source[i] === '>') {
        tokens.push({ type: 'punct', value: '>' });
        i += 1;
      }
      continue;
    }

    const next = source.indexOf('<', i);
    const stop = next === -1 ? source.length : next;
    pushText(tokens, source.slice(i, stop));
    i = stop;
  }

  return tokens;
}

function tokenizeCss(source) {
  const tokens = [];
  let i = 0;
  const keywords = words('important from to inherit initial unset none auto block flex grid bold solid transparent');

  while (i < source.length) {
    const rest = source.slice(i);
    if (rest.startsWith('/*')) {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      tokens.push({ type: 'comment', value: source.slice(i, stop) });
      i = stop;
      continue;
    }
    if (rest[0] === '"' || rest[0] === "'") {
      const end = readString(source, i, rest[0], false);
      tokens.push({ type: 'string', value: source.slice(i, end) });
      i = end;
      continue;
    }
    const hex = rest.match(/^#[\da-fA-F]{3,8}\b/);
    if (hex) {
      tokens.push({ type: 'number', value: hex[0] });
      i += hex[0].length;
      continue;
    }
    const selector = rest.match(/^[#.][A-Za-z_-][\w-]*/);
    if (selector) {
      tokens.push({ type: 'function', value: selector[0] });
      i += selector[0].length;
      continue;
    }
    const at = rest.match(/^@[\w-]+/);
    if (at) {
      tokens.push({ type: 'keyword', value: at[0] });
      i += at[0].length;
      continue;
    }
    if (/\d/.test(rest[0]) || (rest[0] === '.' && /\d/.test(rest[1] || ''))) {
      const number = rest.match(/^(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?(?:px|em|rem|vh|vw|%|s|ms|deg|fr|ch|ex)?/i);
      if (number) {
        tokens.push({ type: 'number', value: number[0] });
        i += number[0].length;
        continue;
      }
    }
    if (/[A-Za-z_-]/.test(rest[0])) {
      const word = rest.match(/^[A-Za-z_-][\w-]*/)[0];
      const after = source.slice(i + word.length);
      let type = 'ident';
      if (keywords.has(word)) type = 'keyword';
      else if (/^\s*:/.test(after) && !/^\s*:\s*:/.test(after)) type = 'builtin';
      else if (/^\s*[{,]/.test(after)) type = 'keyword';
      tokens.push({ type, value: word });
      i += word.length;
      continue;
    }
    if (source[i] === '\n') {
      tokens.push({ type: 'newline', value: '\n' });
      i += 1;
      continue;
    }
    if (/[^\S\n]/.test(source[i])) {
      const spaces = rest.match(/^[^\S\n]+/)[0];
      tokens.push({ type: 'space', value: spaces });
      i += spaces.length;
      continue;
    }
    tokens.push({ type: 'punct', value: source[i] });
    i += 1;
  }

  return tokens;
}

function tokenizeJson(source) {
  const tokens = tokenizeCode(source, define({
    quotes: ['"'],
    constants: words('true false null'),
  }));

  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].type !== 'string') continue;
    let next = index + 1;
    while (tokens[next] && (tokens[next].type === 'space' || tokens[next].type === 'newline')) next += 1;
    if (tokens[next]?.type === 'punct' && tokens[next].value === ':') tokens[index].type = 'builtin';
  }

  return tokens;
}

function tokenizeDiff(source) {
  const lines = source.split('\n');
  const tokens = [];
  lines.forEach((line, index) => {
    let type = 'ident';
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ') || line.startsWith('index ')) type = 'builtin';
    else if (line.startsWith('@@')) type = 'keyword';
    else if (line.startsWith('+')) type = 'addition';
    else if (line.startsWith('-')) type = 'deletion';
    if (line) tokens.push({ type, value: line });
    if (index < lines.length - 1) tokens.push({ type: 'newline', value: '\n' });
  });
  return tokens;
}

function tokenize(source, lang) {
  if (lang.mode === 'plain') return [{ type: 'ident', value: source }];
  if (lang.mode === 'html') return tokenizeHtml(source);
  if (lang.mode === 'css') return tokenizeCss(source);
  if (lang.mode === 'json') return tokenizeJson(source);
  if (lang.mode === 'diff') return tokenizeDiff(source);
  return tokenizeCode(source, lang);
}

const PLAIN = new Set(['space', 'punct', 'ident', 'newline']);

function renderHighlighted(source, language) {
  const lines = [[]];
  for (const token of tokenize(source, resolveLanguage(language))) {
    if (token.type === 'newline') {
      lines.push([]);
      continue;
    }
    lines[lines.length - 1].push(token);
  }

  return lines.map((line) => line.map((token) => {
    if (PLAIN.has(token.type)) return escapeHtml(token.value);
    return `<span class="tok tok-${token.type}">${escapeHtml(token.value)}</span>`;
  }).join('')).join('\n');
}

function copyWithTextarea(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.append(area);
  area.select();
  const copied = document.execCommand('copy');
  area.remove();
  return copied;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Браузер может отклонить Clipboard API даже по клику.
    }
  }

  if (!copyWithTextarea(text)) throw new Error('copy failed');
}

function setupCodeBlocks() {
  document.querySelectorAll('.code-block').forEach((block) => {
    const codes = [...block.querySelectorAll('code')];
    const button = block.querySelector('.code-block__copy');
    if (codes.length === 0) return;

    const source = codes.map((code) => {
      const text = code.textContent.replace(/\n$/, '');
      code.innerHTML = renderHighlighted(text, languageFromClass(code.className));
      return text;
    }).join('\n');

    if (!button) return;

    const labelEl = button.querySelector('.code-block__copy-label');
    const label = button.dataset.label || labelEl.textContent;
    const done = button.dataset.done || 'Copied';
    let timer = 0;

    button.addEventListener('click', async () => {
      window.clearTimeout(timer);
      try {
        await copyText(source);
        labelEl.textContent = done;
        button.classList.add('is-copied');
        button.setAttribute('aria-label', 'Copied');
      } catch {
        labelEl.textContent = 'Error';
        button.classList.remove('is-copied');
      }
      timer = window.setTimeout(() => {
        labelEl.textContent = label;
        button.classList.remove('is-copied');
        button.setAttribute('aria-label', 'Copy code');
      }, 2000);
    });
  });
}

setupCodeBlocks();
