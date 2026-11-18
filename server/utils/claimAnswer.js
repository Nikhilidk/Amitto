const bcrypt = require('bcrypt'); 

// "  Black  Wallet " and "black wallet" should count as the same answer
const normalizeAnswer = (s) =>
  String(s).normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');

const hashAnswer = (answer) => bcrypt.hash(normalizeAnswer(answer), 10);

const checkAnswer = (answer, hash) =>
  bcrypt.compare(normalizeAnswer(answer), hash);

module.exports = { hashAnswer, checkAnswer };