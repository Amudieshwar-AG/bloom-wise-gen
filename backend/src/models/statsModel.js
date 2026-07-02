const db = require('../db/database');

const getStats = () => {
  const stmt = db.prepare('SELECT * FROM usage_stats WHERE id = 1');
  const stats = stmt.get();
  
  if (stats) {
    stats.average_generation_time = stats.total_generated > 0 
      ? Math.round(stats.total_generation_time_ms / stats.total_generated / 1000) 
      : 0;
  }
  return stats;
};

const incrementPdfUploads = () => {
  db.prepare('UPDATE usage_stats SET total_pdfs = total_pdfs + 1 WHERE id = 1').run();
};

const incrementGenerations = (timeMs = 0) => {
  db.prepare('UPDATE usage_stats SET total_generated = total_generated + 1, total_generation_time_ms = total_generation_time_ms + ? WHERE id = 1').run(timeMs);
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
