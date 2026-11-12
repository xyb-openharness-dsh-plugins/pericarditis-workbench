-- 0002（只增不改）：运行时键值设置。data_root = 用户在面板里选的资料目录，
-- 优先于 cordis 的 config.root 默认值（目录还在时重开宿主仍生效）。
CREATE TABLE IF NOT EXISTS app_setting (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
