import {
  Sequelize,
  DataType,
  Column as STColumn,
  Table as STTable,
  type TableOptions,
  ModelCtor,
  SequelizeOptions,
} from 'sequelize-typescript';
import { type DataType as SDatatype, DataTypes, type ModelAttributeColumnOptions } from 'sequelize';
import 'reflect-metadata';

export type I18nColumnOptions = Partial<ModelAttributeColumnOptions> & { i18n?: boolean };

export type I18nTableOptions = TableOptions & { i18n?: boolean };

export function Table(options: I18nTableOptions) {
  return function (target: any) {
    Reflect.defineMetadata('i18n', options.i18n, target);
    return STTable(options)(target);
  };
}

export function Column(dataOrOptions?: SDatatype | I18nColumnOptions) {
  return function (target: any, propertyKey: string) {
    let finalOptions: SDatatype | I18nColumnOptions = {};

    if (typeof dataOrOptions === 'object') {
      finalOptions = dataOrOptions;
    } else {
      finalOptions = { type: dataOrOptions as SDatatype };
    }

    if ('i18n' in finalOptions) {
      Reflect.defineMetadata('i18n-column', true, target, propertyKey);
    }

    STColumn({
      ...finalOptions,
      type: 'type' in finalOptions ? finalOptions.type : DataType.STRING,
    })(target, propertyKey);
  };
}

function createI18nModels(sequelize: Sequelize, models: ModelCtor[]) {
  const i18nModels: ModelCtor[] = [];

  const extractI18nAttributes = (model: ModelCtor) => {
    const attributesMeta = model.getAttributes();
    const i18nAttrs: Record<string, any> = {};

    for (const [key, value] of Object.entries(attributesMeta)) {
      if (Reflect.getMetadata('i18n-column', model.prototype, key)) {
        i18nAttrs[key] = {
          type: (value as any)?.type?.key ? (value as any).type : DataTypes.STRING,
          allowNull: true,
        };
      }
    }

    return { i18nAttrs, attributesMeta };
  };

  for (const model of models) {
    if (!Reflect.getMetadata('i18n', model)) continue;

    const { i18nAttrs, attributesMeta } = extractI18nAttributes(model);

    if (Object.keys(i18nAttrs).length === 0) continue;

    // PK
    const pkEntry = Object.entries(attributesMeta).find(([, v]) => (v as any)?.primaryKey);
    const pkName = pkEntry ? pkEntry[0] : 'id';
    const pkType = pkEntry ? (pkEntry[1] as any)?.type : DataTypes.INTEGER;

    // Known fields
    i18nAttrs.locale = { type: DataTypes.STRING, allowNull: false };
    const fkName = `${model.options.name.singular}Id`; // TODO: model.name is pluralized
    i18nAttrs[fkName] = {
      type: (pkType as any)?.key ? pkType : DataTypes.INTEGER,
      allowNull: false,
      references: { model, key: pkName },
    };

    const modelName = `${model.options.name.singular}I18n`;
    const tableName = model.options?.underscored ?? false
      ? `${model.tableName}_i18n`
      : `${model.tableName}I18n`
    ;
    const i18nModel = sequelize.define(`${model.options.name.plural}I18n`, i18nAttrs, {
      tableName,
      indexes: [
        { unique: true, fields: [fkName, 'locale'] },
      ],
      timestamps: model.options?.timestamps ?? true,
      underscored: model.options?.underscored ?? false,
      paranoid: model.options?.paranoid ?? false,
    });

    // Dynamic model
    Object.defineProperty(i18nModel, 'name', { value: modelName });

    // Relations
    model.hasMany(i18nModel, {
      foreignKey: fkName,
      as: 'i18n',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    i18nModel.belongsTo(model, { foreignKey: fkName, as: model.name });

    // Instance helpers
    Object.defineProperties(model.prototype, {
      getI18n: {
        async value(locale: string, field?: string) {
          const pkVal = this.get ? this.get(pkName) : this[pkName];
          const where = { [fkName]: pkVal, locale };
          const row = await i18nModel.findOne({ where });
          if (!row) return null;
          return (field && row.get && row.get(field)) || row[field] || row;
        },
        enumerable: false,
      },
      setI18n: {
        async value(
          locale: string,
          valuesOrField: Record<string, any> | string,
          maybeValue?: any,
        ) {
          const values = typeof valuesOrField === 'string'
            ? { [valuesOrField]: maybeValue }
            : valuesOrField
          ;

          const pkVal = this.get ? this.get(pkName) : this[pkName];
          const where = { [fkName]: pkVal, locale };

          const [row, created] = await i18nModel.findOrCreate({
            where,
            defaults: { ...values, [fkName]: pkVal, locale },
          });

          if (!created) await row.update(values);

          const included = this.i18n as any[] | undefined;
          if (Array.isArray(included)) {
            const idx = included.findIndex((t) => t?.locale === locale);
            if (idx >= 0) included[idx] = row;
            else included.push(row);

            if (this.set) this.set('i18n', included);
            else this.i18n = included;
          }

          return row;
        },
        enumerable: false,
      },
    });

    i18nModels.push(i18nModel as ModelCtor);
  }

  return i18nModels;
}

export interface SequelizeI18nOptions extends SequelizeOptions {
  models: ModelCtor[];
}

export class SequelizeI18n extends Sequelize {
  constructor(options: SequelizeI18nOptions) {
    super(options);
    createI18nModels(this, options.models);
  }
}

declare module 'sequelize-typescript' {
  interface Model {
    getI18n?(locale: string, field?: string): Promise<any>;
    setI18n?(
      locale: string,
      valuesOrField: Record<string, any> | string,
      maybeValue?: any
    ): Promise<any>;
  }
}
