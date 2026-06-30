const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS question_banks (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    config JSON NOT NULL,
    questions JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usage_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row exists
    total_pdfs INTEGER DEFAULT 0,
    total_generated INTEGER DEFAULT 0,
    total_exports INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0
  );

  -- Initialize usage stats row if not exists
  INSERT OR IGNORE INTO usage_stats (id, total_pdfs, total_generated, total_exports, total_tokens)
  VALUES (1, 0, 0, 0, 0);
`);

module.exports = db;
