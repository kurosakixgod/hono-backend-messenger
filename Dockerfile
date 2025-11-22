# Используем официальный образ Bun
FROM oven/bun:1 AS base
WORKDIR /app

# Устанавливаем зависимости
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Копируем node_modules из временной директории
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Финальный образ
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY . .

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["bun", "run", "src/index.ts"]
