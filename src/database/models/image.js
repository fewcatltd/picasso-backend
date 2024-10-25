import { Model } from 'sequelize';
import hash from 'object-hash';

export function define(sequelize, DataTypes, redis) {
    class Image extends Model {
        static associate(models) {
            // Определите связи, если они нужны
        }

        static async findOne(options) {
            const key = `image:findOne:${hash(options.where)}`;
            const cachedData = await redis.get(key);

            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                return Image.build(parsedData, { isNewRecord: false });
            }

            const result = await super.findOne({where: options.where});

            if (result) {
                await redis.set(key, JSON.stringify(result.toJSON()), 'EX', 60); // Кэшируем результат на 60 секунд
            }

            return result;
        }

        static async findAll(options) {
            const key = `image:findAll:${JSON.stringify(options.where)}`;
            const cachedData = await redis.get(key);

            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                return parsedData.map(data => Image.build(data, { isNewRecord: false }));
            }

            const results = await super.findAll(options);

            if (results && results.length > 0) {
                await redis.set(key, JSON.stringify(results.map(r => r.toJSON())), 'EX', 60); // Кэшируем результат на 60 секунд
            }

            return results;
        }

        static async findByPk(pk, options) {
            const key = `image:findByPk:${pk}`;
            const cachedData = await redis.get(key);

            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                return Image.build(parsedData, { isNewRecord: false });
            }

            const result = await super.findByPk(pk, options);

            if (result) {
                await redis.set(key, JSON.stringify(result.toJSON()), 'EX', 60); // Кэшируем результат на 60 секунд
            }

            return result;
        }
    }

    Image.init(
        {
            id: {
                type: DataTypes.STRING(256),
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            url: {
                type: DataTypes.STRING(256),
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING(256),
                allowNull: false,
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
