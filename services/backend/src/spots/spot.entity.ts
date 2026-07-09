import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// app.spots。geom は PostGIS geography(Point,4326)。
// geom の読み書きは ST_ 関数を使う raw SQL 側で行うため、ここでは列の存在のみ宣言する。
@Entity({ schema: 'app', name: 'spots' })
export class Spot {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column('text')
  name!: string;

  @Column('text')
  category!: string;

  @Column('text')
  address!: string;

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  geom!: unknown;
}
