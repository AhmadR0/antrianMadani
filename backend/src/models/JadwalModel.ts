import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/databases";

export class Jadwal extends Model {
  public kd_dokter!: string;
  public hari_kerja!: 'SENIN'|'SELASA'|'RABU'|'KAMIS'|'JUMAT'|'SABTU'|'AKHAD'|null;
  public jam_mulai!: string;
  public jam_selesai!: string;
  public kd_poli!: string;
  public kuota!: number;
}

Jadwal.init({
  kd_dokter: {
    type: DataTypes.STRING(20),
    allowNull: false,
    primaryKey: true
  },
  hari_kerja: DataTypes.ENUM('SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU','AKHAD'),
  jam_mulai: DataTypes.TIME,
  jam_selesai: DataTypes.TIME,
  kd_poli: DataTypes.CHAR(5),
  kuota: DataTypes.INTEGER,
}, {
  sequelize,
  tableName: 'jadwal',
  timestamps: false
});
