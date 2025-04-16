const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');


const Debt = sequelize.define('Debt', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pendente', 'agendado', 'pago'),
      defaultValue: 'pendente'
    }
  }, {
    tableName: 'debts'
  });
  
// Relacionamento: Um para muitos - usuário pode ter muitas dívidas
User.hasMany(Debt, { foreignKey: 'userId' });
Debt.belongsTo(User, { foreignKey: 'userId' });
  
module.exports = Debt;