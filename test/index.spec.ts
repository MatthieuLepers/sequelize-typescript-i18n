import { SequelizeI18n } from '@/index';
import { Article } from './Article';

describe('sequelize-i18n', () => {
  let sequelize: SequelizeI18n;

  beforeAll(async () => {
    sequelize = new SequelizeI18n({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      models: [Article],
    });

    await sequelize.sync();
  });

  it('should create i18n table and relations', async () => {
    const tables = await sequelize.getQueryInterface().showAllTables();
    expect(tables).toEqual(expect.arrayContaining(['articles', 'articlesI18n']));

    const article = await Article.create({});
    expect(article.id).toBe(1);
  });

  test('getI18n should be accessible from base model', async () => {
    const article = await Article.create({
      i18n: [
        { locale: 'fr', title: 'Test FR' },
        { locale: 'en', title: 'Test EN' },
      ],
    }, { include: ['i18n'] });

    expect(await article.getI18n('fr', 'title')).toEqual('Test FR');
    expect(await article.getI18n('en', 'title')).toEqual('Test EN');
  });

  test('setI18n should be accessible from base model', async () => {
    const article = await Article.create({});
    await article.setI18n('fr', { title: 'Test FR' });

    expect(await article.getI18n('fr', 'title')).toEqual('Test FR');
    expect(await article.getI18n('en', 'title')).toBeNull();
  });

  it('should destroys ArticleI18n rows when Article row is destroyed', async () => {
    const article = await Article.create({
      i18n: [
        { locale: 'fr', title: 'Test FR' },
        { locale: 'en', title: 'Test EN' },
      ],
    }, { include: ['i18n'] });

    await article.destroy();

    const i18nRows = await sequelize.models.articlesI18n.findAll({
      where: {
        articleId: article.id,
      },
    });

    expect(i18nRows.length).toBe(0);
  });
});
