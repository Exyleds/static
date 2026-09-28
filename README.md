# static

Генерирует сайт по Markdow в виде статьи


[@zoused/static@1.0.0](https://www.npmjs.com/package/@zoused/static).

## Установка

```bash
npm install -g @zoused/static@1.0.3
```


## Сборка

```bash
static build -i content -o dist
```

```bash
npx @zoused/static@1.0.3 build -i content -o dist
```

На выходе выдает файл HTML в папке output

### Флаги `build`

| Флаг | По умолчанию | Что делает |
| --- | --- | --- |
| `-i, --input <path>` | `content` | Markdown-файл или папка |
| `-o, --output <dir>` | `dist` | Папка результата |
| `--clean` | выкл. | Очистить папку результата перед сборкой |
| `--theme <theme>` | `dark` | Тема: `dark` или `light` |
| `--multi-file` | выкл. | Вынести стили в `style.css`, скрипт в `index.js` |
| `--show-date` | выкл. | Показать дату публикации |
| `--show-save` | выкл. | Кнопка копировать исходный Markdown |
| `--hide-watermark` | выкл. | Убрать водяной знак |

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
| `-i, --input <path>` | `content` | Что пересобирать, пока включён `--reload` |
| `--reload` | вкл. | Пересобрать сайт при изменении исходников. `--no-reload` выключает слежение |

Флаги `--theme`, `--multi-file`, `--show-date`, `--show-save` и `--hide-watermark` работают так же, как у `build`, и применяются при пересборке.

## Темы

- `dark` — тёмная страница.
- `light` — тёплая бумажная страница.

Цвета темы лежат в `src/themes/dark.css` и `src/themes/light.css`. Общая вёрстка — в `src/themes/_base.css`.

## Оформление
### Статья
![Статья](https://i.postimg.cc/3xsqqN42/Snimok-ekrana-2026-09-28-v-23-16-27.png)

### Блок кода
![Блок кода](https://i.postimg.cc/HkyZbmZ7/Snimok-ekrana-2026-09-28-v-23-17-49.png)

### Таблица
![Таблица](https://i.postimg.cc/LsSTf1gW/Snimok-ekrana-2026-09-28-v-23-19-03.png)