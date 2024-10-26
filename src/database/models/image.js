import { Model } from 'sequelize';

export function define(sequelize, DataTypes, redis) {
    class Image extends Model {
        static associate(models) {}
    }

    Image.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                unique: true,
                defaultValue: sequelize.literal('uuid_generate_v4()')
            },
            title: {
                type: DataTypes.STRING(256),
                allowNull: false,
            },
            giphyId: {
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
            s3Url: {
                type: DataTypes.STRING(256),
                allowNull: true,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.literal('NOW()')
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.literal('NOW()')
            }
        },
        {
            sequelize,
            schema: 'picasso',
            tableName: 'images'
        }
    );

    return Image;
}
