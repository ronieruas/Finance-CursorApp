'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('incomes', 'recurrence_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('incomes', 'recurrence_frequency', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('incomes', 'recurrence_interval', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });

    await queryInterface.addColumn('incomes', 'recurrence_until', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      "UPDATE incomes SET recurrence_frequency = 'monthly' WHERE is_recurring = true AND (recurrence_frequency IS NULL OR recurrence_frequency = '');"
    );

    await queryInterface.sequelize.query(
      'UPDATE incomes SET recurrence_interval = 1 WHERE is_recurring = true AND (recurrence_interval IS NULL OR recurrence_interval < 1);'
    );

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        WITH roots AS (
          SELECT MIN(id) AS root_id,
                 user_id,
                 account_id,
                 description,
                 COALESCE(category, '') AS category,
                 value
          FROM incomes
          WHERE is_recurring = true
          GROUP BY user_id, account_id, description, COALESCE(category, ''), value
        )
        UPDATE incomes i
        SET recurrence_id = r.root_id
        FROM roots r
        WHERE i.is_recurring = true
          AND (i.recurrence_id IS NULL)
          AND i.user_id = r.user_id
          AND i.account_id = r.account_id
          AND i.description = r.description
          AND COALESCE(i.category, '') = r.category
          AND i.value = r.value;
      `);
    } else {
      await queryInterface.sequelize.query(
        'UPDATE incomes SET recurrence_id = id WHERE is_recurring = 1 AND recurrence_id IS NULL;'
      );
    }

    await queryInterface.addIndex('incomes', ['recurrence_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('incomes', ['recurrence_id']);
    await queryInterface.removeColumn('incomes', 'recurrence_until');
    await queryInterface.removeColumn('incomes', 'recurrence_interval');
    await queryInterface.removeColumn('incomes', 'recurrence_frequency');
    await queryInterface.removeColumn('incomes', 'recurrence_id');
  },
};

