
import { Response,Request } from "express";
import { Poliklinik } from "../models/PoliklinikModel";
import { Jadwal } from "../models/JadwalModel";
import { Dokter } from "../models/DokterModels";

Dokter.hasMany(Jadwal, { foreignKey: 'kd_dokter' });
Jadwal.belongsTo(Dokter, { foreignKey: 'kd_dokter' });

Poliklinik.hasMany(Jadwal, { foreignKey: 'kd_poli' });
Jadwal.belongsTo(Poliklinik, { foreignKey: 'kd_poli' });

export const OrmCrudControler = async (req: Request,res: Response) =>{
    try {
        const getData = await Poliklinik.findAll();
        res.json(getData)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Gagal ambil data Poli' });
    }
}



export const getJadwalDokter = async (req: Request, res: Response) => {
  // Nama hari mengikuti enum jadwal.hari_kerja di Khanza. Minggu disebut 'AKHAD',
  // dan tidak bergantung pada locale sistem.
  const HARI = ['AKHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'] as const;
  const hariIni = HARI[new Date().getDay()];

  // Daftar kode poli yang mau difilter
  const daftarPoli = ['U0003', 'U0004', 'U0001', 'U0008'];

  try {
    const jadwalHariIni = await Jadwal.findAll({
      where: { hari_kerja: hariIni },
      include: [
        {
          model: Dokter,
          attributes: ['nm_dokter']
        },
        {
          model: Poliklinik,
          attributes: ['nm_poli', 'kd_poli'],
          where: {
            kd_poli: daftarPoli // Filter di dalam relasi
          }
        }
      ]
    });

    const hasil = jadwalHariIni.map((item) => {
      const itemTyped = item as typeof item & {
        Dokter?: InstanceType<typeof Dokter>,
        Poliklinik?: InstanceType<typeof Poliklinik>
      };

      return {
        nama_dokter: itemTyped.Dokter?.nm_dokter,
        nama_poli: itemTyped.Poliklinik?.nm_poli,
        kode_poli: itemTyped.Poliklinik?.kd_poli
      };
    });

    res.json(hasil);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data dokter hari ini' });
  }
};
