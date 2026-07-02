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
`);

// Simple migration for existing database: add column if missing
try {
  db.exec('ALTER TABLE usage_stats ADD COLUMN total_generation_time_ms INTEGER DEFAULT 0;');
} catch (e) {
  // Ignore error if column already exists
}

// Now initialize usage stats row if not exists
db.exec(`
  INSERT OR IGNORE INTO usage_stats (id, total_pdfs, total_generated, total_exports, total_tokens, total_generation_time_ms)
  VALUES (1, 0, 0, 0, 0, 0);
`);

module.exports = db;
