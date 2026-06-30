const db = require('../db/database');

const saveQuestionBank = (id, filename, config, questions) => {
  const stmt = db.prepare('INSERT INTO question_banks (id, filename, config, questions) VALUES (?, ?, ?, ?)');
  return stmt.run(id, filename, JSON.stringify(config), JSON.stringify(questions));
};

const getAllHistory = () => {
  const stmt = db.prepare('SELECT * FROM question_banks ORDER BY created_at DESC');
  const rows = stmt.all();
  return rows.map(row => ({
    ...row,
    config: JSON.parse(row.config),
    questions: JSON.parse(row.questions)
  }));
};

module.exports = {
  saveQuestionBank,
  getAllHistory
};
