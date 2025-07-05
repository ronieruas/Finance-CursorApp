require('dotenv').config({ path: './.env' });
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const hash = await bcrypt.hash(adminPass, 10);
      admin = await User.create({
        name: 'Administrador',
        email: adminEmail,
        password: hash,
        role: 'admin',
      });
      console.log('Usuário admin criado:', adminEmail);
    } else {
      console.log('Usuário admin já existe:', adminEmail);
    }
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar admin:', err);
    if (err.original) {
      console.error('Detalhe do erro original:', err.original);
    }
    process.exit(1);
  }
}

seedAdmin(); 