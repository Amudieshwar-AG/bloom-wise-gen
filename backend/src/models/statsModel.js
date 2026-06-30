const db = require('../db/database');

const getStats = () => {
  const stmt = db.prepare('SELECT * FROM usage_stats WHERE id = 1');
  return stmt.get();
};

const incrementPdfUploads = () => {
  db.prepare('UPDATE usage_stats SET total_pdfs = total_pdfs + 1 WHERE id = 1').run();
};

const incrementGenerations = () => {
  db.prepare('UPDATE usage_stats SET total_generated = total_generated + 1 WHERE id = 1').run();
};

const incrementExports = () => {
  db.prepare('UPDATE usage_stats SET total_exports = total_exports + 1 WHERE id = 1').run();
};

const addTokens = (tokens) => {
  db.prepare('UPDATE usage_stats SET total_tokens = total_tokens + ? WHERE id = 1').run(tokens);
};

module.exports = {
  getStats,
  incrementPdfUploads,
  incrementGenerations,
  incrementExports,
  addTokens
};
