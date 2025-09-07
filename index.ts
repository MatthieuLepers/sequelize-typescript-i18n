import { SequelizeI18n } from '@/index';
import { Article } from './test/Article';

(async () => {
  const sequelize = new SequelizeI18n({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    models: [Article],
  });

  await sequelize.sync();
  await sequelize.close();
})();
