import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/databases';

export class Poliklinik extends Model {
  public kd_poli!: string;
  public nm_poli!: string | null;
  public registrasi!: number;
  public registrasilama!: number;
  public status!: '0' | '1';
}

Poliklinik.init({
  kd_poli: {
    type: DataTypes.CHAR(5),
    primaryKey: true,
    allowNull: false,
  },
  nm_poli: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  registrasi: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  registrasilama: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Poliklinik',
  tableName: 'poliklinik',
  timestamps: false,
});
