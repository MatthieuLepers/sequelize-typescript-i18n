import type { TableOptions, Sequelize } from 'sequelize-typescript';
import type { DataType, ModelAttributeColumnOptions } from 'sequelize';

export type I18nColumnOptions = Partial<ModelAttributeColumnOptions> & { i18n?: boolean };

export type I18nTableOptions = TableOptions & { i18n?: boolean };

export function Table(options: I18nTableOptions): Function;

export function Column(dataType: DataType): Function;

export function Column(options: I18nColumnOptions): Function;

export function registerI18nModels(sequelize: Sequelize, models: any[]): void;
