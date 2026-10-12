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

// Primary key di Khanza adalah gabungan (kd_dokter, hari_kerja, jam_mulai):
// satu dokter bisa punya banyak jadwal.
Jadwal.init({
  kd_dokter: {
    type: DataTypes.STRING(20),
    allowNull: false,
    primaryKey: true
  },
  hari_kerja: {
    type: DataTypes.ENUM('SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU','AKHAD'),
    allowNull: false,
    primaryKey: true
  },
  jam_mulai: {
    type: DataTypes.TIME,
    allowNull: false,
    primaryKey: true
  },
  jam_selesai: DataTypes.TIME,
  kd_poli: DataTypes.CHAR(5),
  kuota: DataTypes.INTEGER,
}, {
  sequelize,
  tableName: 'jadwal',
  timestamps: false
});
