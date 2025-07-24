// src/models/Dokter.ts
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/databases';

export class Dokter extends Model {
    public kd_dokter!: string;
    public nm_dokter!: string | null;
    public jk!: 'L' | 'P' | null;
    public tmp_lahir!: string | null;
    public tgl_lahir!: Date | null;
    public gol_drh!: 'A' | 'B' | 'O' | 'AB' | '-' | null;
    public agama!: string | null;
    public almt_tgl!: string | null;
    public no_telp!: string | null;
    public email!: string;
    public stts_nikah!: 'BELUM MENIKAH' | 'MENIKAH' | 'JANDA' | 'DUDHA' | 'JOMBLO' | null;
    public kd_sps!: string | null;
    public alumni!: string | null;
    public no_ijn_praktek!: string | null;
    public status!: '0' | '1';

    // Optional: kalau kamu pakai timestamps
    // public readonly createdAt!: Date;
    // public readonly updatedAt!: Date;
}

Dokter.init(
    {
        kd_dokter: {
            type: DataTypes.STRING(20),
            primaryKey: true,
            allowNull: false,
        },
        nm_dokter: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        jk: {
            type: DataTypes.ENUM('L', 'P'),
            allowNull: true,
        },
        tmp_lahir: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        tgl_lahir: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        gol_drh: {
            type: DataTypes.ENUM('A', 'B', 'O', 'AB', '-'),
            allowNull: true,
        },
        agama: {
            type: DataTypes.STRING(12),
            allowNull: true,
        },
        almt_tgl: {
            type: DataTypes.STRING(60),
            allowNull: true,
        },
        no_telp: {
            type: DataTypes.STRING(13),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(70),
            allowNull: false,
        },
        stts_nikah: {
            type: DataTypes.ENUM('BELUM MENIKAH', 'MENIKAH', 'JANDA', 'DUDHA', 'JOMBLO'),
            allowNull: true,
        },
        kd_sps: {
            type: DataTypes.CHAR(5),
            allowNull: true,
        },
        alumni: {
            type: DataTypes.STRING(60),
            allowNull: true,
        },
        no_ijn_praktek: {
            type: DataTypes.STRING(120),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('0', '1'),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Dokter',
        tableName: 'dokter',
        timestamps: false,
    }
);
