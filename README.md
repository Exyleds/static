# static

Генерирует сайт по Markdow в ввиде статьи

[@zoused/static@1.0.0](https://www.npmjs.com/package/@zoused/static).

## Установка

```bash
npm install -g @zoused/static@1.0.0
```


## Сборка

```bash
static build -i content -o dist
```

```bash
npx @zoused/static@1.0.0 build -i content -o dist
```

На выходе выдает файл HTML в папке output

### Флаги `build`

| Флаг | По умолчанию | Что делает |
| --- | --- | --- |
| `-i, --input <path>` | `content` | Markdown-файл или папка |
| `-o, --output <dir>` | `dist` | Папка результата |
| `--clean` | выкл. | Очистить папку результата перед сборкой |
| `--theme <theme>` | `dark` | Тема: `dark` или `light` |
| `--multi-file` | выкл. | Вынести стили в `style.css`. Без флага CSS вставляется в страницу |
| `--show-date` | выкл. | Показать дату рядом с названием |
| `--show-save` | выкл. | Кнопка справа от названия: копирует исходный Markdown |
| `--hide-watermark` | выкл. | Убрать подпись внизу страницы |

Пример:

```bash
static build -i content -o dist --clean --theme light --show-date --show-save
```

Неизвестное имя темы останавливает сборку и печатает список доступных тем.

## Просмотр

```bash
static serve -d dist -p 3000
```

Сервер отдаёт `http://localhost:3000`. Для папки открывается `index.html`.

| Флаг | По умолчанию | Что делает |
| --- | --- | --- |
| `-d, --dir <dir>` | `dist` | Какую папку раздавать |
| `-p, --port <number>` | `3000` | Порт |

## Темы

- `dark` — тёмная страница.
- `light` — тёплая бумажная страница.

Цвета темы лежат в `src/themes/dark.css` и `src/themes/light.css`. Общая вёрстка — в `src/themes/_base.css`.
