const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('PR_lab2', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
});

const Book = sequelize.define('Book', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
});

(async () => {
    await sequelize.sync();
})();
