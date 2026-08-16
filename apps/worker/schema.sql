CREATE TABLE IF NOT EXISTS chat_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_number TEXT NOT NULL,
  direction TEXT NOT NULL,
  message_text TEXT,
  command TEXT,
  status TEXT,
  latency_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_sender ON chat_logs(sender_number);
CREATE INDEX IF NOT EXISTS idx_chat_logs_date ON chat_logs(created_at);

CREATE TABLE IF NOT EXISTS daily_metrics (
  date TEXT PRIMARY KEY,
  unique_senders_count INTEGER DEFAULT 0,
  total_inbound INTEGER DEFAULT 0,
  total_outbound INTEGER DEFAULT 0
);
