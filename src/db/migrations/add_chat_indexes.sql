-- Миграция: добавление индексов для оптимизации запросов чатов
-- Дата: 2026-01-08

-- Индексы для таблицы chat_members
-- Ускоряет поиск всех чатов пользователя
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);

-- Ускоряет поиск всех участников чата
CREATE INDEX IF NOT EXISTS idx_chat_members_chat_id ON chat_members(chat_id);

-- Индексы для таблицы messages
-- Ускоряет получение сообщений чата
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);

-- Ускоряет поиск сообщений отправителя
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Составной индекс для оптимизации запроса последнего сообщения
-- (chat_id, is_deleted, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_messages_chat_last ON messages(chat_id, is_deleted, created_at DESC);

-- Индекс для таблицы chats
-- Ускоряет сортировку по updated_at
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);

-- Индекс для поиска приватных чатов
CREATE INDEX IF NOT EXISTS idx_chats_chat_type ON chats(chat_type);
