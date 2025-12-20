# Hono Backend - Messenger API

> Современный backend для мессенджера с безопасной аутентификацией через Access/Refresh токены и httpOnly cookies

## 🚀 Быстрый старт

### Установка

```sh
bun install
# или
pnpm install
```

### Настройка .env

Создайте файл `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/messenger_db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
PORT=3000
NODE_ENV=development
```

### Запуск

```sh
# Запустить БД
docker-compose up -d

# Применить миграцию (если нужно)
# pnpm run migrate:refresh-tokens

# Запустить сервер
bun run dev
```

Откройте http://localhost:3000

## 🔐 Система аутентификации

### Access Token (15 минут)
- 📦 Хранится в **памяти клиента** (state/переменная)
- 🔑 Используется для API запросов
- ⚡ Короткий срок жизни для безопасности

### Refresh Token (7 дней)
- 🍪 Хранится в **httpOnly cookie**
- 🛡️ Недоступен для JavaScript (защита от XSS)
- 🔄 Используется для обновления access токена
- 💾 Сохраняется в БД (можно отозвать)

## 📚 Документация

- **[COOKIES-USAGE.md](./COOKIES-USAGE.md)** - 🍪 Подробная документация по работе с cookies
- **[COOKIES-MIGRATION.md](./COOKIES-MIGRATION.md)** - 🔄 Миграция клиентского кода на cookies

## 🔑 API Endpoints

### Публичные

```http
POST /users/register
POST /users/login
POST /users/refresh   # refreshToken из cookie
POST /users/logout    # Удаляет cookie
```

### Защищённые (требуют `Authorization: Bearer {accessToken}`)

```http
GET  /users/me
GET  /users
GET  /users/:id
POST /users/logout-all
```

## 💻 Пример использования

```javascript
// 1. Логин
const response = await fetch('http://localhost:3000/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ← ВАЖНО! Для cookies
  body: JSON.stringify({ username: 'test', password: 'test1234' })
})

const { accessToken, user } = await response.json()
// refreshToken автоматически в cookie

// 2. API запрос
const profile = await fetch('http://localhost:3000/users/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
  credentials: 'include'
})

// 3. Обновление токена (когда access истёк)
const refresh = await fetch('http://localhost:3000/users/refresh', {
  method: 'POST',
  credentials: 'include' // Cookie отправится автоматически
})

const { accessToken: newToken } = await refresh.json()

// 4. Выход
await fetch('http://localhost:3000/users/logout', {
  method: 'POST',
  credentials: 'include' // Cookie будет удалён
})
```

Подробнее в **[COOKIES-USAGE.md](./COOKIES-USAGE.md)**

## 🛠️ Технологии

- **Bun** - JavaScript runtime
- **Hono** - Веб-фреймворк
- **PostgreSQL** - База данных
- **JWT** - Токены аутентификации
- **Argon2** - Хеширование паролей
- **httpOnly Cookies** - Безопасное хранение refresh токенов

## 📦 Структура

```
src/
├── db/          # База данных и миграции
├── handlers/    # HTTP обработчики
├── middlewares/ # Auth middleware
├── routes/      # Определение роутов
├── services/    # Бизнес-логика
├── types/       # TypeScript типы
├── utils/       # Утилиты
└── main.ts      # Точка входа
```

## 🔒 Безопасность

✅ **Защита от XSS:** Refresh токен в httpOnly cookie  
✅ **Защита от CSRF:** SameSite=Strict  
✅ **Короткие access токены:** 15 минут  
✅ **Отзыв сессий:** Refresh токены в БД  
✅ **Argon2:** Безопасное хеширование паролей
