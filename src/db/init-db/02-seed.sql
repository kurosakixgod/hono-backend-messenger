-- Тестовые данные для разработки

-- Создание тестовых пользователей
INSERT INTO users (username, password_hash, display_name, status) VALUES
('john_doe', '$argon2id$v=19$m=65536,t=3,p=4$testHash1', 'Джон Доу', 'online'),
('jane_smith', '$argon2id$v=19$m=65536,t=3,p=4$testHash2', 'Джейн Смит', 'online'),
('bob_wilson', '$argon2id$v=19$m=65536,t=3,p=4$testHash3', 'Боб Уилсон', 'offline')
ON CONFLICT (username) DO NOTHING;

-- Создание тестового приватного чата
INSERT INTO chats (name, chat_type) VALUES
('Приватный чат', 'private'),
('Рабочая группа', 'group')
ON CONFLICT DO NOTHING;

-- Добавление участников в чаты
INSERT INTO chat_members (chat_id, user_id, role) VALUES
(1, 1, 'member'),
(1, 2, 'member'),
(2, 1, 'admin'),
(2, 2, 'member'),
(2, 3, 'member')
ON CONFLICT (chat_id, user_id) DO NOTHING;

-- Создание тестовых сообщений
INSERT INTO messages (chat_id, sender_id, content, message_type) VALUES
(1, 1, 'Привет! Как дела?', 'text'),
(1, 2, 'Отлично! А у тебя?', 'text'),
(1, 1, 'Тоже всё хорошо, спасибо!', 'text'),
(2, 1, 'Добро пожаловать в рабочую группу!', 'text'),
(2, 2, 'Спасибо за приглашение!', 'text'),
(2, 3, 'Привет всем!', 'text')
ON CONFLICT DO NOTHING;


