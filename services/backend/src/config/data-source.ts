import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Spot } from '../spots/spot.entity';
import { CreateSpots1720500000000 } from '../migrations/1720500000000-CreateSpots';

// TypeORM 設定。Nest(TypeOrmModule) と CLI(typeorm migration:*) の両方で共有する。
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Spot],
  migrations: [CreateSpots1720500000000],
  synchronize: false,
  logging: false,
};

export default new DataSource(dataSourceOptions);
