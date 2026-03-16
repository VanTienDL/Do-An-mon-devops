CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Seed data for quick local testing
INSERT INTO users (name, email, password)
VALUES ('Demo User', 'demo@example.com', 'password123')
ON CONFLICT (email) DO NOTHING;
