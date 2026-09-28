# Веб-сервер на Crow

[Crow](https://github.com/CrowCpp/Crow) — header-only микрофреймворк для HTTP на C++. Маршруты задаются макросом `CROW_ROUTE`, по духу это близко к Flask. Ниже сервер на [Crow v1.3.4](https://github.com/CrowCpp/Crow/releases/tag/v1.3.4): страница, путь с параметром и JSON.

Нужен компилятор с C++17 (`clang++` или `g++`) и заголовки [Asio](https://think-async.com/Asio/).

## Установка

### macOS

```bash
brew install crow
```

Homebrew ставит Crow и Asio. Заголовки лежат в `$(brew --prefix)/include`.

### Linux

Зависимости и сборка из исходников:

```bash
sudo apt install g++ cmake git libasio-dev
git clone --branch v1.3.4 --depth 1 https://github.com/CrowCpp/Crow.git
cmake -S Crow -B Crow/build -DCROW_BUILD_EXAMPLES=OFF -DCROW_BUILD_TESTS=OFF -DCROW_ENABLE_SSL=OFF -DCROW_ENABLE_COMPRESSION=OFF
cmake --build Crow/build
sudo cmake --install Crow/build
```

Пакет `crow` есть и в AUR. Готовый `.deb` лежит в [релизах](https://github.com/CrowCpp/Crow/releases/latest).

## Код

Файл `main.cpp`:

```cpp
#include "crow.h"

int main() {
  crow::SimpleApp app;

  CROW_ROUTE(app, "/")([] {
    return "<h1>Сервер на Crow</h1><p>Откройте /hello/мир или /json</p>";
  });

  CROW_ROUTE(app, "/hello/<string>")([](const std::string& name) {
    return "Привет, " + name;
  });

  CROW_ROUTE(app, "/json")([] {
    crow::json::wvalue body;
    body["ok"] = true;
    body["framework"] = "crow";
    return body;
  });

  CROW_ROUTE(app, "/echo").methods("POST"_method)([](const crow::request& req) {
    auto incoming = crow::json::load(req.body);
    if (!incoming) return crow::response(400, "invalid json");

    crow::json::wvalue reply;
    reply["echo"] = incoming["message"].s();
    return crow::response(reply);
  });

  app.port(18080).multithreaded().run();
}
```

Строка из обработчика уходит как `text/html`. Объект `crow::json::wvalue` — как `application/json`. Без `port()` Crow слушает порт `80`.

| Метод | Путь | Ответ |
| --- | --- | --- |
| `GET` | `/` | HTML-страница |
| `GET` | `/hello/<имя>` | Текст с именем из пути |
| `GET` | `/json` | `{"ok":true,"framework":"crow"}` |
| `POST` | `/echo` | Тело `{"message":"..."}` возвращается в поле `echo` |

## Сборка и запуск

Одной командой, если Crow уже установлен:

```bash
c++ main.cpp -std=c++17 -pthread -I"$(brew --prefix)/include" -o server
./server
```

На Linux префикс Homebrew не нужен: уберите `-I"$(brew --prefix)/include"`. Для `g++` флаг `-pthread` можно заменить на `-lpthread`.

Через CMake, `CMakeLists.txt` рядом с `main.cpp`:

```cmake
cmake_minimum_required(VERSION 3.16)
project(crow_server LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Crow REQUIRED)

add_executable(server main.cpp)
target_link_libraries(server PRIVATE Crow::Crow)
```

```bash
cmake -S . -B build
cmake --build build
./build/server
```

В логе будет адрес `http://0.0.0.0:18080`. Проверка:

```bash
curl http://localhost:18080/
curl http://localhost:18080/hello/мир
curl http://localhost:18080/json
curl -X POST http://localhost:18080/echo \
  -H 'Content-Type: application/json' \
  -d '{"message":"ping"}'
```

Последний запрос отвечает `{"echo":"ping"}`. Остановка сервера — `Ctrl+C`.
