// Script de reparo de encoding (mojibake) em colunas de texto
// Executa substituições comuns de sequências corrompidas para caracteres corretos
// Uso: node src/scripts/repairEncoding.js

const { Sequelize } = require('sequelize');

// Mapeamento de sequências típicas de mojibake -> caracteres corretos
// Foco em português e símbolos comuns
const REPLACEMENTS = [
  ['Ã¡', 'á'], ['Ã¢', 'â'], ['Ã£', 'ã'], ['Ã¤', 'ä'], ['Ã ', 'à'], ['Ãª', 'ê'], ['Ã©', 'é'], ['Ã¨', 'è'], ['Ã­', 'í'], ['Ã¯', 'ï'],
  ['Ã³', 'ó'], ['Ã´', 'ô'], ['Ãµ', 'õ'], ['Ã¶', 'ö'], ['Ãº', 'ú'], ['Ã¼', 'ü'], ['Ã§', 'ç'],
  ['ÃÁ', 'Á'], ['ÃÂ', 'Â'], ['ÃÃ', 'Ã'], ['ÃÄ', 'Ä'], ['ÃÀ', 'À'], ['ÃÊ', 'Ê'], ['ÃÉ', 'É'], ['ÃÈ', 'È'], ['ÃÍ', 'Í'], ['ÃÏ', 'Ï'],
  ['ÃÓ', 'Ó'], ['ÃÔ', 'Ô'], ['ÃÕ', 'Õ'], ['ÃÖ', 'Ö'], ['ÃÚ', 'Ú'], ['ÃÜ', 'Ü'], ['ÃÇ', 'Ç'],
  // Espaço não quebrável convertido incorretamente
  ['Â\s', ' '], ['Â ', ' '],
  // Aspas e traços
  ['â€“', '–'], ['â€”', '—'], ['â€œ', '“'], ['â€\x9d', '”'], ['â€˜', '‘'], ['â€™', '’'],
  // Pontos e símbolos
  ['â€¢', '•'], ['â‚¬', '€']
];

// Expressões para localizar linhas suspeitas
const SUSPECT_REGEX = "(Ã.|â.|Â)";

function buildReplaceSQL(column) {
  // Constrói REPLACE encadeado: REPLACE(REPLACE(col,'a','b'),'c','d')...
  return REPLACEMENTS.reduce((expr, [from, to]) => {
    // Alguns padrões têm metacaracteres, usamos regexp_replace quando apropriado
    const useRegexp = from.includes('\\x') || /\\s/.test(from);
    if (useRegexp) {
      return `regexp_replace(${expr}, '${from}', '${to}', 'g')`;
    }
    return `REPLACE(${expr}, '${from}', '${to}')`;
  }, column);
}

async function main() {
  const db = new Sequelize(process.env.DB_NAME || 'finance', process.env.DB_USER || 'finance', process.env.DB_PASSWORD || 'finance123', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    dialect: 'postgres',
    logging: false,
  });

  await db.authenticate();

  // Contar linhas suspeitas antes
  const [preExpenses] = await db.query(`SELECT COUNT(*)::int AS c FROM expenses WHERE description ~ '${SUSPECT_REGEX}'`);
  const [preAccounts] = await db.query(`SELECT COUNT(*)::int AS c FROM accounts WHERE name ~ '${SUSPECT_REGEX}'`);

  console.log(`Suspeitos antes — expenses: ${preExpenses[0].c}, accounts: ${preAccounts[0].c}`);

  // Atualizar apenas linhas que batem com regex suspeita
  const expExpr = buildReplaceSQL('description');
  const accExpr = buildReplaceSQL('name');

  const [expUpdate] = await db.query(`UPDATE expenses SET description = ${expExpr} WHERE description ~ '${SUSPECT_REGEX}'`);
  const [accUpdate] = await db.query(`UPDATE accounts SET name = ${accExpr} WHERE name ~ '${SUSPECT_REGEX}'`);

  // Contar linhas suspeitas depois
  const [postExpenses] = await db.query(`SELECT COUNT(*)::int AS c FROM expenses WHERE description ~ '${SUSPECT_REGEX}'`);
  const [postAccounts] = await db.query(`SELECT COUNT(*)::int AS c FROM accounts WHERE name ~ '${SUSPECT_REGEX}'`);

  console.log(`Suspeitos depois — expenses: ${postExpenses[0].c}, accounts: ${postAccounts[0].c}`);

  await db.close();
}

main().catch((err) => {
  console.error('Falha ao reparar encoding:', err);
  process.exit(1);
});