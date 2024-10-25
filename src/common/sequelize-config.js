import Config from './config.js'

/** @type {import('sequelize').Options} */
const sequelizeConfig = {
  ...Config.database,
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 5,
    min: 0,
    idle: 10000,
    acquire: 60000,
  },
  dialect: 'postgres',
  define: {
    timestamps: true,
    underscored: true,
  },
  logging: false,
};

export default sequelizeConfig;

export const config = sequelizeConfig;
