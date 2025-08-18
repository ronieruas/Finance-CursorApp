#!/usr/bin/env node

/**
 * Normaliza a coluna paid_at da tabela expenses removendo o componente de hora,
 * mantendo apenas a data (define para 00:00:00 do dia correspondente).
 *
 * Banco: Postgres
 * Conexão: usa as variáveis de ambiente (DB_HOST, DB_PORT, DB_USER, DB_PASS/DB_PASSWORD, DB_NAME)
 *
 * Modo de uso:
 *  - Dry-run (padrão):
 *      node scripts/normalize_paid_at.js
 *  - Aplicar mudanças:
 *      node scripts/normalize_paid_at.js --apply
 *
 * Observações de segurança:
 *  - Recomenda-se executar backup antes de aplicar.
 *  - A operação roda em transação e apenas atualiza registros com paid_at não nulo e cujo horário != 00:00:00.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const sequelize = require('../src/config/database');

function printConnectionInfo() {
  const info = {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    timezone: process.env.TZ || 'America/Sao_Paulo'
  };
  console.log('Conexão alvo (sem credenciais sensíveis):');
  console.table(info);

  const missing = Object.entries({
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASS_or_DB_PASSWORD: process.env.DB_PASS || process.env.DB_PASSWORD
  }).filter(([k, v]) => !v).map(([k]) => k);

  if (missing.length) {
    console.warn('Atenção: variáveis de ambiente ausentes:', missing.join(', '));
    console.warn('Defina-as no ambiente ou em backend/.env antes de executar.');
  }
}

async function normalizePaidAt(apply = false) {
  printConnectionInfo();

  await sequelize.authenticate();

  // Verifica quantidade de registros afetáveis
  const [countRows] = await sequelize.query(`
    SELECT COUNT(*)::int AS total
    FROM expenses
    WHERE paid_at IS NOT NULL
      AND (paid_at::time) <> '00:00:00'
  `);
  const total = countRows[0]?.total || 0;

  console.log(`Registros com paid_at contendo horário (diferente de 00:00:00): ${total}`);

  // Mostra amostra
  if (total > 0) {
    const [sample] = await sequelize.query(`
      SELECT id, paid_at, (paid_at::date) AS normalized_date
      FROM expenses
      WHERE paid_at IS NOT NULL AND (paid_at::time) <> '00:00:00'
      ORDER BY paid_at DESC
      LIMIT 5
    `);
    console.log('Amostra (antes => depois):');
    for (const row of sample) {
      console.log(`  id=${row.id} | ${row.paid_at} => ${row.normalized_date}`);
    }
  }

  if (!apply) {
    console.log('\nDry-run: nenhuma alteração aplicada. Para aplicar, execute com --apply');
    await sequelize.close();
    return;
  }

  console.log('\nAplicando normalização (definindo paid_at = paid_at::date)...');
  const t = await sequelize.transaction();
  try {
    // Atualiza apenas quando necessário
    await sequelize.query(`
      UPDATE expenses
      SET paid_at = paid_at::date
      WHERE paid_at IS NOT NULL
        AND (paid_at::time) <> '00:00:00'
    `, { transaction: t });

    await t.commit();
    console.log('Normalização concluída com sucesso.');

    const [postCountRows] = await sequelize.query(`
      SELECT COUNT(*)::int AS remaining
      FROM expenses
      WHERE paid_at IS NOT NULL
        AND (paid_at::time) <> '00:00:00'
    `);
    const remaining = postCountRows[0]?.remaining || 0;
    console.log(`Registros ainda com horário diferente de 00:00:00 após a normalização: ${remaining}`);
  } catch (err) {
    await t.rollback();
    console.error('Erro ao aplicar normalização. Transação revertida.');
    console.error(err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

const apply = process.argv.includes('--apply');
normalizePaidAt(apply).catch(err => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});