/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, {DataTypes}) {
        await queryInterface.createTable(
            {
                schema: 'picasso',
                tableName: 'images',
            },
            {
                id: {
                    type: DataTypes.STRING(256),
                    primaryKey: true,
                    allowNull: false,
                },
                url: {
                    type: DataTypes.STRING(256),
                    allowNull: true,
                },
                title: {
                    type: DataTypes.STRING(256),
                    allowNull: false,
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: queryInterface.sequelize.literal('NOW()'),
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: queryInterface.sequelize.literal('NOW()'),
                },
            },
        )
    },

    async down(queryInterface, _) {
        await queryInterface.dropTable({
            schema: 'picasso',
            tableName: 'images',
        })
    },
}
