// Diagnóstico de encoding: detecta possíveis caracteres corrompidos (mojibake)
// Uso: BASE_URL opcional para testar endpoints; ou execute via node dentro do container
// node src/scripts/diagnoseEncoding.js

const { Sequelize, DataTypes } = require('sequelize');

async function main() {
  const db = new Sequelize(process.env.DB_NAME || 'finance', process.env.DB_USER || 'finance', process.env.DB_PASSWORD || 'finance123', {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
  });

  const Expense = db.define('Expense', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    description: { type: DataTypes.STRING },
    category: { type: DataTypes.STRING },
  }, { tableName: 'expenses', timestamps: false });

  const Account = db.define('Account', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    name: { type: DataTypes.STRING },
    currency: { type: DataTypes.STRING },
  }, { tableName: 'accounts', timestamps: false });

  await db.authenticate();

  function hasMojibake(s) {
    if (!s) return false;
    return /Ã|Â|â€”|â€“|â€œ|â€\u009d|â€™|\?|\ufffd/.test(s);
  }

  const badExpenses = await Expense.findAll({ limit: 50, order: [['id','DESC']] });
  const badE = badExpenses.filter(e => hasMojibake(e.description) || hasMojibake(e.category));
  const badAccounts = await Account.findAll({ limit: 50, order: [['id','DESC']] });
  const badA = badAccounts.filter(a => hasMojibake(a.name));

  console.log('Resumo diagnóstico:');
  console.log(`Expenses inspecionados: ${badExpenses.length}, suspeitos: ${badE.length}`);
  badE.slice(0,20).forEach(e => {
    console.log(`Expense ${e.id}: desc="${e.description}" cat="${e.category}"`);
  });
  console.log(`Accounts inspecionadas: ${badAccounts.length}, suspeitas: ${badA.length}`);
  badA.slice(0,20).forEach(a => {
    console.log(`Account ${a.id}: name="${a.name}"`);
  });

  await db.close();
}

main().catch(err => {
  console.error('Falha no diagnóstico:', err);
  process.exit(1);
});