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
                    type: DataTypes.UUID(),
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: queryInterface.sequelize.literal('uuid_generate_v4()'),
                },
                title: {
                    type: DataTypes.STRING(256),
                    allowNull: false,
                },
                giphy_id: {
                    type: DataTypes.STRING(64),
                    allowNull: false,
                },
                width: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                height: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                format: {
                    type: DataTypes.STRING(4),
                    allowNull: false,
                },
                type: {
                    type: DataTypes.STRING(128),
                    allowNull: false,
                },
                s3_url: {
                    type: DataTypes.STRING(256),
                    allowNull: true,
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
            {
                indexes: [
                    {
                        fields: ['created_at', 'format', 'width', 'height'],
                    },
                    {fields: ['created_at']},
                    {fields: ['width']},
                    {fields: ['height']},
                    {fields: ['format']},
                ],
            }
        )
    },

    async down(queryInterface, _) {
        await queryInterface.dropTable({
            schema: 'picasso',
            tableName: 'images',
        })
    },
}
