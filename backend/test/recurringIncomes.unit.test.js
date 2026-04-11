const test = require('node:test');
const assert = require('node:assert/strict');

const { nextOccurrenceAfter } = require('../src/services/recurringIncomes');

test('nextOccurrenceAfter monthly mantém o dia do mês e é estritamente após a data de corte', () => {
  assert.equal(nextOccurrenceAfter('2026-01-05', 'monthly', 1, '2026-02-01'), '2026-02-05');
  assert.equal(nextOccurrenceAfter('2026-01-05', 'monthly', 1, '2026-02-05'), '2026-03-05');
});

test('nextOccurrenceAfter weekly respeita intervalo', () => {
  assert.equal(nextOccurrenceAfter('2026-01-01', 'weekly', 1, '2026-01-03'), '2026-01-08');
  assert.equal(nextOccurrenceAfter('2026-01-01', 'weekly', 2, '2026-01-03'), '2026-01-15');
});

test('nextOccurrenceAfter daily respeita intervalo', () => {
  assert.equal(nextOccurrenceAfter('2026-01-01', 'daily', 2, '2026-01-02'), '2026-01-03');
  assert.equal(nextOccurrenceAfter('2026-01-01', 'daily', 2, '2026-01-03'), '2026-01-05');
});

