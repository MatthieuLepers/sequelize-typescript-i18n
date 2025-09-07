# Sequelize Typescript I18n

A lightweight utility to add internationalization (i18n) support to Sequelize models. This library simplifies the creation, retrieval, and management of localized fields by automatically handling associations between your base models and their translation tables.

## Features

* Easy setup for i18n support on any Sequelize model.
* Automatic generation of associations (`hasMany` / `belongsTo`).
* Magic methods for translations (e.g., `getI18n`, `setI18n`).
* Support for `include: ['i18n']` when creating or fetching records.
* Fully typed when using TypeScript.

---

## Installation

```bash
npm install sequelize-typescript-i18n
```

---

## Usage

### 1. Model definition

```ts
// <root>/models/Article.ts

import {
  AutoIncrement,
  DataType,
  Model,
  PrimaryKey,
} from 'sequelize-typescript';
import { Table, Column } from 'sequelize-typescript-i18n';

@Table({
  modelName: 'articles',
  i18n: true,
})
export class Article extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    i18n: true,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    i18n: true,
  })
  declare content: string;

  // Required if you need to access i18n rows
  declare i18n: any[];
}
```

### 2. Initialization

```ts
import { SequelizeI18n } from 'sequelize-typescript-i18n';

import * as models from '<root>/models';

const sequelize = new SequelizeI18n({
  /* options */
  models,
});

await sequelize.sync();
```

### 3. Create Records with Translations

```ts
await Article.create(
  {
    i18n: [
      {
        locale: 'en',
        title: 'My first article',
        content: 'Hello world',
      },
      {
        locale: 'fr',
        title: 'Mon premier article',
        content: 'Bonjour le monde',
      },
    ],
  },
  { include: ['i18n'] },
);
```

### 4. Retrieve and Update Translations

```ts
const article = await Article.findOne({ include: ['i18n'] });

// Get a specific translation
const titleFR = await article.getI18n('fr', 'title'); // 'Mon premier article'

// Update or create a translation
await article.setI18n('en', { title: 'Updated title' });
```

---

## Contributing

Contributions are welcome! Here’s how you can help:

1. **Fork and clone** the repository.
2. **Install dependencies:**

   ```bash
   npm install
   ```
3. **Run tests:**

   ```bash
   npm run test
   ```
4. **Open a pull request** describing your changes.

### Guidelines

* Keep PRs focused and well documented.
* Ensure tests pass and add new tests for new features.
* Follow the coding style used in the repo.

---

## Roadmap

* [ ] Better typing for `i18n` association field in base classes
* [ ] Custom `addModels` for SequelizeI18n instance

---

## License

ISC
