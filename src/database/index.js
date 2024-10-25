import { Sequelize } from 'sequelize';
import cls from 'cls-hooked';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (config, redis) => {
    const namespace = cls.createNamespace('database');
    Sequelize.useCLS(namespace);

    const sequelize = new Sequelize(config);
    const db = {};

    const modelsPath = path.join(__dirname, 'models');

    // Загрузка всех моделей
    const modelFiles = fs
        .readdirSync(modelsPath)
        .filter(
            file =>
                file.indexOf('.') !== 0 &&
                file.slice(-3) === '.js' &&
                file.indexOf('.test.js') === -1
        );

    for (const file of modelFiles) {
        // Дожидаемся импорта файла с использованием pathToFileURL
        const modelModule = await import(pathToFileURL(path.join(modelsPath, file)));
        const { define, associate } = modelModule;

        if (typeof define !== 'function') {
            throw new Error(`Model file ${file} does not export a 'define' function`);
        }

        const schema = define(sequelize, Sequelize.DataTypes, redis);
        if (associate) {
            schema.associate = associate;
        }
        db[schema.name] = schema;
    }

    // Вызов метода associate для каждой модели
    Object.keys(db).forEach(modelName => {
        if (db[modelName].associate) {
            db[modelName].associate(db, sequelize, Sequelize.DataTypes);
        }
    });

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    return db;
};
